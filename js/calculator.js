/**
 * 토큰 비용 시뮬레이터 로직
 * 사용자의 예상 사용량(Input Tokens, Output Tokens, Cache Tokens)에 따른
 * 공급업체별 실제 예상 비용 및 절감액 실시간 산출
 */

export function calculateCustomUsageCost(offer, inputTokens, outputTokens, cacheTokens = 0) {
  // 비토큰 모델 (Image/Video/Music) - pricePerUnit 기반
  if (offer.inputPer1M === null || offer.inputPer1M === undefined) {
    const unitPrice = offer.pricePerUnit || 0;
    return {
      inputCost: unitPrice,
      outputCost: 0,
      cacheCost: 0,
      totalCost: unitPrice,
      isUnitBased: true,
      priceUnit: offer.priceUnit || '단위'
    };
  }

  // 토큰 단위: 1M (1,000,000)
  const inputMillions = inputTokens / 1_000_000;
  const outputMillions = outputTokens / 1_000_000;
  const cacheMillions = cacheTokens / 1_000_000;

  const inputCost = inputMillions * offer.inputPer1M;
  const outputCost = outputMillions * offer.outputPer1M;
  
  // 캐시 비용 지원 여부
  const cacheRate = offer.cacheReadPer1M !== null ? offer.cacheReadPer1M : offer.inputPer1M;
  const cacheCost = cacheMillions * cacheRate;

  const totalCost = inputCost + outputCost + cacheCost;

  return {
    inputCost,
    outputCost,
    cacheCost,
    totalCost,
    isUnitBased: false
  };
}

/**
 * 특정 모델에 대해 사용량 기준으로 모든 제공처 비용 계산 및 비교 정렬
 */
export function compareProvidersForModel(model, inputTokens, outputTokens, cacheTokens = 0) {
  const officialOffer = model.offers.find(o => o.isOfficial) || model.offers[0];
  const officialCostObj = calculateCustomUsageCost(officialOffer, inputTokens, outputTokens, cacheTokens);
  const officialTotalCost = officialCostObj.totalCost;

  const results = model.offers.map(offer => {
    const costObj = calculateCustomUsageCost(offer, inputTokens, outputTokens, cacheTokens);
    const diff = officialTotalCost - costObj.totalCost;
    const savingPercent = officialTotalCost > 0 
      ? Math.round((diff / officialTotalCost) * 100) 
      : 0;

    return {
      provider: offer.provider,
      providerKey: offer.providerKey,
      isOfficial: offer.isOfficial,
      siteUrl: offer.siteUrl,
      costBreakdown: costObj,
      totalCost: costObj.totalCost,
      savedDollars: Math.max(0, diff),
      savingPercent: Math.max(0, savingPercent),
      note: offer.note
    };
  });

  // 비용 오름차순(최저가순) 정렬
  results.sort((a, b) => a.totalCost - b.totalCost);

  if (results.length > 0) {
    results[0].isLowest = true;
  }

  return {
    modelId: model.id,
    modelName: model.name,
    officialTotalCost,
    bestOffer: results[0],
    providers: results
  };
}
