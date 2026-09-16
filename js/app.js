/**
 * LLM 최저가 찾기 - 메인 애플리케이션 로직
 * 국가별 국기(KR/US/CN/EU) 필터링 + 3단 뷰 (모델별 / 사이트별 / 테이블)
 * 경량화, 초고속 렌더링, XSS 보안 강화 설계
 */

import {
  RAW_MODELS,
  PLATFORMS_INFO,
  COUNTRIES,
  processModelsData,
  getSiteGroupedData,
  getLastUpdatedTimestamp,
  refreshPriceData
} from './data.js';

import {
  calculateCustomUsageCost,
  compareProvidersForModel
} from './calculator.js';

// 안전한 HTML 이스케이프 함수 (XSS 방지)
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 숫자 포맷터 ($ 표기)
function formatMoney(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  if (amount === 0) return '$0.00';
  if (amount < 0.001) {
    return '$' + Number(amount).toFixed(4);
  }
  if (amount < 1) {
    return '$' + Number(amount).toFixed(3);
  }
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// 상태 객체
const state = {
  models: processModelsData(RAW_MODELS),
  searchQuery: '',
  activeFilter: 'all',
  activeCountry: 'ALL', // 'ALL' | 'KR' | 'US' | 'CN' | 'EU'
  modalProviderCountry: 'ALL', // 모달 공급 사이트 지역 필터 ('ALL' | 'ASIA' | 'EU' | 'US' | 'CN' | 'KR')
  modalModelCountry: 'ALL',    // 모달 비교 모델 지역 필터 ('ALL' | 'ASIA' | 'EU' | 'US' | 'CN' | 'KR')
  activeMediaType: 'all', // 'all' | 'Text' | 'Image' | 'Video' | 'Music'
  viewMode: 'table',    // 'table' (기본 보기) | 'cards' | 'sites'
  sortOrder: 'none',    // 'none' (기본) | 'lowest' (최저가 순) | 'highest' (최고가 순)
  onlyLowestPrice: false, // 모델별 최저가만 보기 플래그
  isCalcExpanded: false,  // 계산기 펼침 여부 (기본: 최소화)
  calcInputM: 10,       // 백만 토큰
  calcOutputM: 2,
  calcCacheM: 5,
  theme: localStorage.getItem('llm_theme') || 'dark'
};

// DOM 요소 참조
const elLastUpdated = document.getElementById('lastUpdatedText');
const btnSync = document.getElementById('btnSyncData');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const themeIcon = document.getElementById('themeIcon');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filters-group:not(.media-type-filters) .filter-btn');
const mediaBtns = document.querySelectorAll('.media-btn');
const flagBtns = document.querySelectorAll('.flag-btn');

// 가격 정렬 요소
const sortBtns = document.querySelectorAll('.sort-btn');
const thCostSort = document.getElementById('thCostSort');
const costHeaderSortIcon = document.getElementById('costHeaderSortIcon');

const btnToggleLowestOnly = document.getElementById('btnToggleLowestOnly');
const btnViewCards = document.getElementById('btnViewCards');
const btnViewSites = document.getElementById('btnViewSites');
const btnViewTable = document.getElementById('btnViewTable');

const modelsCardContainer = document.getElementById('modelsCardContainer');
const modelsSitesContainer = document.getElementById('modelsSitesContainer');
const modelsTableContainer = document.getElementById('modelsTableContainer');
const fullTableBody = document.getElementById('fullTableBody');
const tableToolbar = document.getElementById('tableToolbar');
const tableCountInfo = document.getElementById('tableCountInfo');
const tableLowestNotice = document.getElementById('tableLowestNotice');
const emptyState = document.getElementById('emptyState');

// 계산기 요소
const calcSection = document.getElementById('calcSection');
const calcToggleHeader = document.getElementById('calcToggleHeader');
const calcBody = document.getElementById('calcBody');
const btnToggleCalc = document.getElementById('btnToggleCalc');
const calcToggleText = document.getElementById('calcToggleText');
const calcToggleChevron = document.getElementById('calcToggleChevron');
const calcSummaryPill = document.getElementById('calcSummaryPill');
const inputCalcInput = document.getElementById('inputCalcInput');
const inputCalcOutput = document.getElementById('inputCalcOutput');
const inputCalcCache = document.getElementById('inputCalcCache');
const btnResetCalc = document.getElementById('btnResetCalc');

// 통계 요소
const cardStatModels = document.getElementById('cardStatModels');
const cardStatProviders = document.getElementById('cardStatProviders');
const statModelLabel = document.getElementById('statModelLabel');
const statTotalModels = document.getElementById('statTotalModels');
const statTotalProviders = document.getElementById('statTotalProviders');
const statMaxDiscount = document.getElementById('statMaxDiscount');
const statSupportedMedia = document.getElementById('statSupportedMedia');

// 모달 요소 (공급 사이트 57개 & 전체 비교 모델 152개)
const modalProviders = document.getElementById('modalProviders');
const backdropProviders = document.getElementById('backdropProviders');
const btnCloseProvidersModal = document.getElementById('btnCloseProvidersModal');
const inputFilterProvidersModal = document.getElementById('inputFilterProvidersModal');
const modalProvidersCountryTabs = document.getElementById('modalProvidersCountryTabs');
const modalProvidersCountBadge = document.getElementById('modalProvidersCountBadge');
const modalProvidersBody = document.getElementById('modalProvidersBody');

const modalModels = document.getElementById('modalModels');
const backdropModels = document.getElementById('backdropModels');
const btnCloseModelsModal = document.getElementById('btnCloseModelsModal');
const inputFilterModelsModal = document.getElementById('inputFilterModelsModal');
const modalModelsCountryTabs = document.getElementById('modalModelsCountryTabs');
const modalModelsCountBadge = document.getElementById('modalModelsCountBadge');
const modalModelsBody = document.getElementById('modalModelsBody');

// AI 맞춤 추천 요소
const inputUserTask = document.getElementById('inputUserTask');
const btnGetAiRecommend = document.getElementById('btnGetAiRecommend');
const recommendResultBox = document.getElementById('recommendResultBox');
const quickChips = document.querySelectorAll('.quick-chip');

/**
 * 테마 적용
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('llm_theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/**
 * 통계 지표 업데이트 (선택된 국가 기준 실시간 동적 연산)
 */
/**
 * 통계 지표 업데이트 (선택된 국가 기준 실시간 동적 연산)
 */
function updateHeroStats() {
  const activeCountry = state.activeCountry || 'ALL';
  const asianCountries = ['KR', 'CN', 'JP', 'SG', 'IN', 'ASIA'];
  
  let countryName = '전체 🌐';
  let targetModels = state.models;

  if (activeCountry === 'ALL') {
    countryName = '전체 🌐';
    targetModels = state.models;
  } else if (activeCountry === 'ASIA') {
    countryName = '아시아 🌏';
    targetModels = state.models.filter(m => asianCountries.includes(m.country) || m.region === 'Asia');
  } else {
    const countryInfo = COUNTRIES[activeCountry];
    countryName = countryInfo ? `${countryInfo.name} ${countryInfo.flag}` : activeCountry;
    targetModels = state.models.filter(m => m.country === activeCountry);
  }

  const providersSet = new Set();
  let maxDiscount = 0;
  const mediaSet = new Set();

  targetModels.forEach(m => {
    const mType = m.mediaType || 'Text';
    mediaSet.add(mType);

    m.offers.forEach(o => {
      providersSet.add(o.providerKey || o.provider);
      if (o.savingPercentVsOfficial > maxDiscount) {
        maxDiscount = o.savingPercentVsOfficial;
      }
    });
  });

  // 1. 모델 수
  if (statTotalModels) {
    statTotalModels.textContent = targetModels.length;
  }
  if (statModelLabel) {
    statModelLabel.textContent = `비교 모델 수 (${countryName})`;
  }

  // 2. 등록 공급 사이트
  if (statTotalProviders) {
    statTotalProviders.textContent = `${providersSet.size}개 사이트`;
  }

  // 3. 최대 할인율
  if (statMaxDiscount) {
    if (maxDiscount > 0) {
      statMaxDiscount.textContent = `${maxDiscount}% OFF`;
      statMaxDiscount.className = 'stat-val green mono';
    } else {
      statMaxDiscount.textContent = '공식 기준가';
      statMaxDiscount.className = 'stat-val mono';
    }
  }

  // 4. 지원 미디어
  if (statSupportedMedia) {
    const icons = [];
    if (mediaSet.has('Text')) icons.push('📝 Text');
    if (mediaSet.has('Image')) icons.push('🖼️ Image');
    if (mediaSet.has('Video')) icons.push('🎬 Video');
    if (mediaSet.has('Music')) icons.push('🎵 Music');

    statSupportedMedia.textContent = icons.length > 0 ? icons.join(' ') : '-';
  }
}

/**
 * 계산기 값 반영 및 유효성 검사
 */
function updateCalculatorValues() {
  const inputVal = parseFloat(inputCalcInput.value);
  const outputVal = parseFloat(inputCalcOutput.value);
  const cacheVal = parseFloat(inputCalcCache.value);

  state.calcInputM = isNaN(inputVal) || inputVal < 0 ? 0 : inputVal;
  state.calcOutputM = isNaN(outputVal) || outputVal < 0 ? 0 : outputVal;
  state.calcCacheM = isNaN(cacheVal) || cacheVal < 0 ? 0 : cacheVal;

  if (calcSummaryPill) {
    calcSummaryPill.textContent = `현재 기준: In ${state.calcInputM}M / Out ${state.calcOutputM}M / Cache ${state.calcCacheM}M`;
  }

  render();
}

/**
 * 계산기 펼치기/접기 토글 (기본값: 최소화)
 */
function toggleCalculator() {
  state.isCalcExpanded = !state.isCalcExpanded;
  if (calcBody) {
    calcBody.style.display = state.isCalcExpanded ? 'block' : 'none';
  }
  if (calcSection) {
    calcSection.classList.toggle('expanded', state.isCalcExpanded);
  }
  if (calcToggleText) {
    calcToggleText.textContent = state.isCalcExpanded ? '사용량 입력 접기' : '사용량 입력 펼치기';
  }
  if (calcToggleChevron) {
    calcToggleChevron.style.transform = state.isCalcExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
  }
  if (calcToggleHeader) {
    calcToggleHeader.setAttribute('aria-expanded', state.isCalcExpanded);
  }
}

/**
 * 필터링된 모델 목록 반환 (국가 필터 + 텍스트 검색 + 카테고리 필터)
 */
function getFilteredModels() {
  const query = state.searchQuery.trim().toLowerCase();
  const asianCountries = ['KR', 'CN', 'JP', 'SG', 'IN', 'ASIA'];

  let filtered = state.models.filter(model => {
    // 0. 미디어 타입 필터
    const modelMediaType = model.mediaType || 'Text';
    if (state.activeMediaType !== 'all' && modelMediaType !== state.activeMediaType) {
      return false;
    }

    // 1. 국가 / 아시아 / 유럽 필터
    if (state.activeCountry !== 'ALL') {
      if (state.activeCountry === 'ASIA') {
        if (!asianCountries.includes(model.country) && model.region !== 'Asia') {
          return false;
        }
      } else if (state.activeCountry === 'EU') {
        const euCountries = ['EU', 'FR', 'DE', 'GB', 'UK'];
        if (!euCountries.includes(model.country) && model.region !== 'Europe' && !(model.countryLabel && model.countryLabel.includes('유럽'))) {
          return false;
        }
      } else if (model.country !== state.activeCountry) {
        return false;
      }
    }

    // 2. 텍스트 검색
    const isModelAsian = asianCountries.includes(model.country) || model.region === 'Asia';
    const matchAsia = (query === '아시아' || query === 'asia') && isModelAsian;

    const matchName = model.name.toLowerCase().includes(query);
    const matchCreator = model.creator.toLowerCase().includes(query);
    const matchCountry = (model.countryLabel || '').toLowerCase().includes(query);
    const matchProvider = model.offers.some(o => o.provider.toLowerCase().includes(query));
    const matchCategory = model.category.toLowerCase().includes(query);
    const matchMedia = modelMediaType.toLowerCase().includes(query);
    const matchesSearch = !query || matchName || matchCreator || matchCountry || matchProvider || matchCategory || matchMedia || matchAsia;

    if (!matchesSearch) return false;

    // 3. 카테고리 / 할인 필터
    if (state.activeFilter === 'all') return true;
    if (state.activeFilter === 'discounted') {
      return model.maxDiscountPercent > 0;
    }
    // 음악/오디오 필터는 Music Generation과 Audio TTS 모두 포함
    if (state.activeFilter === 'Music Generation') {
      return model.category === 'Music Generation' || model.category === 'Audio TTS';
    }
    return model.category === state.activeFilter;
  });

  // 4. 가격 정렬 (없음: none / 최저가 순: lowest / 최고가 순: highest)
  if (state.sortOrder === 'lowest' || state.sortOrder === 'highest') {
    filtered = [...filtered].sort((a, b) => {
      const compA = compareProvidersForModel(a, state.calcInputM, state.calcOutputM, state.calcCacheM);
      const compB = compareProvidersForModel(b, state.calcInputM, state.calcOutputM, state.calcCacheM);
      const costA = compA.bestOffer && typeof compA.bestOffer.totalCost === 'number' ? compA.bestOffer.totalCost : 999999;
      const costB = compB.bestOffer && typeof compB.bestOffer.totalCost === 'number' ? compB.bestOffer.totalCost : 999999;

      if (costA === costB) {
        return a.name.localeCompare(b.name);
      }
      return state.sortOrder === 'lowest' ? costA - costB : costB - costA;
    });
  }

  return filtered;
}

/**
 * 필터링된 사이트(플랫폼) 목록 반환 (국가 필터 연동)
 */
function getFilteredSites() {
  const query = state.searchQuery.trim().toLowerCase();
  const allSites = getSiteGroupedData(state.models);
  const asianCountries = ['KR', 'CN', 'JP', 'SG', 'IN', 'ASIA'];
  const euCountries = ['EU', 'FR', 'DE', 'GB', 'UK'];

  return allSites.map(site => {
    // 사이트 자체 국가 검사 또는 사이트 내 모델의 국가 매칭
    const isSiteAsian = asianCountries.includes(site.country) || /아시아|한국|중국|일본|싱가포르|인도/.test(site.countryLabel || '');
    const isSiteEu = euCountries.includes(site.country) || /유럽|프랑스|독일|영국/.test(site.countryLabel || '');
    
    let siteMatchesCountry = true;
    if (state.activeCountry === 'ASIA') {
      siteMatchesCountry = isSiteAsian;
    } else if (state.activeCountry === 'EU') {
      siteMatchesCountry = isSiteEu;
    } else if (state.activeCountry !== 'ALL') {
      siteMatchesCountry = (site.country === state.activeCountry);
    }

    const matchSiteName = site.name.toLowerCase().includes(query);
    const matchSiteDesc = site.description.toLowerCase().includes(query);
    const matchSiteCountry = (site.countryLabel || '').toLowerCase().includes(query);
    const matchAsia = (query === '아시아' || query === 'asia') && isSiteAsian;

    const matchingModels = site.models.filter(item => {
      // 국가 필터 적용
      if (state.activeCountry !== 'ALL') {
        const isItemAsian = asianCountries.includes(item.country);
        const isItemEu = euCountries.includes(item.country) || (item.countryLabel && item.countryLabel.includes('유럽'));
        if (state.activeCountry === 'ASIA') {
          if (!isItemAsian && !isSiteAsian) return false;
        } else if (state.activeCountry === 'EU') {
          if (!isItemEu && !isSiteEu) return false;
        } else if (item.country !== state.activeCountry && site.country !== state.activeCountry) {
          return false;
        }
      }

      const matchModelName = item.modelName.toLowerCase().includes(query);
      const matchCreator = item.creator.toLowerCase().includes(query);
      const matchesSearch = !query || matchSiteName || matchSiteDesc || matchSiteCountry || matchModelName || matchCreator || matchAsia;

      if (!matchesSearch) return false;

      if (state.onlyLowestPrice && !item.offer.isLowest) return false;

      if (state.activeFilter === 'all') return true;
      if (state.activeFilter === 'discounted') {
        return item.offer.savingPercentVsOfficial > 0;
      }
      return item.category === state.activeFilter;
    });

    return {
      ...site,
      matchingModels
    };
  }).filter(site => site.matchingModels.length > 0);
}

/**
 * 1. 모델별 카드 뷰 렌더링
 */
function renderCardView(filteredModels) {
  if (filteredModels.length === 0) {
    modelsCardContainer.innerHTML = '';
    return;
  }

  const inputTokens = state.calcInputM * 1_000_000;
  const outputTokens = state.calcOutputM * 1_000_000;
  const cacheTokens = state.calcCacheM * 1_000_000;

  const html = filteredModels.map(model => {
    const comparison = compareProvidersForModel(model, inputTokens, outputTokens, cacheTokens);
    const bestProvider = comparison.bestOffer;

    const offersToRender = state.onlyLowestPrice
      ? model.offers.filter(offer => offer.provider === bestProvider.provider)
      : model.offers;

    const finalOffers = (state.onlyLowestPrice && offersToRender.length === 0)
      ? [model.offers[0]]
      : offersToRender;

    const offersRowsHtml = finalOffers.map(offer => {
      const isLowest = offer.provider === bestProvider.provider;
      const userCost = calculateCustomUsageCost(offer, inputTokens, outputTokens, cacheTokens);
      
      const officialOffer = model.offers.find(o => o.isOfficial) || model.offers[0];
      const officialUserCost = calculateCustomUsageCost(officialOffer, inputTokens, outputTokens, cacheTokens).totalCost;
      const savedVsOfficial = officialUserCost - userCost.totalCost;
      const savedPercent = officialUserCost > 0 ? Math.round((savedVsOfficial / officialUserCost) * 100) : 0;

      const rowClass = isLowest ? 'row-lowest' : '';
      const typeBadgeClass = offer.isOfficial ? 'official' : (offer.providerKey === 'huggingface' || offer.providerKey === 'fireworks' || offer.providerKey === 'deepinfra' || offer.providerKey === 'groq' ? 'hosting' : 'aggregator');
      const typeText = offer.isOfficial ? '공식 개발사' : (typeBadgeClass === 'hosting' ? '오픈 호스팅' : '통합 중개');

      const isNonTextModel = !!(offer.pricePerUnit !== undefined && offer.pricePerUnit !== null);
      
      return `
        <tr class="${rowClass}">
          <td>
            <div class="provider-cell">
              <span class="provider-name">${escapeHtml(offer.provider)}</span>
              <span class="provider-type-badge ${typeBadgeClass}">${typeText}</span>
              ${isLowest ? '<span class="badge-lowest">최저가</span>' : ''}
            </div>
          </td>
          <td class="mono price-val ${isLowest ? 'lowest' : ''}">
            ${isNonTextModel ? `<span class="price-unit-tag">${formatMoney(offer.pricePerUnit)}/${escapeHtml(offer.priceUnit || '단위')}</span>` : formatMoney(offer.inputPer1M)}
          </td>
          <td class="mono price-val ${isLowest ? 'lowest' : ''}">
            ${isNonTextModel ? '-' : formatMoney(offer.outputPer1M)}
          </td>
          <td class="mono text-muted" style="color: var(--text-subtle)">
            ${isNonTextModel ? '-' : (offer.cacheReadPer1M !== null ? formatMoney(offer.cacheReadPer1M) : '-')}
          </td>
          <td class="mono">
            <span class="price-calc-val ${isLowest ? 'lowest' : ''}">${formatMoney(userCost.totalCost, 2)}</span>
            ${savedPercent > 0 ? `<span class="saving-tag">-${savedPercent}% (${formatMoney(savedVsOfficial, 2)} 절약)</span>` : ''}
          </td>
          <td>
            ${offer.savingPercentVsOfficial > 0 
              ? `<span class="badge-discount mono">-${offer.savingPercentVsOfficial}%</span>` 
              : `<span style="color: var(--text-subtle); font-size: 0.8rem;">기준가</span>`}
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">
            ${escapeHtml(offer.latency || 'Standard')}
          </td>
          <td>
            <a href="${escapeHtml(offer.siteUrl)}" target="_blank" rel="noopener noreferrer" class="site-link-btn">
              <span>방문</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <article class="model-card ${model.maxDiscountPercent > 0 ? 'has-lowest' : ''}">
        <header class="model-card-header">
          <div class="model-meta">
            <h3 class="model-name">${escapeHtml(model.name)}</h3>
            <!-- 국가 국기 배지 -->
            <span class="badge-country">${escapeHtml(model.flagEmoji || '🌐')} ${escapeHtml(model.countryLabel || '')}</span>
            <span class="badge-tag creator">${escapeHtml(model.creator)}</span>
            <span class="badge-tag category">${escapeHtml(model.category)}</span>
            <span class="badge-tag context">컨텍스트: ${escapeHtml(model.contextWindow)}</span>
            <p class="model-desc">${escapeHtml(model.description)}</p>
          </div>

          <div class="model-best-summary">
            ${bestProvider ? `
              <div style="text-align: right;">
                <div style="font-size: 0.75rem; color: var(--text-subtle);">최저가 제공처</div>
                <div style="font-weight: 700; color: var(--accent-green);">${escapeHtml(bestProvider.provider)}</div>
              </div>
            ` : ''}
            ${model.maxDiscountPercent > 0 ? `
              <span class="badge-discount">최대 ${model.maxDiscountPercent}% 절감</span>
            ` : ''}
          </div>
        </header>

        <div class="offers-table-wrap">
          <table class="offers-table">
            <thead>
              <tr>
                <th>제공처 (플랫폼)</th>
                <th>입력 토큰 (1M)</th>
                <th>출력 토큰 (1M)</th>
                <th>캐시 읽기 (1M)</th>
                <th>예상 비용 (${state.calcInputM}M In / ${state.calcOutputM}M Out)</th>
                <th>공식 대비 할인</th>
                <th>응답 속도</th>
                <th>링크</th>
              </tr>
            </thead>
            <tbody>
              ${offersRowsHtml}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }).join('');

  modelsCardContainer.innerHTML = html;
}

/**
 * 2. 사이트(플랫폼)별 탐색 뷰 렌더링
 */
function renderSitesView(filteredSites) {
  if (filteredSites.length === 0) {
    modelsSitesContainer.innerHTML = '';
    return;
  }

  const inputTokens = state.calcInputM * 1_000_000;
  const outputTokens = state.calcOutputM * 1_000_000;
  const cacheTokens = state.calcCacheM * 1_000_000;

  const html = filteredSites.map(site => {
    const modelsRowsHtml = site.matchingModels.map(item => {
      const offer = item.offer;
      const userCost = calculateCustomUsageCost(offer, inputTokens, outputTokens, cacheTokens);
      const isLowest = offer.isLowest;

      return `
        <tr class="${isLowest ? 'row-lowest' : ''}">
          <td>
            <div style="font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.35rem;">
              <span>${escapeHtml(item.flagEmoji || '🌐')}</span>
              <span>${escapeHtml(item.modelName)}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-subtle);">${escapeHtml(item.creator)} • ${escapeHtml(item.contextWindow)}</div>
          </td>
          <td>
            <span class="badge-tag category" style="font-size: 0.72rem;">${escapeHtml(item.category)}</span>
          </td>
          <td class="mono price-val ${isLowest ? 'lowest' : ''}">
            ${offer.pricePerUnit ? `${formatMoney(offer.pricePerUnit)}/${offer.priceUnit || '단위'}` : formatMoney(offer.inputPer1M)}
          </td>
          <td class="mono price-val ${isLowest ? 'lowest' : ''}">
            ${offer.pricePerUnit ? '-' : formatMoney(offer.outputPer1M)}
          </td>
          <td class="mono">
            <span class="price-calc-val ${isLowest ? 'lowest' : ''}">${formatMoney(userCost.totalCost, 2)}</span>
          </td>
          <td>
            ${offer.savingPercentVsOfficial > 0 
              ? `<span class="badge-discount mono">-${offer.savingPercentVsOfficial}%</span>` 
              : `<span style="color: var(--text-subtle); font-size: 0.8rem;">기준가</span>`}
          </td>
          <td>
            ${isLowest ? '<span class="badge-lowest">최저가</span>' : '<span style="color: var(--text-subtle); font-size: 0.8rem;">일반</span>'}
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">
            ${escapeHtml(offer.note || offer.latency || '')}
          </td>
          <td>
            <a href="${escapeHtml(offer.siteUrl)}" target="_blank" rel="noopener noreferrer" class="site-link-btn">
              <span>이동</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </td>
        </tr>
      `;
    }).join('');

    const featuresHtml = (site.features || []).map(f => `
      <span class="site-feature-pill">✓ ${escapeHtml(f)}</span>
    `).join('');

    return `
      <article class="site-card ${site.lowestCount > 0 ? 'has-lowest-models' : ''}">
        <header class="site-card-header">
          <div class="site-header-left">
            <div class="site-title-row">
              <span style="font-size: 1.3rem;">${escapeHtml(site.flag || '🌐')}</span>
              <h3 class="site-name">${escapeHtml(site.name)}</h3>
              <span class="provider-type-badge ${escapeHtml(site.badgeClass || 'aggregator')}">
                ${escapeHtml(site.typeLabel || '서비스')}
              </span>
              <span class="badge-country">${escapeHtml(site.countryLabel || '글로벌')}</span>
              ${site.lowestCount > 0 ? `
                <span class="badge-site-lowest-count mono">🔥 ${site.lowestCount}개 모델 최저가</span>
              ` : ''}
            </div>

            <p class="site-desc">${escapeHtml(site.description || '')}</p>

            <div class="site-features-row">
              ${featuresHtml}
            </div>
          </div>

          <div class="site-header-right">
            <div class="site-stats-summary">
              <span style="font-size: 0.82rem; color: var(--text-muted);">
                제공 모델 <strong class="mono" style="color: var(--text-main); font-size: 1rem;">${site.matchingModels.length}</strong>개
              </span>
              <a href="${escapeHtml(site.siteUrl)}" target="_blank" rel="noopener noreferrer" class="btn-action" style="padding: 0.35rem 0.75rem;">
                <span>사이트 방문</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        </header>

        <div class="offers-table-wrap">
          <table class="offers-table">
            <thead>
              <tr>
                <th>서비스 모델</th>
                <th>분류</th>
                <th>입력 토큰 (1M)</th>
                <th>출력 토큰 (1M)</th>
                <th>예상 청구액 (${state.calcInputM}M / ${state.calcOutputM}M)</th>
                <th>할인율</th>
                <th>최저가</th>
                <th>특징 / 비고</th>
                <th>링크</th>
              </tr>
            </thead>
            <tbody>
              ${modelsRowsHtml}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }).join('');

  modelsSitesContainer.innerHTML = html;
}

/**
 * 3. 전체 종합 비교 테이블 뷰 렌더링 (기본 뷰)
 */
function renderTableView(filteredModels) {
  if (filteredModels.length === 0) {
    fullTableBody.innerHTML = '';
    if (tableCountInfo) tableCountInfo.innerHTML = '비교 모델 총 <strong>0개</strong>';
    return;
  }

  const inputTokens = state.calcInputM * 1_000_000;
  const outputTokens = state.calcOutputM * 1_000_000;
  const cacheTokens = state.calcCacheM * 1_000_000;

  if (tableCountInfo) {
    tableCountInfo.innerHTML = `비교 모델 총 <strong>${filteredModels.length}개</strong> ${state.onlyLowestPrice ? '<span style="color: #fbbf24; font-weight: 700;">(⭐ 모델별 단일 최저가)</span>' : ''}`;
  }
  if (tableLowestNotice) {
    tableLowestNotice.style.display = state.onlyLowestPrice ? 'inline-flex' : 'none';
  }

  const rows = [];

  filteredModels.forEach(model => {
    const comparison = compareProvidersForModel(model, inputTokens, outputTokens, cacheTokens);
    const bestProvider = comparison.bestOffer;

    const offersToRender = state.onlyLowestPrice
      ? model.offers.filter(offer => offer.provider === bestProvider.provider)
      : model.offers;

    const finalOffers = (state.onlyLowestPrice && offersToRender.length === 0)
      ? [model.offers[0]]
      : offersToRender;

    finalOffers.forEach(offer => {
      const isLowest = offer.provider === bestProvider.provider;
      const userCost = calculateCustomUsageCost(offer, inputTokens, outputTokens, cacheTokens);
      const typeBadgeClass = offer.isOfficial ? 'official' : (offer.providerKey === 'huggingface' || offer.providerKey === 'fireworks' || offer.providerKey === 'deepinfra' || offer.providerKey === 'groq' ? 'hosting' : 'aggregator');
      const isNonText = !!(offer.pricePerUnit !== undefined && offer.pricePerUnit !== null);

      rows.push(`
        <tr class="${isLowest ? 'row-lowest' : ''}">
          <td style="font-weight: 700;">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 1.1rem;">${escapeHtml(model.flagEmoji || '🌐')}</span>
              <span class="table-model-name">${escapeHtml(model.name)}</span>
              ${model.mediaType && model.mediaType !== 'Text' ? `<span class="badge-tag media-${model.mediaType.toLowerCase()}">${model.mediaType}</span>` : ''}
            </div>
            <span style="font-size: 0.75rem; color: var(--text-subtle); display: block; margin-top: 2px;">${escapeHtml(model.creator)} (${escapeHtml(model.countryLabel || '')}) • ${escapeHtml(model.category || '')}</span>
          </td>
          <td>
            <span style="font-weight: 700;">${escapeHtml(offer.provider)}</span>
            ${isLowest ? '<span class="badge-lowest" style="margin-left: 0.4rem;">최저가</span>' : ''}
          </td>
          <td>
            <span class="provider-type-badge ${typeBadgeClass}">
              ${offer.isOfficial ? '공식' : (typeBadgeClass === 'hosting' ? '오픈호스팅' : '통합중개')}
            </span>
          </td>
          <td class="mono price-val ${isLowest ? 'lowest' : ''}">
            ${isNonText ? `<span class="price-unit-tag">${formatMoney(offer.pricePerUnit)}/${escapeHtml(offer.priceUnit || '단위')}</span>` : formatMoney(offer.inputPer1M)}
          </td>
          <td class="mono price-val ${isLowest ? 'lowest' : ''}">
            ${isNonText ? '-' : formatMoney(offer.outputPer1M)}
          </td>
          <td class="mono" style="color: var(--text-subtle)">
            ${isNonText ? '-' : (offer.cacheReadPer1M !== null ? formatMoney(offer.cacheReadPer1M) : '-')}
          </td>
          <td class="mono price-calc-val ${isLowest ? 'lowest' : ''}">
            ${formatMoney(userCost.totalCost, 2)}
          </td>
          <td>
            ${offer.savingPercentVsOfficial > 0 
              ? `<span class="badge-discount mono">-${offer.savingPercentVsOfficial}%</span>` 
              : `<span style="color: var(--text-subtle); font-size: 0.8rem;">기준가</span>`}
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">
            ${escapeHtml(offer.latency || 'Normal')}
          </td>
          <td>
            <a href="${escapeHtml(offer.siteUrl)}" target="_blank" rel="noopener noreferrer" class="site-link-btn">
              <span>이동</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </td>
        </tr>
      `);
    });
  });

  fullTableBody.innerHTML = rows.join('');
}

// ==========================================================================
// 공급사 및 모델 대표 로고 매핑 & 모달 팝업 컨트롤러
// ==========================================================================

// 제작사 및 플랫폼별 공식 도메인 매핑 (고화질 파비콘/로고 추출용)
const BRAND_DOMAINS = {
  // 글로벌 주요 개발사
  'OpenAI': 'openai.com',
  'Anthropic': 'anthropic.com',
  'Google': 'google.com',
  'Meta': 'meta.com',
  'DeepSeek': 'deepseek.com',
  'Alibaba': 'alibabacloud.com',
  'Mistral AI': 'mistral.ai',
  'Microsoft': 'microsoft.com',
  'Hugging Face': 'huggingface.co',
  'Cohere': 'cohere.com',
  'xAI': 'x.ai',
  'Stability AI': 'stability.ai',
  'Black Forest Labs': 'blackforestlabs.ai',
  'Runway': 'runwayml.com',
  'Luma AI': 'lumalabs.ai',
  'Pika Labs': 'pika.art',
  'Recraft AI': 'recraft.ai',
  'Suno': 'suno.com',
  'Udio': 'udio.com',
  'ElevenLabs': 'elevenlabs.io',
  'Together AI': 'together.ai',
  'Groq': 'groq.com',
  'DeepInfra': 'deepinfra.com',
  'Fireworks AI': 'fireworks.ai',
  'OpenRouter': 'openrouter.ai',
  'Amazon Bedrock': 'aws.amazon.com',
  'KIE API': 'kie.ai',

  // 한국 (🇰🇷)
  'Naver': 'naver.com',
  'Upstage': 'upstage.ai',
  'Kakao': 'kakaocorp.com',
  'LG AI Research': 'lgresearch.ai',
  'KT': 'kt.com',
  'SK telecom': 'sktelecom.com',
  'NCSOFT': 'ncsoft.com',
  'Bllossom Team': 'huggingface.co',

  // 중국 (🇨🇳)
  'Zhipu AI': 'bigmodel.cn',
  'Moonshot AI': 'moonshot.cn',
  '01.AI': '01.ai',
  'Baidu': 'baidu.com',
  'Tencent': 'tencent.com',
  'SenseTime': 'sensetime.com',
  'ByteDance': 'bytedance.com',
  'StepFun': 'stepfun.com',
  'iFlytek': 'iflytek.com',
  'InternLM': 'internlm.org',
  'Xiaomi': 'mi.com',
  'Taichu': 'ia.ac.cn',
  'PixVerse': 'pixverse.ai',
  'Viggle': 'viggle.ai',
  'Kuaishou': 'kuaishou.com',
  // 아시아 & 기타 글로벌 플랫폼 (Arena, BytePlus, Genspark 등)
  'Arena': 'arena.ai',
  'Arena.ai': 'arena.ai',
  'BytePlus': 'byteplus.com',
  'ByteDance': 'bytedance.com',
  'Genspark': 'genspark.ai',

  // 일본 & 아시아 (🇯🇵 🇸🇬 🇮🇳)
  'RIKEN / Tokyo Tech': 'riken.jp',
  'Rakuten': 'rakuten.com',
  'CyberAgent': 'cyberagent.co.jp',
  'NEC': 'nec.com',
  'AI Singapore': 'aisingapore.org',
  'Krutrim': 'krutrim.com',
  'Sarvam AI': 'sarvam.ai'
};

function getDomainFromUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

function getLogoUrl(domain) {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/**
 * 모달 공급 사이트의 지역/국가 필터 일치 여부 판별
 */
function isSiteMatchingRegion(site, regionKey) {
  if (!regionKey || regionKey === 'ALL') return true;
  const asianCountries = ['KR', 'CN', 'JP', 'SG', 'IN', 'ASIA'];
  const euCountries = ['EU', 'FR', 'DE', 'GB', 'UK'];
  const usCountries = ['US', 'CA'];

  const cCode = (site.country || '').toUpperCase();
  const cLabel = (site.countryLabel || '').toLowerCase();

  if (regionKey === 'ASIA') {
    return asianCountries.includes(cCode) || 
      /아시아|한국|중국|일본|싱가포르|인도/.test(cLabel);
  }
  if (regionKey === 'EU') {
    return euCountries.includes(cCode) || 
      /유럽|프랑스|독일|영국/.test(cLabel);
  }
  if (regionKey === 'US') {
    return usCountries.includes(cCode) || 
      /미국|북미|캐나다/.test(cLabel);
  }
  if (regionKey === 'CN') {
    return cCode === 'CN' || cLabel.includes('중국');
  }
  if (regionKey === 'KR') {
    return cCode === 'KR' || cLabel.includes('한국');
  }
  return true;
}

/**
 * 1. 등록 공급 사이트 모달 렌더링 (지역 필터 + 검색어 지원)
 */
function renderProvidersModal(query = '') {
  if (!modalProvidersBody) return;
  const q = query.trim().toLowerCase();
  const allSites = getSiteGroupedData(state.models);
  const activeRegion = state.modalProviderCountry || 'ALL';

  const filteredSites = allSites.filter(site => {
    // 1. 지역/국가 필터
    if (!isSiteMatchingRegion(site, activeRegion)) {
      return false;
    }

    // 2. 검색어 필터
    if (!q) return true;
    const matchName = site.name.toLowerCase().includes(q);
    const matchDesc = (site.description || '').toLowerCase().includes(q);
    const matchCountry = (site.countryLabel || '').toLowerCase().includes(q);
    const matchId = site.id.toLowerCase().includes(q);
    return matchName || matchDesc || matchCountry || matchId;
  });

  if (modalProvidersCountBadge) {
    modalProvidersCountBadge.textContent = `${filteredSites.length}개 / 총 ${allSites.length}개`;
  }

  if (filteredSites.length === 0) {
    const regionNames = {
      ALL: '전체',
      ASIA: '아시아',
      EU: '유럽',
      US: '미국',
      CN: '중국',
      KR: '한국'
    };
    const regionLabel = regionNames[activeRegion] || activeRegion;
    const queryMsg = q ? `'${escapeHtml(query)}' 검색 결과가 없습니다.` : `${regionLabel} 지역에 해당하는 공급 사이트가 없습니다.`;

    modalProvidersBody.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; font-weight: 700;">${queryMsg}</p>
        <p style="font-size: 0.85rem; margin-top: 0.35rem;">다른 지역 탭(전체, 아시아, 한국, 미국 등)을 선택하거나 검색어를 변경해 보세요.</p>
      </div>
    `;
    return;
  }

  const cardsHtml = filteredSites.map(site => {
    return `
      <div class="provider-modal-card">
        <div>
          <div class="provider-card-top">
            <div class="provider-card-info">
              <div class="provider-card-name-row">
                <span class="provider-card-flag">${site.flag || '🌐'}</span>
                <span class="provider-card-title" title="${escapeHtml(site.name)}">${escapeHtml(site.name)}</span>
              </div>
              <div class="provider-card-badge-row">
                <span class="provider-type-badge ${escapeHtml(site.badgeClass || 'official')}">${escapeHtml(site.typeLabel || '공식')}</span>
                <span style="font-size: 0.72rem; color: var(--text-subtle);">${escapeHtml(site.countryLabel || '')}</span>
              </div>
            </div>
          </div>
          <div class="provider-card-desc" title="${escapeHtml(site.description || '')}">
            ${escapeHtml(site.description || '최신 AI 언어/멀티모달 모델 API 서비스 제공.')}
          </div>
        </div>
        <div class="provider-card-bottom">
          <span class="provider-card-model-count">
            비교 모델 <strong>${site.modelsCount}개</strong>
          </span>
          <div class="provider-card-actions">
            <button type="button" class="btn-provider-filter" data-provider-name="${escapeHtml(site.name)}" title="메인 화면에서 이 사이트의 모델들을 필터링">
              모델 비교
            </button>
            <a href="${escapeHtml(site.siteUrl)}" target="_blank" rel="noopener noreferrer" class="btn-provider-link" title="공식 사이트 바로가기">
              <span>웹</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  modalProvidersBody.innerHTML = `<div class="modal-providers-grid">${cardsHtml}</div>`;

  // 모달 내부 "모델 비교" 버튼 이벤트 바인딩
  modalProvidersBody.querySelectorAll('.btn-provider-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pName = btn.getAttribute('data-provider-name');
      closeProvidersModal();
      if (searchInput) {
        searchInput.value = pName;
        state.searchQuery = pName;
        render();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

function openProvidersModal() {
  if (!modalProviders) return;
  modalProviders.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // 지역 탭 활성 상태 동기화
  if (modalProvidersCountryTabs) {
    const activeRegion = state.modalProviderCountry || 'ALL';
    modalProvidersCountryTabs.querySelectorAll('.modal-country-btn').forEach(btn => {
      const isMatch = btn.getAttribute('data-country') === activeRegion;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  if (inputFilterProvidersModal) {
    inputFilterProvidersModal.value = '';
    setTimeout(() => inputFilterProvidersModal.focus(), 50);
  }
  renderProvidersModal('');
}

function closeProvidersModal() {
  if (!modalProviders) return;
  modalProviders.style.display = 'none';
  document.body.style.overflow = '';
}

/**
 * 모달 비교 모델의 지역/국가 필터 일치 여부 판별
 */
function isModelMatchingRegion(model, regionKey) {
  if (!regionKey || regionKey === 'ALL') return true;
  const asianCountries = ['KR', 'CN', 'JP', 'SG', 'IN', 'ASIA'];
  const euCountries = ['EU', 'FR', 'DE', 'GB', 'UK'];
  const usCountries = ['US', 'CA'];

  const cCode = (model.country || '').toUpperCase();
  const cLabel = (model.countryLabel || '').toLowerCase();
  const region = (model.region || '').toLowerCase();

  if (regionKey === 'ASIA') {
    return asianCountries.includes(cCode) || region === 'asia' || /아시아|한국|중국|일본|싱가포르|인도/.test(cLabel);
  }
  if (regionKey === 'EU') {
    return euCountries.includes(cCode) || region === 'europe' || /유럽|프랑스|독일|영국/.test(cLabel);
  }
  if (regionKey === 'US') {
    return usCountries.includes(cCode) || region === 'north america' || /미국|북미|캐나다/.test(cLabel);
  }
  if (regionKey === 'CN') {
    return cCode === 'CN' || cLabel.includes('중국');
  }
  if (regionKey === 'KR') {
    return cCode === 'KR' || cLabel.includes('한국');
  }
  return true;
}

/**
 * 2. 전체 비교 모델 모달 렌더링 (지역 필터 + 검색어 지원)
 */
function renderModelsModal(query = '') {
  if (!modalModelsBody) return;
  const q = query.trim().toLowerCase();
  const allModels = state.models;
  const activeRegion = state.modalModelCountry || 'ALL';

  const filteredModels = allModels.filter(m => {
    // 1. 지역/국가 필터
    if (!isModelMatchingRegion(m, activeRegion)) {
      return false;
    }

    // 2. 검색어 필터
    if (!q) return true;
    const matchName = m.name.toLowerCase().includes(q);
    const matchCreator = m.creator.toLowerCase().includes(q);
    const matchCategory = m.category.toLowerCase().includes(q);
    const matchCountry = (m.countryLabel || '').toLowerCase().includes(q);
    return matchName || matchCreator || matchCategory || matchCountry;
  });

  if (modalModelsCountBadge) {
    modalModelsCountBadge.textContent = `${filteredModels.length}개 / 총 ${allModels.length}개`;
  }

  if (filteredModels.length === 0) {
    const regionNames = {
      ALL: '전체',
      ASIA: '아시아',
      EU: '유럽',
      US: '미국',
      CN: '중국',
      KR: '한국'
    };
    const regionLabel = regionNames[activeRegion] || activeRegion;
    const queryMsg = q ? `'${escapeHtml(query)}' 검색 결과가 없습니다.` : `${regionLabel} 지역에 해당하는 LLM 모델이 없습니다.`;

    modalModelsBody.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; font-weight: 700;">${queryMsg}</p>
        <p style="font-size: 0.85rem; margin-top: 0.35rem;">다른 지역 탭(전체, 아시아, 한국, 미국 등)을 선택하거나 검색어를 변경해 보세요.</p>
      </div>
    `;
    return;
  }

  const cardsHtml = filteredModels.map(model => {
    // 단일 최저가 산출
    const comp = compareProvidersForModel(model, state.calcInputM, state.calcOutputM, state.calcCacheM);
    const bestOffer = comp.bestOffer;
    const bestPriceText = model.isUnitBased
      ? `${formatMoney(bestOffer.unitCost || bestOffer.totalCost)} / ${escapeHtml(model.priceUnit || '단위')}`
      : `예상 ${formatMoney(bestOffer.totalCost, 2)} (${escapeHtml(bestOffer.provider)})`;

    return `
      <div class="model-modal-card" data-model-name="${escapeHtml(model.name)}" title="클릭하여 메인 화면에서 이 모델을 검색">
        <div>
          <div class="model-card-top">
            <div class="model-card-info">
              <div class="model-card-name-row">
                <span class="model-card-flag">${model.flagEmoji || '🌐'}</span>
                <span class="model-card-title" title="${escapeHtml(model.name)}">${escapeHtml(model.name)}</span>
              </div>
              <div class="model-card-creator">${escapeHtml(model.creator)} · ${escapeHtml(model.countryLabel || '')}</div>
              <div class="model-card-badge-row">
                <span class="model-badge-cat">${escapeHtml(model.category)}</span>
                <span class="model-badge-ctx">${escapeHtml(model.contextWindow || '128K')}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="model-card-bottom">
          <div class="model-card-price-info">
            <span class="model-card-price-label">최저가 기준</span>
            <span class="model-card-price-val">${bestPriceText}</span>
          </div>
          <span class="btn-model-select">
            <span>선택</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
      </div>
    `;
  }).join('');

  modalModelsBody.innerHTML = `<div class="modal-models-grid">${cardsHtml}</div>`;

  // 모달 내부 카드 클릭 시 메인 화면 검색 연동
  modalModelsBody.querySelectorAll('.model-modal-card').forEach(card => {
    card.addEventListener('click', () => {
      const mName = card.getAttribute('data-model-name');
      closeModelsModal();
      if (searchInput) {
        searchInput.value = mName;
        state.searchQuery = mName;
        render();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

function openModelsModal() {
  if (!modalModels) return;
  modalModels.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // 지역 탭 활성 상태 동기화
  if (modalModelsCountryTabs) {
    const activeRegion = state.modalModelCountry || 'ALL';
    modalModelsCountryTabs.querySelectorAll('.modal-country-btn').forEach(btn => {
      const isMatch = btn.getAttribute('data-country') === activeRegion;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  if (inputFilterModelsModal) {
    inputFilterModelsModal.value = '';
    setTimeout(() => inputFilterModelsModal.focus(), 50);
  }
  renderModelsModal('');
}

function closeModelsModal() {
  if (!modalModels) return;
  modalModels.style.display = 'none';
  document.body.style.overflow = '';
}

// ==========================================================================
// AI 맞춤 추천 엔진 (작업 목적에 어울리는 최적 AI 모델 & 최저가 매칭)
// ==========================================================================

function clientFallbackRecommend(prompt) {
  const p = prompt.toLowerCase();

  if (/코딩|코드|프로그래밍|디버깅|파이썬|자바스크립트|개발|알고리즘|sql|html/.test(p)) {
    return {
      intent: "코딩 & 소프트웨어 개발",
      primary: {
        name: "Claude Sonnet 3.7",
        creator: "Anthropic 🇺🇸",
        reason: "현존 최고 수준의 복합 아키텍처 코딩 및 디버깅 능력을 제공하며, 하이브리드 사고 모드로 복잡한 코드 생성을 오류 없이 수행합니다.",
        bestProvider: "KIE API",
        costEst: "$1.50 / 1M 토큰 (공식 대비 -50% 할인)"
      },
      alternatives: [
        { name: "Qwen 2.5 Coder 32B", reason: "오픈 가중치 코딩 전용 모델 중 최강의 가성비를 자랑합니다." },
        { name: "DeepSeek-V3", reason: "압도적인 가격 대비 코딩 벤치마크 성능으로 대규모 코드 분석에 이상적입니다." }
      ]
    };
  } else if (/추론|논리|수학|o1|r1|심층|증명|과학|의사결정/.test(p)) {
    return {
      intent: "심층 논리 & 고난도 추론 (Reasoning)",
      primary: {
        name: "DeepSeek-R1",
        creator: "DeepSeek 🇨🇳",
        reason: "OpenAI o1과 동등한 최상위 복합 추론 성능(AIME 수학 1위)을 OpenAI 대비 1/10 이하의 파격적인 단가로 제공합니다.",
        bestProvider: "KIE API",
        costEst: "$0.55 / 1M 토큰 (공식 대비 -75% 할인)"
      },
      alternatives: [
        { name: "o3-mini", reason: "OpenAI의 최신 초고속 경량 추론 모델로 STEM 문제 해결에 매우 뛰어납니다." },
        { name: "Moonshot Kimi k1.5", reason: "200만 토큰의 초장문 컨텍스트와 멀티모달 고난도 추론을 결합했습니다." }
      ]
    };
  } else if (/한국어|네이버|업스테이지|카카오|행정|공공|보고서|국내|법률|한국/.test(p)) {
    return {
      intent: "한국 문화·제도·공공 행정 특화 업무",
      primary: {
        name: "HyperCLOVA X",
        creator: "네이버 클라우드 🇰🇷",
        reason: "국내 최대 한국어 말뭉치와 공공·금융 규제에 최적화되어 한국어 어휘 뉘앙스와 행정 문서 작성에서 가장 정확합니다.",
        bestProvider: "네이버 클라우드 (공식)",
        costEst: "한국어 특화 네이티브 API"
      },
      alternatives: [
        { name: "Solar Pro (22B)", reason: "한국어/영어 바이링구얼 및 OCR 문서 파싱에 특화되어 기업용 엔터프라이즈 환경에 최적입니다." },
        { name: "EXAONE 3.5 (32B)", reason: "LG의 산업 데이터 전문 지식과 뛰어난 한국어 추론 효율을 자랑합니다." }
      ]
    };
  } else if (/영상|비디오|동영상|쇼츠|릴스|틱톡|영화|애니메이션|3d/.test(p)) {
    return {
      intent: "AI 영상 & 비디오 생성",
      primary: {
        name: "PixVerse V3",
        creator: "PixVerse 🇨🇳",
        reason: "초당 카메라 앵글 제어 및 사실적인 피사체 일관성을 보장하며, 현재 가장 경쟁력 있는 생성 단가를 제공합니다.",
        bestProvider: "KIE API",
        costEst: "$0.05 / 생성회차 (단일 최저가)"
      },
      alternatives: [
        { name: "Kling 3.0", reason: "물리 엔진 기반의 극사실적 인간 모션과 시네마틱 숏폼 연출에 뛰어납니다." },
        { name: "Google Veo 3.1", reason: "영화급 4K 해상도와 정교한 프롬프트 이해도를 갖춘 차세대 비디오 플래그십입니다." }
      ]
    };
  } else if (/이미지|그림|포스터|일러스트|디자인|사진|로고|웹툰/.test(p)) {
    return {
      intent: "AI 고화질 이미지 & 그래픽 생성",
      primary: {
        name: "FLUX.1 Schnell",
        creator: "Black Forest Labs 🇪🇺",
        reason: "4스텝 초고속 생성으로 1초 이내에 극사실적 디테일과 텍스트 타이포그래피를 완벽하게 렌더링합니다.",
        bestProvider: "Together AI",
        costEst: "$0.003 / 장 (업계 최저가)"
      },
      alternatives: [
        { name: "Recraft 20B/v3", reason: "디자이너를 위한 SVG 벡터 및 상업용 그래픽 아트에 독보적입니다." },
        { name: "DALL-E 3", reason: "자연어 프롬프트 뉘앙스를 가장 충실하게 이해하고 반영합니다." }
      ]
    };
  } else if (/음악|작곡|노래|오디오|tts|음성|목소리|bgm/.test(p)) {
    return {
      intent: "AI 음악 작곡 & 오디오 TTS 생성",
      primary: {
        name: "Suno V6",
        creator: "Suno 🇺🇸",
        reason: "텍스트 입력만으로 보컬, 악기 세션, 믹싱이 완벽한 라디오 품질의 상업용 음악을 즉시 작곡합니다.",
        bestProvider: "Suno 공식",
        costEst: "$0.05 / 곡 (크레딧 기준)"
      },
      alternatives: [
        { name: "ElevenLabs Multilingual V3", reason: "전 세계 29개국 언어의 자연스러운 감정과 음성 복제를 제공하는 1위 TTS입니다." },
        { name: "MiniMax Speech-01", reason: "초저지연 음성 스트리밍과 높은 가성비를 제공합니다." }
      ]
    };
  } else if (/저렴|가성비|가장 싼|최저가|돈 아끼|경량|소형|모바일|온디바이스|단말|속도|초고속/.test(p)) {
    return {
      intent: "초저비용 & 경량 초고속 온디바이스",
      primary: {
        name: "Qwen 2.5 0.5B Instruct",
        creator: "Alibaba 🇨🇳",
        reason: "100만 토큰당 $0.015라는 압도적인 최저가로, CPU나 모바일 환경에서도 지연 없이 실시간 구동됩니다.",
        bestProvider: "KIE API",
        costEst: "$0.015 / 1M 토큰 (전체 최저가)"
      },
      alternatives: [
        { name: "Llama 3.2 1B Instruct", reason: "Meta의 1B 최신 모델로 Groq LPU에서 초당 400+ 토큰의 초광속 응답을 제공합니다." },
        { name: "Gemini 3.8 Flash", reason: "대용량 멀티모달 처리와 빠른 응답 속도를 겸비한 초가성비 모델입니다." }
      ]
    };
  } else {
    return {
      intent: "다목적 범용 고성능 AI 작업",
      primary: {
        name: "Gemini 3.8 Flash",
        creator: "Google 🇺🇸",
        reason: "텍스트, 비전, 오디오를 통합 처리하며 실시간에 가까운 초고속 반응성과 저렴한 토큰 단가를 동시에 만족하는 1위 범용 AI입니다.",
        bestProvider: "KIE API",
        costEst: "$0.08 / 1M 토큰 (공식가 대비 -50% 할인)"
      },
      alternatives: [
        { name: "GPT-4o-mini", reason: "전 세계에서 가장 검증된 안정성과 방대한 개발 생태계를 갖춘 올라운더 모델입니다." },
        { name: "Claude Sonnet 3.7", reason: "정밀한 문서 작성, 논리 추론, 복합 작업에서 최고의 사용자 만족도를 제공합니다." }
      ]
    };
  }
}

async function handleAiRecommend() {
  if (!inputUserTask || !btnGetAiRecommend || !recommendResultBox) return;

  const promptText = inputUserTask.value.trim();
  if (!promptText) {
    alert("내가 하고자 하는 작업 내용을 입력해 주세요.\n(예: 파이썬 코딩 디버깅, 가성비 챗봇, 쇼츠 영상 제작 등)");
    inputUserTask.focus();
    return;
  }

  const originalBtnHtml = btnGetAiRecommend.innerHTML;
  btnGetAiRecommend.disabled = true;
  btnGetAiRecommend.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="syncing" style="animation: spin 1s linear infinite;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
    <span>AI 분석 중...</span>
  `;

  let result = null;

  try {
    // 1. 로컬 백엔드 서버(/api/recommend) 호출 시도 (.env API Key 활용)
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });

    if (response.ok) {
      result = await response.json();
    }
  } catch (err) {
    // 백엔드 미실행 시 클라이언트 사이드 스마트 추천으로 완벽 폴백
    console.log('[AI Recommender] 클라이언트 스마트 분석 엔진 활성화');
  }

  if (!result || !result.primary) {
    result = clientFallbackRecommend(promptText);
  }

  btnGetAiRecommend.disabled = false;
  btnGetAiRecommend.innerHTML = originalBtnHtml;

  renderAiRecommendationResult(result);
}

function renderAiRecommendationResult(res) {
  if (!recommendResultBox) return;

  const primary = res.primary;
  const alts = res.alternatives || [];

  const altsHtml = alts.map(alt => `
    <div class="alt-model-card">
      <div>
        <div class="alt-card-title">${escapeHtml(alt.name)}</div>
        <div class="alt-card-reason">${escapeHtml(alt.reason)}</div>
      </div>
      <button type="button" class="btn-alt-compare" data-model-name="${escapeHtml(alt.name)}">
        가격 비교 ↗
      </button>
    </div>
  `).join('');

  recommendResultBox.innerHTML = `
    <div class="result-intent-title">
      <span>🎯 분석된 작업 의도:</span>
      <strong>${escapeHtml(res.intent || '맞춤 AI 작업')}</strong>
    </div>

    <div class="recommend-best-card">
      <div class="best-card-header">
        <div>
          <span class="best-pick-badge">🏆 1위 추천 BEST PICK</span>
          <div class="best-card-model-name" style="margin-top: 0.35rem;">${escapeHtml(primary.name)}</div>
          <div class="best-card-creator">${escapeHtml(primary.creator || '')}</div>
        </div>
        <button type="button" class="btn-best-compare" data-model-name="${escapeHtml(primary.name)}">
          <span>이 모델 가격 비교하기</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div class="best-card-reason">
        💡 <strong>추천 이유:</strong> ${escapeHtml(primary.reason)}
      </div>

      <div class="best-card-bottom">
        <div class="best-card-price">
          추천 공급처: <strong>${escapeHtml(primary.bestProvider || 'KIE API')}</strong> · ${escapeHtml(primary.costEst || '단일 최저가')}
        </div>
      </div>
    </div>

    ${alts.length > 0 ? `
      <div style="margin-top: 0.85rem;">
        <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-subtle);">추가 대안 모델:</span>
        <div class="recommend-alts-row">${altsHtml}</div>
      </div>
    ` : ''}
  `;

  recommendResultBox.style.display = 'block';

  // 비교 버튼 클릭 이벤트 연동 (메인 검색창에 자동 입력 후 테이블로 스크롤)
  recommendResultBox.querySelectorAll('.btn-best-compare, .btn-alt-compare').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetName = btn.getAttribute('data-model-name');
      if (searchInput) {
        searchInput.value = targetName;
        state.searchQuery = targetName;
        render();
        const tableToolbar = document.getElementById('tableToolbar');
        if (tableToolbar) {
          tableToolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

/**
 * 전체 렌더링 오케스트레이터
 */
function render() {
  updateHeroStats();
  const filteredModels = getFilteredModels();
  const filteredSites = getFilteredSites();

  // 버튼 활성화 상태 동기화
  if (btnToggleLowestOnly) {
    btnToggleLowestOnly.classList.toggle('active', state.onlyLowestPrice);
  }
  btnViewTable.classList.toggle('active', state.viewMode === 'table');
  btnViewCards.classList.toggle('active', state.viewMode === 'cards');
  btnViewSites.classList.toggle('active', state.viewMode === 'sites');

  // 가격 정렬 버튼 상태 동기화
  if (sortBtns && sortBtns.length > 0) {
    sortBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-sort') === state.sortOrder);
    });
  }

  // 테이블 헤더 정렬 표시 동기화
  if (thCostSort && costHeaderSortIcon) {
    thCostSort.classList.remove('active-lowest', 'active-highest');
    if (state.sortOrder === 'lowest') {
      thCostSort.classList.add('active-lowest');
      costHeaderSortIcon.textContent = '▲';
    } else if (state.sortOrder === 'highest') {
      thCostSort.classList.add('active-highest');
      costHeaderSortIcon.textContent = '▼';
    } else {
      costHeaderSortIcon.textContent = '⇅';
    }
  }

  // 테이블 툴바 카운트 및 정렬 알림 텍스트
  if (tableCountInfo) {
    let sortNotice = '';
    if (state.sortOrder === 'lowest') {
      sortNotice = ' <span style="font-size:0.78rem; font-weight:600; color:var(--accent-green); margin-left:0.4rem;">(최저가 순 정렬됨 ▲)</span>';
    } else if (state.sortOrder === 'highest') {
      sortNotice = ' <span style="font-size:0.78rem; font-weight:600; color:#f87171; margin-left:0.4rem;">(최고가 순 정렬됨 ▼)</span>';
    }
    tableCountInfo.innerHTML = `비교 모델 총 <strong>${filteredModels.length}개</strong>${sortNotice}`;
  }

  const hasData = state.viewMode === 'sites' ? filteredSites.length > 0 : filteredModels.length > 0;

  if (!hasData) {
    emptyState.style.display = 'block';
    modelsCardContainer.style.display = 'none';
    modelsSitesContainer.style.display = 'none';
    modelsTableContainer.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';

  if (state.viewMode === 'cards') {
    modelsCardContainer.style.display = 'flex';
    modelsSitesContainer.style.display = 'none';
    modelsTableContainer.style.display = 'none';
    renderCardView(filteredModels);
  } else if (state.viewMode === 'sites') {
    modelsCardContainer.style.display = 'none';
    modelsSitesContainer.style.display = 'flex';
    modelsTableContainer.style.display = 'none';
    renderSitesView(filteredSites);
  } else {
    modelsCardContainer.style.display = 'none';
    modelsSitesContainer.style.display = 'none';
    modelsTableContainer.style.display = 'block';
    renderTableView(filteredModels);
  }
}

/**
 * 이벤트 리스너 바인딩
 */
function initEvents() {
  // 테마 토글
  btnThemeToggle.addEventListener('click', () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  // 데이터 동기화/새로고침 버튼
  btnSync.addEventListener('click', () => {
    btnSync.classList.add('syncing');
    btnSync.disabled = true;

    setTimeout(() => {
      const newTimestamp = refreshPriceData();
      elLastUpdated.textContent = newTimestamp;
      state.models = processModelsData(RAW_MODELS);
      updateHeroStats();
      render();

      btnSync.classList.remove('syncing');
      btnSync.disabled = false;
    }, 200);
  });

  // 국가별 국기 필터 버튼 클릭 이벤트
  flagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      flagBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCountry = btn.getAttribute('data-country');
      render();
    });
  });

  // 검색어 입력
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    render();
  });

  // 가격 정렬 버튼 클릭 (없음 / 최저가 순 / 최고가 순)
  if (sortBtns && sortBtns.length > 0) {
    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.sortOrder = btn.getAttribute('data-sort') || 'none';
        render();
      });
    });
  }

  // 테이블 헤더 "기준 사용량 예상비용" 클릭 시 정렬 순환 (기본 -> 최저가 -> 최고가 -> 기본)
  if (thCostSort) {
    thCostSort.addEventListener('click', () => {
      if (state.sortOrder === 'none') {
        state.sortOrder = 'lowest';
      } else if (state.sortOrder === 'lowest') {
        state.sortOrder = 'highest';
      } else {
        state.sortOrder = 'none';
      }
      render();
    });
  }

  // 카테고리 필터 버튼
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.getAttribute('data-filter');
      render();
    });
  });

  // 미디어 타입 필터 버튼 (존재할 경우에만)
  if (mediaBtns && mediaBtns.length > 0) {
    mediaBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        mediaBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeMediaType = btn.getAttribute('data-media');
        render();
      });
    });
  }

  // 모델별 최저가만 보기 토글 버튼
  if (btnToggleLowestOnly) {
    btnToggleLowestOnly.addEventListener('click', () => {
      state.onlyLowestPrice = !state.onlyLowestPrice;
      render();
    });
  }

  // 3단 뷰 모드 전환 (테이블 뷰 기본 / 모델별 카드 / 사이트별 보기)
  if (btnViewTable) {
    btnViewTable.addEventListener('click', () => {
      state.viewMode = 'table';
      render();
    });
  }

  if (btnViewCards) {
    btnViewCards.addEventListener('click', () => {
      state.viewMode = 'cards';
      render();
    });
  }

  if (btnViewSites) {
    btnViewSites.addEventListener('click', () => {
      state.viewMode = 'sites';
      render();
    });
  }

  // 계산기 펼치기/접기 토글 이벤트
  if (calcToggleHeader) {
    calcToggleHeader.addEventListener('click', (e) => {
      // 리셋 버튼 클릭 시에는 펼치기/접기 방지
      if (e.target.closest('#btnResetCalc')) return;
      toggleCalculator();
    });

    calcToggleHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCalculator();
      }
    });
  }

  if (btnToggleCalc) {
    btnToggleCalc.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCalculator();
    });
  }

  // 계산기 입력 이벤트
  [inputCalcInput, inputCalcOutput, inputCalcCache].forEach(input => {
    input.addEventListener('input', updateCalculatorValues);
  });

  // 계산기 초기화
  btnResetCalc.addEventListener('click', (e) => {
    e.stopPropagation();
    inputCalcInput.value = '10';
    inputCalcOutput.value = '2';
    inputCalcCache.value = '5';
    updateCalculatorValues();
  });

  // =========================================================================
  // 모달 팝업 이벤트 바인딩 (등록 공급 사이트 57개 & 전체 비교 모델 152개)
  // =========================================================================

  // 1. 등록 공급 사이트 모달
  if (cardStatProviders) {
    cardStatProviders.addEventListener('click', openProvidersModal);
    cardStatProviders.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProvidersModal();
      }
    });
  }

  if (btnCloseProvidersModal) {
    btnCloseProvidersModal.addEventListener('click', closeProvidersModal);
  }

  if (backdropProviders) {
    backdropProviders.addEventListener('click', closeProvidersModal);
  }

  if (inputFilterProvidersModal) {
    inputFilterProvidersModal.addEventListener('input', (e) => {
      renderProvidersModal(e.target.value);
    });
  }

  // 모달 지역/국가 필터 탭 클릭 이벤트 (전체, 아시아, 유럽, 미국, 중국, 한국)
  if (modalProvidersCountryTabs) {
    modalProvidersCountryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.modal-country-btn');
      if (!btn) return;
      const targetCountry = btn.getAttribute('data-country') || 'ALL';
      state.modalProviderCountry = targetCountry;

      modalProvidersCountryTabs.querySelectorAll('.modal-country-btn').forEach(b => {
        const isMatch = (b === btn);
        b.classList.toggle('active', isMatch);
        b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      const currentQuery = inputFilterProvidersModal ? inputFilterProvidersModal.value : '';
      renderProvidersModal(currentQuery);
    });
  }

  // 2. 전체 비교 모델 모달
  if (cardStatModels) {
    cardStatModels.addEventListener('click', openModelsModal);
    cardStatModels.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModelsModal();
      }
    });
  }

  if (btnCloseModelsModal) {
    btnCloseModelsModal.addEventListener('click', closeModelsModal);
  }

  if (backdropModels) {
    backdropModels.addEventListener('click', closeModelsModal);
  }

  if (inputFilterModelsModal) {
    inputFilterModelsModal.addEventListener('input', (e) => {
      renderModelsModal(e.target.value);
    });
  }

  // 모델 모달 지역/국가 필터 탭 클릭 이벤트 (전체, 아시아, 유럽, 미국, 중국, 한국)
  if (modalModelsCountryTabs) {
    modalModelsCountryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.modal-country-btn');
      if (!btn) return;
      const targetCountry = btn.getAttribute('data-country') || 'ALL';
      state.modalModelCountry = targetCountry;

      modalModelsCountryTabs.querySelectorAll('.modal-country-btn').forEach(b => {
        const isMatch = (b === btn);
        b.classList.toggle('active', isMatch);
        b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      const currentQuery = inputFilterModelsModal ? inputFilterModelsModal.value : '';
      renderModelsModal(currentQuery);
    });
  }

  // =========================================================================
  // AI 맞춤 추천 이벤트 바인딩
  // =========================================================================
  if (btnGetAiRecommend) {
    btnGetAiRecommend.addEventListener('click', handleAiRecommend);
  }

  if (inputUserTask) {
    inputUserTask.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAiRecommend();
      }
    });
  }

  if (quickChips && quickChips.length > 0) {
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt') || chip.textContent.trim();
        if (inputUserTask) {
          inputUserTask.value = prompt;
          handleAiRecommend();
        }
      });
    });
  }

  // 키보드 ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProvidersModal();
      closeModelsModal();
    }
  });
}

/**
 * 개발자 실행 환경 감지 및 localhost 전용 UI 제어
 * - 도메인 사이트(GitHub Pages 등) 접속 시에는 'API Key .env 안전보호' 및 개발환경 인디케이터가 일체 표시되지 않습니다.
 * - localhost / 127.0.0.1 환경에서만 실행환경 정보와 보안 배지를 표시합니다.
 */
async function setupDevEnvironment() {
  const hostname = window.location.hostname;
  const isLocalhost = Boolean(
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    window.location.protocol === 'file:'
  );

  const devLocalWrapper = document.getElementById('devLocalWrapper');
  const devEnvBadge = document.getElementById('devEnvBadge');
  const devEnvText = document.getElementById('devEnvText');
  const securityBadgeEnv = document.getElementById('securityBadgeEnv');

  if (!isLocalhost) {
    // 도메인 사이트(프로덕션)인 경우: 일체 노출하지 않음
    if (devLocalWrapper) devLocalWrapper.style.display = 'none';
    if (securityBadgeEnv) securityBadgeEnv.style.display = 'none';
    if (devEnvBadge) devEnvBadge.style.display = 'none';
    return;
  }

  // localhost 환경인 경우에만 활성화 표시
  if (devLocalWrapper) {
    devLocalWrapper.style.display = 'inline-flex';
  }
  if (securityBadgeEnv) {
    securityBadgeEnv.style.display = 'inline-flex';
  }

  // 로컬 프록시 서버(/api/env-info)에서 개발환경 상세 정보 조회 시도
  try {
    const res = await fetch('/api/env-info');
    if (res.ok) {
      const data = await res.json();
      if (devEnvText) {
        const keyInfo = data.keys?.gemini ? 'Gemini 연동' : (data.keys?.openai ? 'OpenAI 연동' : '키 미설정');
        devEnvText.textContent = `DEV (포트:${data.port || 8088} · ${keyInfo})`;
      }
      console.log('🛠️ [Local Dev Environment]', data);
    }
  } catch (e) {
    if (devEnvText) {
      devEnvText.textContent = `DEV · Localhost`;
    }
  }
}

/**
 * 초기화 진입점
 */
function init() {
  applyTheme(state.theme);
  elLastUpdated.textContent = getLastUpdatedTimestamp();
  updateHeroStats();
  initEvents();
  setupDevEnvironment();
  render();
}

// DOM 준비 완료 시 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
