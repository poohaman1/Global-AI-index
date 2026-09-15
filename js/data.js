/**
 * LLM 최저가 비교 데이터셋 및 스토리지 관리 모듈
 * KIE API 실측 가격표 스크린샷 전면 반영 (gpt-6-astra, Gemini 3.8/3.7 Flash, grok-4-6, claude-opus-5, claude-sonnet-5 등)
 * 단위: USD ($) per 1M Tokens
 */

const STORAGE_KEY_TIMESTAMP = 'llm_price_last_updated';
const DEFAULT_TIMESTAMP = '2026.09.15';

export const COUNTRIES = {
  KR: { code: 'KR', name: '한국', flag: '🇰🇷', region: 'Asia' },
  CN: { code: 'CN', name: '중국', flag: '🇨🇳', region: 'Asia' },
  ASIA: { code: 'ASIA', name: '아시아', flag: '🌏', region: 'Asia' },
  JP: { code: 'JP', name: '일본', flag: '🇯🇵', region: 'Asia' },
  SG: { code: 'SG', name: '싱가포르', flag: '🇸🇬', region: 'Asia' },
  IN: { code: 'IN', name: '인도', flag: '🇮🇳', region: 'Asia' },
  US: { code: 'US', name: '미국', flag: '🇺🇸', region: 'America' },
  EU: { code: 'EU', name: '유럽', flag: '🇪🇺', region: 'Europe' }
};

/**
 * 플랫폼 메타데이터
 */
export const PLATFORMS_INFO = {
  // 국내 (한국 🇰🇷)
  naver: {
    id: 'naver',
    name: '네이버 클라우드 (HyperCLOVA X)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '국내 최대 포털 네이버의 자체 개발 초대규모 AI 플랫폼. 한국어 및 국내 제도·문화 최적화.',
    features: ['한국어 최고 이해도', '네이버 클라우드 VPC 연동', '엔터프라이즈 보안 인증'],
    siteUrl: 'https://www.ncloud.com/product/ai/clovastudio'
  },
  upstage: {
    id: 'upstage',
    name: '업스테이지 (Upstage Solar)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '글로벌 LLM 벤치마크 1위를 달성한 대한민국 대표 AI 스타트업의 자체 개발 Solar API 플랫폼.',
    features: ['Solar 22B 고효율', '문서 작업/OCR 특화', '빠른 응답 속도'],
    siteUrl: 'https://console.upstage.ai'
  },
  kakao: {
    id: 'kakao',
    name: '카카오 (카나나 Kanana)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '카카오의 자체 개발 차세대 초거대 AI "카나나(Kanana)". 카카오톡 생태계 및 한국어 인터랙션 최적화.',
    features: ['Kanana-f 플래그십', 'Kanana-b 고효율 베이스', 'Kanana-o 옴니 멀티모달'],
    siteUrl: 'https://kakao.ai'
  },
  lg: {
    id: 'lg',
    name: 'LG AI연구원 (EXAONE)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'LG의 초거대 AI 연구 조직이 개발한 바이링구얼 및 전문 산업 특화 소버린 AI 플랫폼.',
    features: ['EXAONE 3.5 32B/7.8B', '한국어/영어 동등 성능', '전문 산업 지식 특화'],
    siteUrl: 'https://www.lgresearch.ai/'
  },
  skt: {
    id: 'skt',
    name: 'SK텔레콤 (에이닷 A.X)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'SKT의 통신·금융 데이터 및 대화형 에이전트 서비스 노하우가 집약된 한국어 특화 LLM.',
    features: ['A.X LLM 플래그십', '통화 요약/에이전트 특화', '엔터프라이즈 보안'],
    siteUrl: 'https://a-dot.ai'
  },
  ncsoft: {
    id: 'ncsoft',
    name: '엔씨소프트 (VARCO)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '엔씨소프트의 게임 콘텐츠, 디지털 휴먼, 창작 도메인 특화 자체 개발 LLM 브랜드.',
    features: ['VARCO LLM 13B', '시나리오/대화 생성 특화', '도메인 파인튜닝'],
    siteUrl: 'https://varco.ncsoft.com/'
  },
  bllossom: {
    id: 'bllossom',
    name: '한국어 오픈소스 커뮤니티 (Bllossom)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'hosting',
    typeLabel: '오픈소스 프로젝트',
    badgeClass: 'hosting',
    description: 'Llama 3 기반 한국어 최고 성능 튜닝 오픈소스 프로젝트. 허깅페이스 한국어 다운로드 1위.',
    features: ['Bllossom 70B/8B', '한국 문화/제도 지식', '오픈 가중치 무료 서빙'],
    siteUrl: 'https://huggingface.co/MLP-KTLim/llama-3-Korean-Bllossom-70B'
  },


  // 중국 (🇨🇳)
  zhipu: {
    id: 'zhipu',
    name: '지푸 AI (Zhipu BigModel)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '칭화대 연구진이 설립한 중국 최고 수준의 범용 대형 언어 모델 GLM 시리즈 공식 플랫폼.',
    features: ['GLM-4 플래그십', 'GLM Flash 무료 티어', '고성능 멀티모달'],
    siteUrl: 'https://open.bigmodel.cn'
  },
  alibaba: {
    id: 'alibaba',
    name: '알리바바 클라우드 (DashScope)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '알리바바의 퉁이첸원(Qwen) 및 오픈 가중치 모델을 서비스하는 글로벌 클라우드 AI 플랫폼.',
    features: ['Qwen-Max 플래그십', '초저가 오픈 토큰', '글로벌 CDN 가속'],
    siteUrl: 'https://www.alibabacloud.com/product/dashscope'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek (공식)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '혁신적인 오픈 가중치 추론 모델 R1 및 671B MoE V3의 원작자 직영 API 플랫폼.',
    features: ['공식 최저 단가', '공식 기능 지원'],
    siteUrl: 'https://platform.deepseek.com/'
  },
  moonshot: {
    id: 'moonshot',
    name: '문샷 AI (Moonshot Kimi)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '200만 토큰 장문 컨텍스트와 심층 추론에 특화된 중국 대표 생성형 AI 기업.',
    features: ['200만 토큰 초장문 컨텍스트', '심층 수학/코딩 추론'],
    siteUrl: 'https://platform.moonshot.cn'
  },
  bytedance: {
    id: 'bytedance',
    name: '바이트댄스 (볼케이노 엔진 Doubao)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '틱톡 모회사 바이트댄스의 초대형 AI 클라우드. 중국 일일 처리량 1위의 초저가 플래그십 Doubao 서빙.',
    features: ['Doubao-1.5 플래그십', '중국 내 처리량 1위', '압도적 초저가 정책'],
    siteUrl: 'https://www.volcengine.com/product/doubao'
  },
  tencent: {
    id: 'tencent',
    name: '텐센트 클라우드 (Tencent Hunyuan)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '위챗과 QQ 생태계를 보유한 텐센트의 389B MoE 초대형 파운데이션 모델 Hunyuan 공식 플랫폼.',
    features: ['389B MoE 아키텍처', 'Hunyuan-T1 심층 추론', '위챗 생태계 결합'],
    siteUrl: 'https://cloud.tencent.com/product/hunyuan'
  },
  sensetime: {
    id: 'sensetime',
    name: '센스타임 (SenseTime SenseNova)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '아시아 최대 비전·AI 컴퓨팅 기업 센스타임의 600B 파라미터 대형 언어 및 멀티모달 모델 플랫폼.',
    features: ['SenseChat 5.5 600B', '비전-언어 옴니 모델', '초대규모 컴퓨팅 클러스터'],
    siteUrl: 'https://sensenova.sensetime.com/'
  },
  stepfun: {
    id: 'stepfun',
    name: '스텝펀 (StepFun 阶跃星辰)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '전 MS 아시아 연구원 핵심 인력들이 설립한 중국 대표 유니콘. 1조(만억) 파라미터 MoE 모델 보유.',
    features: ['Step-2 1조 MoE 모델', '고성능 멀티모달', '심층 추론 능력'],
    siteUrl: 'https://platform.stepfun.com/'
  },
  iflytek: {
    id: 'iflytek',
    name: '아이플라이텍 (iFLYTEK SparkDesk)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '중국 국가 인공지능 연구소 주관의 전통 AI 거두. 자연어 및 음성-텍스트 융합 모델 Spark 시리즈 제공.',
    features: ['Spark 4.0 Ultra 플래그십', '음성-언어 융합 특화', '국가급 벤치마크 1위'],
    siteUrl: 'https://xinghuo.xfyun.cn/sparkapi'
  },
  internlm: {
    id: 'internlm',
    name: '상하이 AI 랩 (서생 InternLM / InternVL)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '국가 연구소/공식',
    badgeClass: 'official',
    description: '중국 최고 국립 AI 연구소의 오픈소스 프론티어. InternLM 2.5 및 멀티모달 비전 InternVL 2.5 제공.',
    features: ['InternLM 2.5 플래그십', 'InternVL 2.5 비전 1위', '오픈소스 연구 생태계'],
    siteUrl: 'https://internlm.intern-ai.org.cn'
  },
  xiaomi: {
    id: 'xiaomi',
    name: '샤오미 (Xiaomi AI / MiLM)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '샤오미 스마트폰 및 스마트 가전 생태계(HyperOS)에 내장된 온디바이스 엣지 LLM 플랫폼.',
    features: ['MiLM 온디바이스', 'HyperOS AI 생태계', '초저전력 고효율'],
    siteUrl: 'https://ai.mi.com'
  },
  taichu: {
    id: 'taichu',
    name: '중국과학원 (자동태초 Zidong Taichu)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '국가 연구소/공식',
    badgeClass: 'official',
    description: '중국과학원 자동화연구소(CASIA)가 개발한 중국 최초 3차원 크로스모달(텍스트-영상-음성) 파운데이션 플랫폼.',
    features: ['Taichu 3.0 삼차원 옴니', '중국 국가 랩 개발', '고난도 멀티모달 상호작용'],
    siteUrl: 'https://taichu-ai.com'
  },
  // 중국 멀티모달 & 아시아 신규 플랫폼
  pixverse: {
    id: 'pixverse',
    name: 'PixVerse AI (Alice Tech)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '알리스 테크놀로지(愛詩科技)의 글로벌 1위급 비디오 생성 플랫폼 PixVerse. 4K 고화질, 멀티 앵글 카메라 제어, 립싱크 지원.',
    features: ['4K 비디오 생성', '멀티 앵글 카메라 워크', '음성 립싱크 동기화'],
    siteUrl: 'https://pixverse.ai/'
  },
  sensetime: {
    id: 'sensetime',
    name: '상탕과기 (SenseTime SenseNova)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '중국 최고 컴퓨터비전·AI 기업 상탕과기(SenseTime)의 초대형 옴니 멀티모달 파운데이션 모델 플랫폼.',
    features: ['SenseNova 5.5 옴니', '텍스트-비전-오디오 통합', '엔터프라이즈 특화'],
    siteUrl: 'https://sensenova.sensetime.com/'
  },
  moonshot: {
    id: 'moonshot',
    name: '문샷 AI (Moonshot Kimi)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '알리바바와 텐센트가 대규모 투자한 중국 초거대 AI 스타트업 문샷 AI의 200만 토큰 초장문 추론 플랫폼.',
    features: ['200만 토큰 롱컨텍스트', 'Kimi k1.5 고성능 추론', '복합 멀티모달 이해'],
    siteUrl: 'https://platform.moonshot.cn/'
  },
  viggle: {
    id: 'viggle',
    name: 'Viggle AI',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'JST-1 물리 기반 3D 캐릭터 모션 제어 및 영상 합성 분야 세계적 인기의 혁신 AI 플랫폼.',
    features: ['물리 기반 모션 제어', '캐릭터 교체 합성', '초고속 렌더링'],
    siteUrl: 'https://viggle.ai/'
  },
  // 일본 🇯🇵
  fugaku: {
    id: 'fugaku',
    name: '이화학연구소·도쿄공대 (Fugaku-LLM)',
    country: 'JP',
    countryLabel: '일본',
    flag: '🇯🇵',
    type: 'official',
    typeLabel: '공식 연구기관',
    badgeClass: 'official',
    description: '일본 국책 슈퍼컴퓨터 "후가쿠(Fugaku)" 기반으로 개발된 순수 일본 국가 파운데이션 모델.',
    features: ['후가쿠 슈퍼컴퓨터 학습', '투명한 오픈소스', '인문/사회 일본어 특화'],
    siteUrl: 'https://github.com/fugaku-llm/fugaku-llm'
  },
  rakuten: {
    id: 'rakuten',
    name: '라쿠텐 (Rakuten AI)',
    country: 'JP',
    countryLabel: '일본',
    flag: '🇯🇵',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '일본 최대 전자상거래 및 핀테크 그룹 라쿠텐의 상업·비즈니스 최적화 자체 파운데이션 LLM.',
    features: ['이커머스/비즈니스 최적화', '라쿠텐 에코시스템 연동', '고효율 7B/14B'],
    siteUrl: 'https://corp.rakuten.co.jp/innovation/ai/'
  },
  cyberagent: {
    id: 'cyberagent',
    name: '사이버에이전트 (CyberAgent AI)',
    country: 'JP',
    countryLabel: '일본',
    flag: '🇯🇵',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '일본 최대 디지털 광고·마케팅 기업 사이버에이전트의 크리에이티브·콘텐츠 특화 CALM3 LLM.',
    features: ['CALM3 22B', '광고 카피/창작 특화', '일본어 벤치마크 최상위'],
    siteUrl: 'https://www.cyberagent.co.jp/ai/'
  },
  nec: {
    id: 'nec',
    name: 'NEC (cotomi)',
    country: 'JP',
    countryLabel: '일본',
    flag: '🇯🇵',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '일본 대표 IT 대기업 NEC의 금융·의료·공공 엔터프라이즈 전용 초대형 생성형 AI cotomi.',
    features: ['엔터프라이즈 보안 인증', '업종별 맞춤 미세조정', '초경량 온프레미스'],
    siteUrl: 'https://jpn.nec.com/generative-ai/index.html'
  },
  // 싱가포르 / 아세안 🇸🇬
  aisingapore: {
    id: 'aisingapore',
    name: 'AI Singapore (SEA-LION)',
    country: 'SG',
    countryLabel: '싱가포르',
    flag: '🇸🇬',
    type: 'official',
    typeLabel: '공식 연구기관',
    badgeClass: 'official',
    description: '싱가포르 정부 주도 AI Singapore가 개발한 동남아시아 11개국 언어 및 문화 특화 국가 파운데이션 모델.',
    features: ['동남아 11개국 언어 특화', '아세안 문화 맥락 이해', '국가 오픈 파운데이션'],
    siteUrl: 'https://sea-lion.ai/'
  },
  // 인도 🇮🇳
  krutrim: {
    id: 'krutrim',
    name: 'Krutrim AI (Ola)',
    country: 'IN',
    countryLabel: '인도',
    flag: '🇮🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '인도 최초의 유니콘 AI 기업 Krutrim의 인도 22개 공용어 지원 파운데이션 LLM 플랫폼.',
    features: ['인도 22개 공용어 지원', 'Krutrim Pro 고성능', '인디아 데이터센터 구축'],
    siteUrl: 'https://krutrim.com/'
  },
  sarvam: {
    id: 'sarvam',
    name: 'Sarvam AI',
    country: 'IN',
    countryLabel: '인도',
    flag: '🇮🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '인도 음성 및 현지어 처리에 특화된 인도의 대표적인 파운데이션 AI 연구 플랫폼.',
    features: ['Sarvam 2B 고효율', '10개 인도어 음성·텍스트', '초저지연 온디바이스'],
    siteUrl: 'https://www.sarvam.ai/'
  },




  // KIE API (통합 할인 애그리게이터 - 최대 72% 할인)
  kie: {
    id: 'kie',
    name: 'KIE API',
    country: 'KR',
    countryLabel: '글로벌/한국',
    flag: '🌐',
    type: 'aggregator',
    typeLabel: '통합 할인 애그리게이터',
    badgeClass: 'aggregator',
    description: '공식가 대비 최대 72% 파격 할인 및 프롬프트 캐싱을 지원하는 통합 LLM 가격비교·서빙 플랫폼.',
    features: ['최대 72% 파격 할인', '프롬프트 캐싱 90% 절감 지원', '단일 통합 빌링', 'OpenAI/Anthropic SDK 완벽 호환'],
    siteUrl: 'https://kie.ai/pricing'
  },
  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face (Serverless/Endpoints)',
    country: 'EU',
    countryLabel: '글로벌/유럽',
    flag: '🇪🇺',
    type: 'hosting',
    typeLabel: '오픈소스 AI 허브 & 서빙',
    badgeClass: 'hosting',
    description: '세계 최대 오픈소스 AI 허브로, 서버리스 추론 API 및 전용 엔드포인트를 통해 최신 오픈 모델을 종량제로 제공.',
    features: ['세계 최대 오픈소스 모델 풀', 'Serverless 종량제', 'Dedicated GPU 확장'],
    siteUrl: 'https://huggingface.co/docs/api-inference'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'aggregator',
    typeLabel: '멀티 라우팅 애그리게이터',
    badgeClass: 'aggregator',
    description: '수백 개의 상용/오픈소스 모델을 하나의 키로 제공하며, 최저가 및 최고속 공급자로 자동 폴백 라우팅 지원.',
    features: ['수백 개 모델 단일 API', '자동 장애 조치(Fallback)', '공식가 연동', '프롬프트 캐싱'],
    siteUrl: 'https://openrouter.ai'
  },
  deepinfra: {
    id: 'deepinfra',
    name: 'DeepInfra',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'hosting',
    typeLabel: '초저비용 GPU 인프라 호스팅',
    badgeClass: 'hosting',
    description: '오픈소스 모델(DeepSeek, Llama, Qwen 등)을 자체 고성능 GPU 클러스터에서 업계 최저 수준의 단가로 서빙.',
    features: ['초저가 토큰 단가', '빠른 첫 토큰 응답(TTFT)', '서버리스 오토스케일링'],
    siteUrl: 'https://deepinfra.com'
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'hosting',
    typeLabel: '초고속 MoE 추론 플랫폼',
    badgeClass: 'hosting',
    description: '자체 최적화 추론 엔진으로 DeepSeek, Llama, Qwen 모델을 초당 수백 토큰의 빠른 속도로 서비스.',
    features: ['초고속 추론 엔진', 'MoE 모델 최적화', '정밀 함수 호출'],
    siteUrl: 'https://fireworks.ai/pricing'
  },
  grok_platform: {
    id: 'grok_platform',
    name: 'xAI (Grok 공식)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '일론 머스크의 xAI가 개발한 Grok 모델 공식 API 플랫폼.',
    features: ['Grok 최신 모델 1차 출시', '대규모 GPU 추론 클러스터'],
    siteUrl: 'https://x.ai/api'
  },
  groq: {
    id: 'groq',
    name: 'Groq (LPU)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'hosting',
    typeLabel: '초고속 LPU 하드웨어 가속',
    badgeClass: 'hosting',
    description: '독자적인 LPU 칩셋을 통해 초당 300~500 토큰 이상의 압도적인 속도로 언어 모델 서빙.',
    features: ['초당 300+ 토큰 속도', '실시간 에이전트 특화'],
    siteUrl: 'https://groq.com'
  },

  // 공식 개발사 (미국 🇺🇸)
  openai: {
    id: 'openai',
    name: 'OpenAI (공식)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'GPT-6 astra, GPT-4o, o3-mini 등 업계 표준 프론티어 모델의 원저작사 직판 공식 API.',
    features: ['최신 모델 1차 출시', '최대 컨텍스트 지원', '공식 보안 인증'],
    siteUrl: 'https://openai.com/api/pricing/'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (공식)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'Claude Opus 5, Sonnet 5, Sonnet 3.7 등 코딩 및 심층 추론 최고 성능 모델 공식 공급사.',
    features: ['프롬프트 캐싱 지원', '공식 개발 문서'],
    siteUrl: 'https://www.anthropic.com/pricing'
  },
  google: {
    id: 'google',
    name: 'Google (공식 AI Studio)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'Gemini 3.8 Flash, Gemini 3.7 Flash, Veo 3.1 등 차세대 실시간 고속 멀티모달 모델 공식 공급사.',
    features: ['초대용량 컨텍스트', '네이티브 멀티모달', '무료 테스트 티어', 'Veo 영상 생성'],
    siteUrl: 'https://ai.google.dev/pricing'
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI (공식)',
    country: 'EU',
    countryLabel: '유럽/프랑스',
    flag: '🇪🇺',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '유럽 최대 AI 스타트업. Mistral Large, Small 등 고효율 경량 모델과 Codestral 코딩 특화 모델 제공.',
    features: ['EU 데이터 주권 보장', '프롬프트 캐싱 90% 할인', '배치 API 50% 할인'],
    siteUrl: 'https://mistral.ai/pricing/'
  },
  together: {
    id: 'together',
    name: 'Together AI',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'hosting',
    typeLabel: '오픈소스 모델 호스팅',
    badgeClass: 'hosting',
    description: '세계 최대 규모의 오픈 가중치 모델 호스팅 플랫폼. Llama, Qwen, Mixtral 등 수십 종 모델을 종량제로 서빙.',
    features: ['수십 종 오픈 모델', 'LoRA 파인튜닝', '서버리스 오토스케일'],
    siteUrl: 'https://www.together.ai/pricing'
  },
  meta: {
    id: 'meta',
    name: 'Meta (Llama 공식)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사 (오픈 가중치)',
    badgeClass: 'official',
    description: 'Llama 4 Scout, Maverick 등 오픈 가중치 모델의 원작사. 클라우드 파트너를 통해 서빙.',
    features: ['오픈 가중치 라이선스', 'MoE 아키텍처', '다양한 호스팅 선택'],
    siteUrl: 'https://llama.meta.com/'
  },
  baidu: {
    id: 'baidu',
    name: '바이두 (Qianfan)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '중국 최대 검색 엔진 바이두의 ERNIE 시리즈 LLM 공식 API 플랫폼.',
    features: ['검색 그라운딩 특화', 'ERNIE 5.1 플래그십', '중국 내 최대 인프라'],
    siteUrl: 'https://cloud.baidu.com/product/wenxinworkshop'
  },
  yi: {
    id: 'yi',
    name: '01.AI (Yi)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '카이-후 리(Kai-Fu Lee)가 창립한 중국 AI 스타트업. Yi-Large 멀티링구얼 모델 제공.',
    features: ['OpenAI 호환 API', '글로벌 멀티링구얼', '고성능 범용 추론'],
    siteUrl: 'https://platform.01.ai/'
  },
  minimax: {
    id: 'minimax',
    name: 'Minimax',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '텍스트, 음성, 영상, 음악까지 멀티모달 AI를 종합 제공하는 중국 대표 AI 기업.',
    features: ['텍스트/음성/영상/음악 통합', 'M3 텍스트 모델', 'H3 비디오 모델'],
    siteUrl: 'https://www.minimaxi.com/'
  },
  kt: {
    id: 'kt',
    name: 'KT (믿음 Mi:DEUM)',
    country: 'KR',
    countryLabel: '한국',
    flag: '🇰🇷',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'KT의 국산 AI 반도체(리벨리온)와 자체 LLM "믿음"을 통합한 소버린 AI 플랫폼.',
    features: ['국산 NPU 연동', '데이터 주권 보장', '공공/금융/국방 특화'],
    siteUrl: 'https://cloud.kt.com/product/ai/'
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    country: 'US',
    countryLabel: '미국/글로벌',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'Stable Diffusion 시리즈의 원작사. 고품질 이미지 생성 API 제공.',
    features: ['Stable Diffusion 3.5', 'SDXL 오픈소스', '이미지 생성 선구자'],
    siteUrl: 'https://platform.stability.ai/pricing'
  },
  bfl: {
    id: 'bfl',
    name: 'Black Forest Labs (Flux)',
    country: 'EU',
    countryLabel: '유럽/독일',
    flag: '🇪🇺',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: 'Flux 시리즈 이미지 생성 모델의 원작사. Pro, Dev, Schnell 등 다양한 티어 제공.',
    features: ['Flux 2 Pro 플래그십', 'Schnell 초고속', '메가픽셀 기반 과금'],
    siteUrl: 'https://blackforestlabs.ai/'
  },
  runway: {
    id: 'runway',
    name: 'Runway (Gen-4.5)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '크리에이티브 AI 비디오 생성의 선구자. Gen-4.5 모델로 텍스트·이미지→영상 생성.',
    features: ['Gen-4.5 최신 모델', '크레딧 기반 과금', '프로덕션급 품질'],
    siteUrl: 'https://runwayml.com/'
  },
  kuaishou: {
    id: 'kuaishou',
    name: '쾌수 (Kling AI)',
    country: 'CN',
    countryLabel: '중국',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '중국 쾌수(Kuaishou)의 AI 비디오 생성 모델 Kling. 고품질 영상을 저렴하게 생성.',
    features: ['Kling 3.0 최신', '다양한 해상도', '경쟁력 있는 가격'],
    siteUrl: 'https://klingai.com/'
  },
  suno: {
    id: 'suno',
    name: 'Suno (AI Music)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '텍스트로 음악을 생성하는 AI 작곡 플랫폼. V6 시리즈로 프로급 음악 생성.',
    features: ['V6 최신 모델', '크레딧 기반', '다양한 장르 지원'],
    siteUrl: 'https://suno.com/'
  },
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs (TTS)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '최고 품질의 AI 음성 합성(TTS) 및 음성 클로닝 API 플랫폼.',
    features: ['Multilingual V3', 'Flash 초고속', '음성 클로닝'],
    siteUrl: 'https://elevenlabs.io/pricing'
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere (공식)',
    country: 'US',
    countryLabel: '북미/캐나다',
    flag: '🇨🇦',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '기업용 RAG 및 검색/임베딩 분야 글로벌 1위 플랫폼. Command R+ 시리즈 제공.',
    features: ['Command R+ 플래그십', '검색 증강 생성(RAG) 특화', 'Embed v3 다국어 1위'],
    siteUrl: 'https://cohere.com/pricing'
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft (Azure AI)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사/클라우드',
    badgeClass: 'official',
    description: '마이크로소프트의 Phi-4, WizardLM 시리즈 및 엔터프라이즈 AI 모델 서빙 플랫폼.',
    features: ['Phi-4 소형 모델 최고 성능', '엔터프라이즈 SLA', 'Azure 생태계 통합'],
    siteUrl: 'https://azure.microsoft.com/en-us/solutions/ai'
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon (AWS Bedrock Nova)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사',
    badgeClass: 'official',
    description: '아마존 AWS가 자체 개발한 차세대 멀티모달 파운데이션 모델 Nova 시리즈 플랫폼.',
    features: ['Nova Pro 플래그십', 'Nova Lite 고속', 'Nova Canvas 이미지 생성'],
    siteUrl: 'https://aws.amazon.com/bedrock/'
  },
  recraft: {
    id: 'recraft',
    name: 'Recraft AI',
    country: 'EU',
    countryLabel: '영국/유럽',
    flag: '🇬🇧',
    type: 'official',
    typeLabel: '공식 개발사 (이미지)',
    badgeClass: 'official',
    description: '디자이너를 위한 고해상도 벡터/SVG 및 일러스트레이션 생성 특화 AI 플랫폼.',
    features: ['Recraft 20B/v3', '벡터/SVG 네이티브 생성', '상업용 디자인 특화'],
    siteUrl: 'https://www.recraft.ai/'
  },
  luma: {
    id: 'luma',
    name: 'Luma AI (Dream Machine)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사 (비디오)',
    badgeClass: 'official',
    description: 'Ray 2 기반의 극사실적 시네마틱 카메라 워크와 물리 엔진을 지원하는 AI 비디오 생성 플랫폼.',
    features: ['Ray 2 비디오 플래그십', '자연스러운 카메라 무빙', '일관된 피사체 유지'],
    siteUrl: 'https://lumalabs.ai/dream-machine'
  },
  pika: {
    id: 'pika',
    name: 'Pika Labs',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사 (비디오)',
    badgeClass: 'official',
    description: '모션 브러시와 크리에이티브 특수 효과를 제공하는 생성형 비디오 플랫폼.',
    features: ['Pika 2.0 최신 모델', 'Pikaffects 특수 효과', '소셜 숏폼 최적화'],
    siteUrl: 'https://pika.art/'
  },
  udio: {
    id: 'udio',
    name: 'Udio (AI Music)',
    country: 'US',
    countryLabel: '미국',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사 (음악)',
    badgeClass: 'official',
    description: 'DeepMind 연구원들이 설립한 고음질 음악 생성 AI. 사실적인 보컬과 풍부한 악기 세션 제공.',
    features: ['Udio v1.5 최신', '스튜디오급 고음질 보컬', '가사 및 장르 세부 제어'],
    siteUrl: 'https://www.udio.com/'
  },
  arena: {
    id: 'arena',
    name: 'Arena (Chatbot Arena)',
    country: 'US',
    countryLabel: '미국/글로벌',
    flag: '🌐',
    type: 'aggregator',
    typeLabel: '모델 평가/라우팅 플랫폼',
    badgeClass: 'aggregator',
    description: '글로벌 1위 AI 모델 블라인드 벤치마크 및 파레토 최적 가성비 라우팅 플랫폼.',
    features: ['Pareto Frontier 최적화', 'Arena Direct Chat', '프론티어 모델 실시간 랭킹'],
    siteUrl: 'https://arena.ai/'
  },
  byteplus: {
    id: 'byteplus',
    name: 'BytePlus (ModelArk)',
    country: 'CN',
    countryLabel: '중국/글로벌',
    flag: '🇨🇳',
    type: 'official',
    typeLabel: '공식 개발사/클라우드',
    badgeClass: 'official',
    description: '바이트댄스(ByteDance)의 글로벌 클라우드 플랫폼. Doubao(Seed), Seedream, Seedance 등 서빙.',
    features: ['Doubao Pro 최저가', 'OpenAI 호환 API', 'Seedream/Seedance 멀티모달'],
    siteUrl: 'https://www.byteplus.com/'
  },
  genspark: {
    id: 'genspark',
    name: 'Genspark (AI Agent)',
    country: 'US',
    countryLabel: '미국/글로벌',
    flag: '🇺🇸',
    type: 'official',
    typeLabel: '공식 개발사/에이전트',
    badgeClass: 'official',
    description: '차세대 AI 슈퍼 에이전트 및 멀티 LLM 통합 지능형 리서치 엔진.',
    features: ['Super Agent 리서치', '다중 LLM 통합 라우팅', '고품질 보고서 생성'],
    siteUrl: 'https://www.genspark.ai/'
  }
};

/**
 * 모델별 원시 가격 데이터셋 (KIE API 실측 스크린샷 데이터 포함)
 */
export const RAW_MODELS = [
  // =================================================================
  // [신규 등록 모델: BytePlus, Genspark, Arena.ai]
  // =================================================================
  {
    id: 'doubao-1-5-pro',
    name: 'Doubao 1.5 Pro (Seed)',
    creator: 'ByteDance',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    contextWindow: '128K',
    description: '바이트댄스(ByteDance)의 플래그십 LLM. 중국어/영어 뛰어난 성능과 파격적인 가성비 제공.',
    offers: [
      {
        provider: 'BytePlus (공식)',
        providerKey: 'byteplus',
        isOfficial: true,
        inputPer1M: 0.12,
        outputPer1M: 0.24,
        cacheReadPer1M: 0.03,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.byteplus.com/',
        note: '바이트댄스 글로벌 공식 단가 ($0.12 / $0.24)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.08,
        outputPer1M: 0.16,
        cacheReadPer1M: 0.02,
        discountPercent: 33,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai',
        note: 'KIE 글로벌 파트너 할인 (-33%)'
      }
    ]
  },
  {
    id: 'doubao-1-5-lite',
    name: 'Doubao 1.5 Lite (Seed Lite)',
    creator: 'ByteDance',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    contextWindow: '32K',
    description: '바이트댄스의 초고속 경량 모델. 100만 토큰당 $0.02~$0.04의 초저비용 실시간 응답.',
    offers: [
      {
        provider: 'BytePlus (공식)',
        providerKey: 'byteplus',
        isOfficial: true,
        inputPer1M: 0.04,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.01,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.byteplus.com/',
        note: '초경량 초고속 공식 서빙 ($0.04 / $0.06)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.02,
        outputPer1M: 0.04,
        cacheReadPer1M: 0.005,
        discountPercent: 50,
        latency: 'Realtime',
        siteUrl: 'https://kie.ai',
        note: 'KIE 초가성비 할인 (-50%)'
      }
    ]
  },
  {
    id: 'doubao-seedream-3-0',
    name: 'Doubao Seedream 3.0',
    creator: 'ByteDance',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Image',
    pricePerUnit: 0.02,
    priceUnit: '장',
    contextWindow: 'Native Image',
    description: '바이트댄스의 고화질 이미지 생성 파운데이션 모델. 미적 완성도와 정교한 텍스트 렌더링.',
    offers: [
      {
        provider: 'BytePlus (공식)',
        providerKey: 'byteplus',
        isOfficial: true,
        pricePerUnit: 0.02,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.byteplus.com/',
        note: '공식 이미지 생성 단가 ($0.02/장)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        pricePerUnit: 0.012,
        priceUnit: '장',
        discountPercent: 40,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai',
        note: 'KIE 할인 렌더링 (-40%)'
      }
    ]
  },
  {
    id: 'doubao-seedance-2-0',
    name: 'Doubao Seedance 2.0',
    creator: 'ByteDance',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Video',
    pricePerUnit: 0.05,
    priceUnit: '생성회차',
    contextWindow: 'Native Video',
    description: '바이트댄스의 AI 비디오 및 모션 생성 모델. 자연스러운 카메라 무빙과 피사체 일관성.',
    offers: [
      {
        provider: 'BytePlus (공식)',
        providerKey: 'byteplus',
        isOfficial: true,
        pricePerUnit: 0.05,
        priceUnit: '생성회차',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.byteplus.com/',
        note: '공식 비디오 생성 ($0.05/회)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        pricePerUnit: 0.035,
        priceUnit: '생성회차',
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai',
        note: 'KIE 비디오 생성 할인 (-30%)'
      }
    ]
  },
  {
    id: 'genspark-super-agent',
    name: 'Genspark Super Agent',
    creator: 'Genspark',
    country: 'US',
    countryLabel: '미국/글로벌',
    flagEmoji: '🌐',
    category: 'Reasoning',
    contextWindow: '200K',
    description: '차세대 AI 슈퍼 에이전트. 다중 LLM 라우팅과 실시간 교차 검증으로 심층 리서치 보고서 생성.',
    offers: [
      {
        provider: 'Genspark (공식)',
        providerKey: 'genspark',
        isOfficial: true,
        inputPer1M: 0.25,
        outputPer1M: 0.75,
        cacheReadPer1M: 0.05,
        discountPercent: 0,
        latency: 'Normal',
        siteUrl: 'https://www.genspark.ai/',
        note: '공식 슈퍼 에이전트 리서치 쿼리 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.45,
        cacheReadPer1M: 0.03,
        discountPercent: 40,
        latency: 'Fast',
        siteUrl: 'https://kie.ai',
        note: 'KIE 통합 라우팅 단가 (-40%)'
      }
    ]
  },
  {
    id: 'arena-pareto-router',
    name: 'Arena Pareto Router',
    creator: 'Arena.ai',
    country: 'US',
    countryLabel: '미국/글로벌',
    flagEmoji: '🌐',
    category: 'High Performance',
    contextWindow: '128K',
    description: 'LMSYS Chatbot Arena 블라인드 벤치마크 기반, 프롬프트 난이도별 파레토 가성비 자동 최적 라우팅.',
    offers: [
      {
        provider: 'Arena (공식)',
        providerKey: 'arena',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.03,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://arena.ai/',
        note: 'LMSYS Arena Pareto Frontier 공식 라우팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.40,
        cacheReadPer1M: 0.02,
        discountPercent: 33,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai',
        note: 'KIE 파레토 라우팅 서빙 (-33%)'
      }
    ]
  },
  // =================================================================
  // [KIE API 실측 가격표 모델들 (스크린샷 기반)]
  // =================================================================
  {
    id: 'gpt-6-astra',
    name: 'GPT-6-Astra',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    contextWindow: '256K',
    description: 'OpenAI의 차세대 프론티어 모델. KIE API에서 공식가 대비 -72% 파격 할인 제공.',
    offers: [
      {
        provider: 'OpenAI (공식 / Fal)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 10.00,
        outputPer1M: 50.00,
        cacheReadPer1M: 1.00,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 단가 (Input $10 / Output $50 / Cache Input $1.00 / Cache Writes $12.50)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 2.80,
        outputPer1M: 14.00,
        cacheReadPer1M: 0.28,
        discountPercent: 72,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -72% 즉시 할인 (Input $2.80 / Output $14.00 / Cached $0.28)'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 10.00,
        outputPer1M: 50.00,
        cacheReadPer1M: 1.00,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식가 연동'
      }
    ]
  },
  {
    id: 'gemini-3-8-flash',
    name: 'Gemini 3.8 Flash',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    contextWindow: '1M',
    description: 'Google의 차세대 실시간 초고속 멀티모달 플래시 모델. KIE API에서 -70% 할인.',
    offers: [
      {
        provider: 'Google (공식 / Fal)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: 0.75,
        outputPer1M: 3.75,
        cacheReadPer1M: 0.187,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://ai.google.dev/pricing',
        note: '공식 단가 (Input $0.75 / Output $3.75)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.225,
        outputPer1M: 1.125,
        cacheReadPer1M: 0.056,
        discountPercent: 70,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -70% 즉시 할인 (Input $0.225 / Output $1.125)'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 0.75,
        outputPer1M: 3.75,
        cacheReadPer1M: 0.187,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식 단가 연동'
      }
    ]
  },
  {
    id: 'gemini-3-7-flash',
    name: 'Gemini 3.7 Flash',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    contextWindow: '1M',
    description: '구글의 고성능 하이브리드 플래시 모델. KIE API에서 -70% 할인 제공.',
    offers: [
      {
        provider: 'Google (공식 / Fal)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: 0.75,
        outputPer1M: 3.75,
        cacheReadPer1M: 0.187,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://ai.google.dev/pricing',
        note: '공식 단가 (Input $0.75 / Output $3.75)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.225,
        outputPer1M: 1.125,
        cacheReadPer1M: 0.056,
        discountPercent: 70,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -70% 즉시 할인 (Input $0.225 / Output $1.125)'
      }
    ]
  },
  {
    id: 'grok-4-6',
    name: 'grok-4-6',
    creator: 'xAI (Grok)',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    contextWindow: '128K',
    description: 'xAI의 Grok 4-6 모델. KIE API에서 공식 대비 -60% 즉시 할인 제공.',
    offers: [
      {
        provider: 'xAI (Grok 공식)',
        providerKey: 'grok_platform',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 6.00,
        cacheReadPer1M: 0.50,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://x.ai/api',
        note: '공식 단가 (Input $2.00 / Output $6.00 / Cached $0.50)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.80,
        outputPer1M: 2.40,
        cacheReadPer1M: 0.20,
        discountPercent: 60,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -60% 할인 (Input $0.80 / Output $2.40 / Cached $0.20)'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 2.00,
        outputPer1M: 6.00,
        cacheReadPer1M: 0.50,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식 연동'
      }
    ]
  },
  {
    id: 'claude-opus-5',
    name: 'claude-opus-5',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    contextWindow: '200K',
    description: 'Anthropic의 최상위 플래그십 Opus-5. KIE API에서 공식 대비 -60% 파격 할인.',
    offers: [
      {
        provider: 'Anthropic (공식)',
        providerKey: 'anthropic',
        isOfficial: true,
        inputPer1M: 5.00,
        outputPer1M: 25.00,
        cacheReadPer1M: 0.50,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.anthropic.com/pricing',
        note: '공식 단가 (Input $5.00 / Output $25.00 / Prompt Caching 지원)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 2.00,
        outputPer1M: 10.00,
        cacheReadPer1M: 0.20,
        discountPercent: 60,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -60% 즉시 할인 (Input $2.00 / Output $10.00, 캐시 90% 추가 감면)'
      }
    ]
  },
  {
    id: 'claude-sonnet-5',
    name: 'claude-sonnet-5',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    contextWindow: '200K',
    description: 'Anthropic의 최신 Sonnet-5 모델. KIE API에서 -57.5% 즉시 할인.',
    offers: [
      {
        provider: 'Anthropic (공식)',
        providerKey: 'anthropic',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 10.00,
        cacheReadPer1M: 0.20,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.anthropic.com/pricing',
        note: '공식 단가 (Input $2.00 / Output $10.00)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.850,
        outputPer1M: 4.275,
        cacheReadPer1M: 0.085,
        discountPercent: 57.5,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -57.5% 할인 (Input $0.850 / Output $4.275, 캐시 읽기 $0.085)'
      }
    ]
  },
  {
    id: 'claude-fable-5',
    name: 'Claude-fable-5',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    contextWindow: '200K',
    description: 'Anthropic 전용 Fable-5 모델. KIE API 독점 서빙 요금.',
    offers: [
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 4.00,
        outputPer1M: 20.00,
        cacheReadPer1M: 0.40,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 요금 (Input $4.00 / Output $20.00, 캐시 읽기 $0.40)'
      }
    ]
  },

  // =================================================================
  // [한국 모델 🇰🇷]
  // =================================================================
  {
    id: 'hyperclova-x',
    name: 'HyperCLOVA X (HCX-003)',
    creator: 'NAVER (네이버)',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'High Performance',
    contextWindow: '32K',
    description: '네이버의 한국어 최고 특화 플래그십 LLM. 국내 비즈니스 및 법률·문화 이해도 1위.',
    offers: [
      {
        provider: '네이버 클라우드 (공식)',
        providerKey: 'naver',
        isOfficial: true,
        inputPer1M: 3.50,
        outputPer1M: 7.00,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.ncloud.com/product/ai/clovastudio',
        note: '클로바 스튜디오 공식 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 2.45,
        outputPer1M: 4.90,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '30% 즉시 할인 공급'
      }
    ]
  },
  {
    id: 'hyperclova-x-dash',
    name: 'HyperCLOVA X DASH',
    creator: 'NAVER (네이버)',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Fast & Lightweight',
    contextWindow: '32K',
    description: '고속 응답과 경제적인 비용을 실현한 네이버의 경량형 생성 모델.',
    offers: [
      {
        provider: '네이버 클라우드 (공식)',
        providerKey: 'naver',
        isOfficial: true,
        inputPer1M: 0.50,
        outputPer1M: 1.00,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://www.ncloud.com/product/ai/clovastudio',
        note: 'DASH 공식 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.35,
        outputPer1M: 0.70,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'DASH 모델 30% 할인'
      }
    ]
  },
  {
    id: 'upstage-solar-pro',
    name: 'Solar Pro (22B)',
    creator: 'Upstage (업스테이지)',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'High Performance',
    contextWindow: '64K',
    description: '글로벌 벤치마크 1위 달성 경력의 업스테이지 최신 22B 플래그십 언어 모델.',
    offers: [
      {
        provider: '업스테이지 (공식)',
        providerKey: 'upstage',
        isOfficial: true,
        inputPer1M: 0.25,
        outputPer1M: 0.25,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://console.upstage.ai',
        note: '업스테이지 콘솔 공식 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.18,
        outputPer1M: 0.18,
        cacheReadPer1M: null,
        discountPercent: 28,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'Solar Pro 28% 할인'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 0.25,
        outputPer1M: 0.25,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식 단가 연동'
      }
    ]
  },
  {
    id: 'upstage-solar-mini',
    name: 'Solar Mini (10.7B)',
    creator: 'Upstage (업스테이지)',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Fast & Lightweight',
    contextWindow: '32K',
    description: '뛰어난 영어·한국어 번역 및 요약 능력을 갖춘 초경량 고속 파운데이션 모델.',
    offers: [
      {
        provider: '업스테이지 (공식)',
        providerKey: 'upstage',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.15,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://console.upstage.ai',
        note: '공식 가격'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        cacheReadPer1M: null,
        discountPercent: 33,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'Solar Mini 33% 할인'
      }
    ]
  },
  {
    id: 'lg-exaone-3-5',
    name: 'EXAONE 3.5 (32B)',
    creator: 'LG AI연구원',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Open Weights',
    contextWindow: '32K',
    description: 'LG AI연구원이 자체 개발한 엔터프라이즈 특화 고효율 오픈 가중치 언어 모델.',
    offers: [
      {
        provider: 'Hugging Face (Serverless)',
        providerKey: 'huggingface',
        isOfficial: false,
        inputPer1M: 0.20,
        outputPer1M: 0.20,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://huggingface.co',
        note: '허깅페이스 오픈 모델 공식 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.14,
        outputPer1M: 0.14,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'EXAONE 30% 할인'
      }
    ]
  },

  // =================================================================
  // [중국 모델 🇨🇳]
  // =================================================================
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    creator: 'DeepSeek',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Reasoning',
    contextWindow: '64K',
    description: '오픈 소스 추론 모델의 혁신. o1급 추론력을 파격적인 비용으로 제공.',
    offers: [
      {
        provider: 'DeepSeek (공식)',
        providerKey: 'deepseek',
        isOfficial: true,
        inputPer1M: 0.55,
        outputPer1M: 2.19,
        cacheReadPer1M: 0.14,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://platform.deepseek.com/',
        note: '공식 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.44,
        outputPer1M: 1.75,
        cacheReadPer1M: 0.11,
        discountPercent: 20,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '20% 할인 + 글로벌 고속 엔드포인트'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: 0.55,
        outputPer1M: 2.19,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://fireworks.ai',
        note: 'MoE 하드웨어 최적화'
      }
    ]
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    creator: 'DeepSeek',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    contextWindow: '64K',
    description: '671B MoE 고성능 범용 언어 모델. 플래그십급 가성비 챔피언.',
    offers: [
      {
        provider: 'DeepSeek (공식)',
        providerKey: 'deepseek',
        isOfficial: true,
        inputPer1M: 0.14,
        outputPer1M: 0.28,
        cacheReadPer1M: 0.014,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://platform.deepseek.com/',
        note: '공식 초저가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.11,
        outputPer1M: 0.22,
        cacheReadPer1M: 0.010,
        discountPercent: 21,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '21% 추가 할인'
      }
    ]
  },
  {
    id: 'qwen-max',
    name: 'Qwen-Max (플래그십)',
    creator: 'Alibaba (알리바바)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    contextWindow: '32K',
    description: '알리바바의 최상위 플래그십 모델. 종합 지능 및 다국어 능력 우수.',
    offers: [
      {
        provider: '알리바바 클라우드 (공식)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 2.80,
        outputPer1M: 8.40,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: 'DashScope 공식 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.95,
        outputPer1M: 5.80,
        cacheReadPer1M: null,
        discountPercent: 31,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'Qwen-Max 31% 할인'
      }
    ]
  },
  {
    id: 'qwen-2-5-72b',
    name: 'Qwen 2.5 72B Instruct',
    creator: 'Alibaba (알리바바)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Open Weights',
    contextWindow: '128K',
    description: '오픈소스 진영 최고 성능의 범용 72B 언어 모델. 다국어 및 코딩 우수.',
    offers: [
      {
        provider: 'Hugging Face (Serverless)',
        providerKey: 'huggingface',
        isOfficial: false,
        inputPer1M: 0.40,
        outputPer1M: 0.40,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://huggingface.co',
        note: '허깅페이스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.25,
        outputPer1M: 0.35,
        cacheReadPer1M: null,
        discountPercent: 25,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'Qwen 25% 할인'
      }
    ]
  },
  {
    id: 'zhipu-glm-4-plus',
    name: 'GLM-4-Plus',
    creator: 'Zhipu AI (지푸)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    contextWindow: '128K',
    description: '지푸 AI의 최상위 플래그십 언어 모델. 정밀한 논리 추론과 복합 업무 처리.',
    offers: [
      {
        provider: '지푸 AI (공식)',
        providerKey: 'zhipu',
        isOfficial: true,
        inputPer1M: 1.40,
        outputPer1M: 1.40,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://open.bigmodel.cn',
        note: '공식 BigModel 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.98,
        outputPer1M: 0.98,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'GLM-4-Plus 30% 즉시 할인'
      }
    ]
  },
  {
    id: 'moonshot-kimi-k1-5',
    name: 'Kimi k1.5',
    creator: 'Moonshot AI (문샷)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Reasoning',
    contextWindow: '2000K',
    description: '최대 200만 토큰의 초장문 컨텍스트와 심층 수학·과학 추론 특화.',
    offers: [
      {
        provider: '문샷 AI (공식)',
        providerKey: 'moonshot',
        isOfficial: true,
        inputPer1M: 1.50,
        outputPer1M: 3.50,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://platform.moonshot.cn',
        note: '공식 API 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.05,
        outputPer1M: 2.45,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: 'Kimi k1.5 30% 할인'
      }
    ]
  },

  // =================================================================
  // [미국 / 글로벌 기존 인기 모델 🇺🇸]
  // =================================================================
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    contextWindow: '200K',
    description: '일반 응답과 심층 추론(Thinking)을 유연하게 제어하는 Anthropic 플래그십.',
    offers: [
      {
        provider: 'Anthropic (공식)',
        providerKey: 'anthropic',
        isOfficial: true,
        inputPer1M: 3.00,
        outputPer1M: 15.00,
        cacheReadPer1M: 0.30,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.anthropic.com/pricing',
        note: '공식 표준 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 2.10,
        outputPer1M: 10.50,
        cacheReadPer1M: 0.21,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '30% 즉시 할인'
      }
    ]
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    contextWindow: '128K',
    description: 'OpenAI의 플래그십 옴니 모델. 고성능 추론 및 다국어·멀티모달 지원.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 2.50,
        outputPer1M: 10.00,
        cacheReadPer1M: 1.25,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 표준 API 가격'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.75,
        outputPer1M: 7.00,
        cacheReadPer1M: 0.88,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '30% 즉시 할인'
      }
    ]
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Open Weights',
    contextWindow: '128K',
    description: 'Meta의 최신 70B 오픈 가중치 모델. 기존 405B급 효율성 달성.',
    offers: [
      {
        provider: 'Groq',
        providerKey: 'groq',
        isOfficial: false,
        inputPer1M: 0.59,
        outputPer1M: 0.79,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast (300+ T/s)',
        siteUrl: 'https://groq.com',
        note: '세계 최고 속도'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.35,
        outputPer1M: 0.49,
        cacheReadPer1M: null,
        discountPercent: 40,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '40% 할인 최저가'
      }
    ]
  },

  // =================================================================
  // [추가 미국 / 글로벌 텍스트 모델 🇺🇸🇪🇺]
  // =================================================================
  {
    id: 'gpt-5-6-sol',
    name: 'GPT-5.6 Sol',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '256K',
    description: 'OpenAI의 차세대 프론티어 모델 5.6 시리즈 Sol. 프로모션 가격 적용 중.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 4.00,
        outputPer1M: 20.00,
        cacheReadPer1M: 0.40,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '프로모션 가격 (2026.11월까지)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.60,
        outputPer1M: 8.00,
        cacheReadPer1M: 0.16,
        discountPercent: 60,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -60% 즉시 할인'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 4.00,
        outputPer1M: 20.00,
        cacheReadPer1M: 0.40,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식가 연동'
      }
    ]
  },
  {
    id: 'gpt-5-6-luna',
    name: 'GPT-5.6 Luna',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'OpenAI의 경량 고속 모델. 빠른 응답과 저렴한 비용으로 대량 처리에 최적.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 0.20,
        outputPer1M: 1.20,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.08,
        outputPer1M: 0.48,
        cacheReadPer1M: 0.008,
        discountPercent: 60,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '실측 -60% 할인'
      }
    ]
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o-mini',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'OpenAI의 초경량 범용 모델. 업계 최저 수준의 비용으로 고품질 응답 제공.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 초저가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.24,
        cacheReadPer1M: 0.006,
        discountPercent: 60,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 파격 할인'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식가 연동'
      }
    ]
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '200K',
    description: 'Anthropic의 경량 고속 모델. Haiku 급 속도에 향상된 품질과 도구 사용 지원.',
    offers: [
      {
        provider: 'Anthropic (공식)',
        providerKey: 'anthropic',
        isOfficial: true,
        inputPer1M: 1.00,
        outputPer1M: 5.00,
        cacheReadPer1M: 0.10,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://www.anthropic.com/pricing',
        note: '공식 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.40,
        outputPer1M: 2.00,
        cacheReadPer1M: 0.04,
        discountPercent: 60,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 즉시 할인'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 1.00,
        outputPer1M: 5.00,
        cacheReadPer1M: 0.10,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식가 연동'
      }
    ]
  },
  {
    id: 'grok-4-1-fast',
    name: 'Grok 4.1 Fast',
    creator: 'xAI (Grok)',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'xAI의 경량 고속 모델. 대량 처리와 에이전트 워크플로에 최적화.',
    offers: [
      {
        provider: 'xAI (Grok 공식)',
        providerKey: 'grok_platform',
        isOfficial: true,
        inputPer1M: 0.20,
        outputPer1M: 0.50,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://x.ai/api',
        note: '공식 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.08,
        outputPer1M: 0.20,
        cacheReadPer1M: 0.008,
        discountPercent: 60,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 할인'
      }
    ]
  },
  {
    id: 'mistral-large-3',
    name: 'Mistral Large 3',
    creator: 'Mistral AI',
    country: 'EU',
    countryLabel: '유럽',
    flagEmoji: '🇪🇺',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '유럽 최대 AI 스타트업 Mistral의 플래그십 모델. 다국어 및 코딩 우수.',
    offers: [
      {
        provider: 'Mistral AI (공식)',
        providerKey: 'mistral',
        isOfficial: true,
        inputPer1M: 0.50,
        outputPer1M: 1.50,
        cacheReadPer1M: 0.05,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://mistral.ai/pricing/',
        note: 'La Plateforme 공식 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.20,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.02,
        discountPercent: 60,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 할인'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 0.50,
        outputPer1M: 1.50,
        cacheReadPer1M: 0.05,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openrouter.ai',
        note: '공식 연동'
      }
    ]
  },
  {
    id: 'mistral-small-4',
    name: 'Mistral Small 4',
    creator: 'Mistral AI',
    country: 'EU',
    countryLabel: '유럽',
    flagEmoji: '🇪🇺',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '64K',
    description: 'Mistral의 초경량 고속 모델. GPT-4o-mini 급 성능을 유럽 데이터 주권으로 제공.',
    offers: [
      {
        provider: 'Mistral AI (공식)',
        providerKey: 'mistral',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://mistral.ai/pricing/',
        note: '공식 초저가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.24,
        cacheReadPer1M: 0.006,
        discountPercent: 60,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 즉시 할인'
      }
    ]
  },
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout (17B MoE)',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Open Weights',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'Meta의 최신 Llama 4 시리즈 경량 MoE 모델. 17B 활성 파라미터로 효율적 추론.',
    offers: [
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.30,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: '오픈 모델 호스팅'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.12,
        outputPer1M: 0.30,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://deepinfra.com',
        note: '초저가 GPU 호스팅'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.30,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://fireworks.ai',
        note: 'MoE 최적화 엔진'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.15,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Very Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick (128E MoE)',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '256K',
    description: 'Meta의 Llama 4 최상위 MoE 모델. 128개 전문가로 프론티어급 성능 달성.',
    offers: [
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.50,
        outputPer1M: 0.80,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: '오픈 모델 호스팅'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: 0.50,
        outputPer1M: 0.80,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://fireworks.ai',
        note: 'MoE 하드웨어 최적화'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.25,
        outputPer1M: 0.40,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 최저가'
      }
    ]
  },

  // =================================================================
  // [추가 중국 모델 🇨🇳]
  // =================================================================
  {
    id: 'ernie-5-1',
    name: 'ERNIE 5.1',
    creator: 'Baidu (바이두)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '바이두의 최신 ERNIE 5.1 플래그십 모델. 검색 그라운딩과 중국어 특화.',
    offers: [
      {
        provider: '바이두 Qianfan (공식)',
        providerKey: 'baidu',
        isOfficial: true,
        inputPer1M: 0.56,
        outputPer1M: 0.84,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://cloud.baidu.com/product/wenxinworkshop',
        note: 'Qianfan 공식 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.39,
        outputPer1M: 0.59,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-30% 할인'
      }
    ]
  },
  {
    id: 'yi-large',
    name: 'Yi-Large',
    creator: '01.AI (이링)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '01.AI의 최상위 멀티링구얼 모델. OpenAI 호환 API로 쉬운 통합 지원.',
    offers: [
      {
        provider: '01.AI (공식)',
        providerKey: 'yi',
        isOfficial: true,
        inputPer1M: 0.80,
        outputPer1M: 0.80,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://platform.01.ai/',
        note: '공식 API 단가'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: 0.90,
        outputPer1M: 0.90,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://fireworks.ai',
        note: '글로벌 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.56,
        outputPer1M: 0.56,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-30% 할인'
      }
    ]
  },
  {
    id: 'minimax-m3',
    name: 'Minimax M3',
    creator: 'Minimax',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '256K',
    description: 'Minimax의 최신 텍스트 모델 M3. 초장문 컨텍스트와 높은 가성비.',
    offers: [
      {
        provider: 'Minimax (공식)',
        providerKey: 'minimax',
        isOfficial: true,
        inputPer1M: 0.30,
        outputPer1M: 1.20,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.minimaxi.com/',
        note: '공식 API'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: 0.30,
        outputPer1M: 1.20,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Very Fast',
        siteUrl: 'https://fireworks.ai',
        note: '글로벌 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },

  // =================================================================
  // [추가 한국 모델 🇰🇷]
  // =================================================================
  {
    id: 'kt-mideum-k25-pro',
    name: '믿음 K 2.5 Pro',
    creator: 'KT',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '32K',
    description: 'KT의 국산 NPU(리벨리온) 기반 소버린 AI LLM. 공공/금융/국방 보안 특화.',
    offers: [
      {
        provider: 'KT 클라우드 (공식)',
        providerKey: 'kt',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 4.00,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://cloud.kt.com/product/ai/',
        note: '온프레미스/클라우드 공식 요금'
      }
    ]
  },

  // =================================================================
  // [이미지 생성 모델 🖼️ (Image)]
  // =================================================================
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: 'OpenAI의 최신 이미지 생성 모델. 품질/해상도에 따라 차등 과금.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '장 (Medium)',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: 'Medium 품질 ~$0.04/장, High ~$0.21/장'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.016,
        priceUnit: '장 (Medium)',
        discountPercent: 60,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 할인'
      }
    ]
  },
  {
    id: 'flux-2-pro',
    name: 'Flux 2 Pro',
    creator: 'Black Forest Labs',
    country: 'EU',
    countryLabel: '유럽',
    flagEmoji: '🇪🇺',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: 'Black Forest Labs의 프리미엄 이미지 생성 모델. 최고 품질 출력.',
    offers: [
      {
        provider: 'BFL (공식)',
        providerKey: 'bfl',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://blackforestlabs.ai/',
        note: '공식 ~$0.04~$0.055/장'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.025,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '장',
        discountPercent: 20,
        latency: 'Very Fast',
        siteUrl: 'https://fireworks.ai',
        note: '글로벌 서빙'
      }
    ]
  },
  {
    id: 'flux-2-schnell',
    name: 'Flux 2 Schnell',
    creator: 'Black Forest Labs',
    country: 'EU',
    countryLabel: '유럽',
    flagEmoji: '🇪🇺',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: 'Flux의 초고속 경량 모델. 장당 $0.003의 업계 최저가.',
    offers: [
      {
        provider: 'BFL (공식)',
        providerKey: 'bfl',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.003,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://blackforestlabs.ai/',
        note: '공식 초저가 $0.003/장'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.003,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://fireworks.ai',
        note: '동가 서빙'
      }
    ]
  },
  {
    id: 'sd-3-5-large',
    name: 'Stable Diffusion 3.5 Large',
    creator: 'Stability AI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: 'Stability AI의 고품질 이미지 생성 모델. 플래그십급 출력 품질.',
    offers: [
      {
        provider: 'Stability AI (공식)',
        providerKey: 'stability',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.065,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://platform.stability.ai/pricing',
        note: '공식 ~$0.065/장'
      },
      {
        provider: 'Fireworks AI',
        providerKey: 'fireworks',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '장',
        discountPercent: 23,
        latency: 'Fast',
        siteUrl: 'https://fireworks.ai',
        note: '글로벌 서빙'
      }
    ]
  },

  // =================================================================
  // [영상(비디오) 생성 모델 🎬 (Video)]
  // =================================================================
  {
    id: 'veo-3-1',
    name: 'Veo 3.1',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: 'Google의 최신 영상 생성 모델. Lite부터 Standard까지 다양한 티어 제공.',
    offers: [
      {
        provider: 'Google (공식 Gemini API)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '초 (Lite 720p)',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://ai.google.dev/pricing',
        note: 'Lite $0.05/초, Standard $0.40/초 (4K)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.025,
        priceUnit: '초 (Lite 720p)',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'sora-2',
    name: 'Sora 2',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: 'OpenAI의 영상 생성 모델. 2026.09.24 서비스 종료 예정. Pro 티어 지원.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.10,
        priceUnit: '초 (720p)',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://openai.com/api/pricing/',
        note: 'Standard $0.10/초, Pro $0.30~$0.70/초 (⚠ 09.24 종료)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '초 (720p)',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 (종료 전 이용)'
      }
    ]
  },
  {
    id: 'runway-gen-4-5',
    name: 'Runway Gen-4.5',
    creator: 'Runway',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: 'Runway의 최신 Gen-4.5 크리에이티브 비디오 생성 모델. 크레딧 기반 과금.',
    offers: [
      {
        provider: 'Runway (공식)',
        providerKey: 'runway',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.15,
        priceUnit: '초 (Pro 티어 기준)',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://runwayml.com/',
        note: '12크레딧/초, Pro 기준 ~$0.10~$0.23/초'
      }
    ]
  },
  {
    id: 'kling-3-0',
    name: 'Kling 3.0',
    creator: 'Kuaishou (쾌수)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: '중국 쾌수의 최신 AI 영상 생성 모델. 경쟁력 있는 가격과 고품질.',
    offers: [
      {
        provider: 'Kling AI (공식)',
        providerKey: 'kuaishou',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.075,
        priceUnit: '초 (720p)',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://klingai.com/',
        note: '~$0.075~$0.14/초'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.038,
        priceUnit: '초 (720p)',
        discountPercent: 49,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-49% 할인'
      }
    ]
  },

  // =================================================================
  // [음악/오디오 생성 모델 🎵 (Music / Audio)]
  // =================================================================
  {
    id: 'suno-v6',
    name: 'Suno V6',
    creator: 'Suno',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Music Generation',
    mediaType: 'Music',
    contextWindow: '-',
    description: 'Suno의 최신 V6 AI 작곡 모델. 텍스트 프롬프트로 풀 트랙 음악 생성.',
    offers: [
      {
        provider: 'Suno (공식)',
        providerKey: 'suno',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.10,
        priceUnit: '곡',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://suno.com/',
        note: 'Pro 기준 ~$0.10/곡 (크레딧 환산)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '곡',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'elevenlabs-tts',
    name: 'ElevenLabs Multilingual V3',
    creator: 'ElevenLabs',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Audio TTS',
    mediaType: 'Music',
    contextWindow: '-',
    description: '최고 품질 AI 음성 합성(TTS). 다국어 지원 및 음성 클로닝.',
    offers: [
      {
        provider: 'ElevenLabs (공식)',
        providerKey: 'elevenlabs',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.10,
        priceUnit: '1K 글자',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://elevenlabs.io/pricing',
        note: 'Multilingual V3 ~$0.10/1K chars'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '1K 글자',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },

  // =================================================================
  // [중국 대표 신규 LLM 및 멀티미디어 모델 14종]
  // =================================================================
  {
    id: 'doubao-1-5-pro',
    name: 'Doubao-1.5-pro-128k',
    creator: 'ByteDance',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '틱톡 모회사 바이트댄스의 주력 플래그십 LLM. 중국 내 일일 처리량 1위, 고효율 추론 능력.',
    offers: [
      {
        provider: '바이트댄스 (공식 / 火山方舟)',
        providerKey: 'bytedance',
        isOfficial: true,
        inputPer1M: 0.11,
        outputPer1M: 0.28,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.volcengine.com/product/doubao',
        note: '공식가 (128k 컨텍스트)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.14,
        cacheReadPer1M: 0.01,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 특가'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 0.12,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://openrouter.ai/',
        note: '글로벌 라우팅'
      }
    ]
  },
  {
    id: 'doubao-1-5-lite',
    name: 'Doubao-1.5-lite-128k',
    creator: 'ByteDance',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '바이트댄스의 초저지연·초저단가 경량 모델. 대규모 실시간 챗봇 및 요약 태스크 최적화.',
    offers: [
      {
        provider: '바이트댄스 (공식 / 火山方舟)',
        providerKey: 'bytedance',
        isOfficial: true,
        inputPer1M: 0.04,
        outputPer1M: 0.08,
        cacheReadPer1M: 0.01,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.volcengine.com/product/doubao',
        note: '공식 초저가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.02,
        outputPer1M: 0.04,
        cacheReadPer1M: 0.005,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'hunyuan-turbo',
    name: 'Hunyuan-Turbo (389B MoE)',
    creator: 'Tencent',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '256K',
    description: '텐센트의 389B MoE 대표 대형 언어 모델. 위챗 생태계 기반 초고속 응답 및 풍부한 지식.',
    offers: [
      {
        provider: '텐센트 클라우드 (공식)',
        providerKey: 'tencent',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.03,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://cloud.tencent.com/product/hunyuan',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.08,
        outputPer1M: 0.16,
        cacheReadPer1M: 0.015,
        discountPercent: 47,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-47% 할인'
      }
    ]
  },
  {
    id: 'hunyuan-t1',
    name: 'Hunyuan-T1 (Reasoning)',
    creator: 'Tencent',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '64K',
    description: '텐센트의 최신 심층 추론(Reasoning) 모델. 단계별 사고(CoT)를 통한 고난도 수학 및 코딩 풀이 특화.',
    offers: [
      {
        provider: '텐센트 클라우드 (공식)',
        providerKey: 'tencent',
        isOfficial: true,
        inputPer1M: 0.50,
        outputPer1M: 1.50,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://cloud.tencent.com/product/hunyuan',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.25,
        outputPer1M: 0.75,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'qwen-2-5-72b',
    name: 'Qwen 2.5 72B Instruct',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '글로벌 오픈소스 LLM 벤치마크 1위를 석권한 알리바바의 72B 매시브 인스트럭트 모델.',
    offers: [
      {
        provider: '알리바바 클라우드 (공식 DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.55,
        outputPer1M: 1.60,
        cacheReadPer1M: 0.05,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '공식가'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.35,
        outputPer1M: 0.40,
        cacheReadPer1M: null,
        discountPercent: 42,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 호스팅'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.90,
        outputPer1M: 0.90,
        cacheReadPer1M: null,
        discountPercent: 16,
        latency: 'Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: '오픈소스 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.25,
        outputPer1M: 0.55,
        cacheReadPer1M: 0.02,
        discountPercent: 63,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-63% 최저가'
      }
    ]
  },
  {
    id: 'qwen-2-5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'GPT-4o급 코딩 성능을 오픈소스로 구현한 전 세계 개발자 최선호 코딩 특화 모델.',
    offers: [
      {
        provider: '알리바바 클라우드 (공식 DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.20,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '공식가'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.20,
        cacheReadPer1M: null,
        discountPercent: 56,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.25,
        cacheReadPer1M: 0.01,
        discountPercent: 56,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-56% 할인'
      }
    ]
  },
  {
    id: 'glm-4-plus',
    name: 'GLM-4-Plus',
    creator: 'Zhipu AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '칭화대 연구진의 지푸 AI가 선보인 최신 주력 플래그십 LLM. 뛰어난 명령 추종 및 장문 추론.',
    offers: [
      {
        provider: '지푸 AI (공식 BigModel)',
        providerKey: 'zhipu',
        isOfficial: true,
        inputPer1M: 1.40,
        outputPer1M: 1.40,
        cacheReadPer1M: 0.14,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://open.bigmodel.cn',
        note: '공식 플래그십'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.50,
        outputPer1M: 0.50,
        cacheReadPer1M: 0.05,
        discountPercent: 64,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-64% 할인 특가'
      }
    ]
  },
  {
    id: 'glm-4-flash',
    name: 'GLM-4-Flash',
    creator: 'Zhipu AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '초당 100토큰 이상의 폭발적 속도를 자랑하는 지푸 AI의 초저가/무료 고속 추론 모델.',
    offers: [
      {
        provider: '지푸 AI (공식 BigModel)',
        providerKey: 'zhipu',
        isOfficial: true,
        inputPer1M: 0.01,
        outputPer1M: 0.01,
        cacheReadPer1M: 0.001,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://open.bigmodel.cn',
        note: '초저가 티어'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.005,
        outputPer1M: 0.005,
        cacheReadPer1M: 0.0005,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'sensechat-5-5',
    name: 'SenseChat 5.5',
    creator: 'SenseTime',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '센스타임의 600B 초대규모 파운데이션 모델. 중국어/영어 문맥 이해 및 멀티모달 상호작용 우수.',
    offers: [
      {
        provider: '센스타임 (공식 SenseNova)',
        providerKey: 'sensetime',
        isOfficial: true,
        inputPer1M: 0.50,
        outputPer1M: 1.20,
        cacheReadPer1M: 0.05,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://sensenova.sensetime.com/',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.20,
        outputPer1M: 0.50,
        cacheReadPer1M: 0.02,
        discountPercent: 59,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-59% 할인'
      }
    ]
  },
  {
    id: 'step-2-trillion',
    name: 'Step-2 Trillion (1T MoE)',
    creator: 'StepFun',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '64K',
    description: '중국 최초 1조(만억) 파라미터 MoE 프론티어 LLM. 복잡한 다단계 논리 추론 및 수학 풀이 최적화.',
    offers: [
      {
        provider: '스텝펀 (공식 阶跃星辰)',
        providerKey: 'stepfun',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 5.00,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://platform.stepfun.com/',
        note: '1조 MoE 공식'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.90,
        outputPer1M: 2.20,
        cacheReadPer1M: null,
        discountPercent: 56,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-56% 할인'
      }
    ]
  },
  {
    id: 'spark-4-ultra',
    name: 'Spark 4.0 Ultra (星火)',
    creator: 'iFLYTEK',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '국가 인공지능 연구소 주관 평가 1위. 텍스트 지식 및 음성-언어 융합에 탁월한 중국 대표 플래그십.',
    offers: [
      {
        provider: '아이플라이텍 (공식 SparkDesk)',
        providerKey: 'iflytek',
        isOfficial: true,
        inputPer1M: 1.50,
        outputPer1M: 1.50,
        cacheReadPer1M: 0.15,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://xinghuo.xfyun.cn/sparkapi',
        note: '공식 플래그십'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.60,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.05,
        discountPercent: 60,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 할인'
      }
    ]
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Moonshot v1-128k',
    creator: 'Moonshot',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Long Context',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '문샷 AI Kimi의 128k 컨텍스트 특화 엔드포인트. 논문 분석, 법률 검토 등 장문 데이터 추출 특화.',
    offers: [
      {
        provider: '문샷 AI (공식 Kimi)',
        providerKey: 'moonshot',
        isOfficial: true,
        inputPer1M: 0.84,
        outputPer1M: 0.84,
        cacheReadPer1M: 0.10,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://platform.moonshot.cn',
        note: '공식 장문 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.35,
        outputPer1M: 0.35,
        cacheReadPer1M: 0.04,
        discountPercent: 58,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-58% 할인'
      }
    ]
  },
  {
    id: 'kolors-img',
    name: 'Kolors (쾌수 이미지)',
    creator: 'Kuaishou',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: '쾌수(Kuaishou)의 텍스트-투-이미지 생성 모델. 중국어/영어 텍스트 타이포그래피 렌더링에 탁월.',
    offers: [
      {
        provider: '쾌수 (공식 Kling AI)',
        providerKey: 'kuaishou',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.02,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://klingai.com/',
        note: '공식 ~$0.02/장'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.01,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.01/장)'
      }
    ]
  },
  {
    id: 'cogvideox-5b',
    name: 'CogVideoX-5B',
    creator: 'Zhipu AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: '지푸 AI의 오픈소스 고품질 텍스트-투-비디오 확산 모델. 부드러운 카메라 무빙과 고해상도 생성.',
    offers: [
      {
        provider: '지푸 AI (공식 BigModel)',
        providerKey: 'zhipu',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '초',
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://open.bigmodel.cn',
        note: '공식 ~$0.05/초'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.025,
        priceUnit: '초',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.025/초)'
      }
    ]
  },
  // =================================================================
  // [대한민국(한국 🇰🇷) 신규 대표 LLM 12종]
  // =================================================================
  {
    id: 'kanana-f',
    name: 'Kanana-f (카카오 플래그십)',
    creator: 'Kakao',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '카카오의 차세대 초대규모 AI 카나나 플래그십. 뛰어난 한국어 심층 추론 및 맥락 이해.',
    offers: [
      {
        provider: '카카오 (공식 Kanana)',
        providerKey: 'kakao',
        isOfficial: true,
        inputPer1M: 1.20,
        outputPer1M: 2.40,
        cacheReadPer1M: 0.12,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://kakao.ai',
        note: '공식 플래그십'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.60,
        outputPer1M: 1.20,
        cacheReadPer1M: 0.05,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 단독 특가'
      }
    ]
  },
  {
    id: 'kanana-b',
    name: 'Kanana-b (카카오 베이스)',
    creator: 'Kakao',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '64K',
    description: '카카오톡 실시간 연동 및 모바일/서버 환경에 최적화된 고속 경량 파운데이션 모델.',
    offers: [
      {
        provider: '카카오 (공식 Kanana)',
        providerKey: 'kakao',
        isOfficial: true,
        inputPer1M: 0.25,
        outputPer1M: 0.50,
        cacheReadPer1M: 0.025,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://kakao.ai',
        note: '공식 경량 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.12,
        outputPer1M: 0.25,
        cacheReadPer1M: 0.01,
        discountPercent: 52,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-52% 할인'
      }
    ]
  },
  {
    id: 'kanana-o',
    name: 'Kanana-o (카카오 옴니 멀티모달)',
    creator: 'Kakao',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '음성, 텍스트, 이미지를 실시간으로 동시 처리하는 카카오의 차세대 옴니 상호작용 모델.',
    offers: [
      {
        provider: '카카오 (공식 Kanana)',
        providerKey: 'kakao',
        isOfficial: true,
        inputPer1M: 1.50,
        outputPer1M: 3.00,
        cacheReadPer1M: 0.15,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://kakao.ai',
        note: '공식 옴니 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.75,
        outputPer1M: 1.50,
        cacheReadPer1M: 0.08,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'solar-mini',
    name: 'Solar Mini',
    creator: 'Upstage',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '32K',
    description: '업스테이지의 대표 베스트셀러 모델. 빠른 응답성과 뛰어난 한국어/영어 처리 가성비.',
    offers: [
      {
        provider: '업스테이지 (공식 Solar)',
        providerKey: 'upstage',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.15,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://console.upstage.ai',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.075,
        outputPer1M: 0.075,
        cacheReadPer1M: 0.008,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'solar-10-7b',
    name: 'Solar 10.7B Instruct',
    creator: 'Upstage',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Open Weights',
    mediaType: 'Text',
    contextWindow: '32K',
    description: '글로벌 오픈 LLM 리더보드 세계 1위를 달성했던 업스테이지의 역사적인 오픈 가중치 모델.',
    offers: [
      {
        provider: '업스테이지 (공식 Solar)',
        providerKey: 'upstage',
        isOfficial: true,
        inputPer1M: 0.12,
        outputPer1M: 0.12,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://console.upstage.ai',
        note: '공식 오픈 모델'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.15,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: '오픈소스 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'solar-docvqa',
    name: 'Solar DocVQA (문서/OCR 특화)',
    creator: 'Upstage',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '64K',
    description: '영수증, 계약서, 복잡한 표/차트 등 엔터프라이즈 문서 분석 및 OCR 정보 추출 특화 모델.',
    offers: [
      {
        provider: '업스테이지 (공식 Solar)',
        providerKey: 'upstage',
        isOfficial: true,
        inputPer1M: 1.50,
        outputPer1M: 1.50,
        cacheReadPer1M: 0.15,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://console.upstage.ai',
        note: '공식 문서 특화'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.75,
        outputPer1M: 0.75,
        cacheReadPer1M: 0.08,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'hcx-dash',
    name: 'HyperCLOVA X DASH',
    creator: 'Naver',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '네이버의 기존 플래그십 대비 1/5 단가로 제공되는 초가성비·초고속 하이퍼클로바X 모델.',
    offers: [
      {
        provider: '네이버 클라우드 (공식)',
        providerKey: 'naver',
        isOfficial: true,
        inputPer1M: 0.30,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.03,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.ncloud.com/product/ai/clovastudio',
        note: '공식 초가성비 티어'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.015,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 특가'
      }
    ]
  },
  {
    id: 'exaone-3-5-7-8b',
    name: 'EXAONE 3.5 7.8B Instruct',
    creator: 'LG AI연구원',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Open Weights',
    mediaType: 'Text',
    contextWindow: '32K',
    description: 'LG AI연구원이 오픈소스로 공개한 동급 파라미터 세계 최고 수준 성능의 경량 모델.',
    offers: [
      {
        provider: 'LG AI연구원 (공식)',
        providerKey: 'lg',
        isOfficial: true,
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.lgresearch.ai/',
        note: '공식 오픈 가중치'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'exaone-3-5-2-4b',
    name: 'EXAONE 3.5 2.4B (온디바이스)',
    creator: 'LG AI연구원',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '16K',
    description: '스마트폰, 스마트가전, 온디바이스 엣지 AI 환경에 최적화된 초경량 초저전력 모델.',
    offers: [
      {
        provider: 'LG AI연구원 (공식)',
        providerKey: 'lg',
        isOfficial: true,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.lgresearch.ai/',
        note: '공식 온디바이스 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.025,
        outputPer1M: 0.025,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'skt-a-x',
    name: 'A.X (에이닷 LLM)',
    creator: 'SK Telecom',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '64K',
    description: 'SK텔레콤의 통화 요약, 실시간 통역, 개인비서 에이전트 서비스에 특화된 국산 LLM.',
    offers: [
      {
        provider: 'SK텔레콤 (공식 A.X)',
        providerKey: 'skt',
        isOfficial: true,
        inputPer1M: 1.50,
        outputPer1M: 3.00,
        cacheReadPer1M: 0.15,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://a-dot.ai',
        note: '공식 엔터프라이즈'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.70,
        outputPer1M: 1.40,
        cacheReadPer1M: 0.08,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 할인'
      }
    ]
  },
  {
    id: 'varco-llm',
    name: 'VARCO LLM 13B',
    creator: 'NCSOFT',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '32K',
    description: '엔씨소프트가 개발한 게임 시나리오, 퀘스트 생성, 디지털 휴먼 상호작용 특화 LLM.',
    offers: [
      {
        provider: '엔씨소프트 (공식 VARCO)',
        providerKey: 'ncsoft',
        isOfficial: true,
        inputPer1M: 0.50,
        outputPer1M: 1.00,
        cacheReadPer1M: 0.05,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://varco.ncsoft.com/',
        note: '공식 도메인 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.25,
        outputPer1M: 0.50,
        cacheReadPer1M: 0.025,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'bllossom-70b',
    name: 'Llama-3-Korean-Bllossom-70B',
    creator: 'Bllossom Community',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Open Weights',
    mediaType: 'Text',
    contextWindow: '64K',
    description: '한국어 허깅페이스 다운로드 1위 오픈 프로젝트. 정교한 한국 문화와 상식 튜닝.',
    offers: [
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.35,
        outputPer1M: 0.40,
        cacheReadPer1M: null,
        discountPercent: 30,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.20,
        outputPer1M: 0.35,
        cacheReadPer1M: 0.02,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },

  // =================================================================
  // [전 세계 TOP 글로벌 프론티어 & 오픈소스 핵심 모델 37종]
  // =================================================================
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '전 세계 개발자들의 표준 옴니 플래그십. 텍스트, 음성, 비전 통합 및 강력한 추론.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 2.50,
        outputPer1M: 10.00,
        cacheReadPer1M: 1.25,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 표준가'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 2.50,
        outputPer1M: 10.00,
        cacheReadPer1M: 1.25,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openrouter.ai',
        note: '글로벌 라우팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.25,
        outputPer1M: 5.00,
        cacheReadPer1M: 0.60,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'gpt-4-5-orion',
    name: 'GPT-4.5 (Orion)',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'OpenAI의 초대형 프론티어 파운데이션 모델. 압도적인 지식 밀도와 정교한 문장력.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 75.00,
        outputPer1M: 150.00,
        cacheReadPer1M: 37.50,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 프론티어'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 35.00,
        outputPer1M: 70.00,
        cacheReadPer1M: 17.50,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 할인'
      }
    ]
  },
  {
    id: 'o1-full',
    name: 'o1 (Full Reasoning)',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '200K',
    description: '고난도 수학, 박사급 과학, 복잡한 알고리즘 코딩을 위한 OpenAI의 심층 사고 추론 모델.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 15.00,
        outputPer1M: 60.00,
        cacheReadPer1M: 7.50,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 7.50,
        outputPer1M: 30.00,
        cacheReadPer1M: 3.75,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'o1-mini',
    name: 'o1-mini',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '코딩과 STEM 분야에 특화된 고속 심층 추론 모델. 경제적인 비용으로 고급 추론 제공.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 1.10,
        outputPer1M: 4.40,
        cacheReadPer1M: 0.55,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.55,
        outputPer1M: 2.20,
        cacheReadPer1M: 0.28,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '200K',
    description: 'OpenAI의 최신 차세대 고효율 경량 추론 모델. 압도적인 속도와 경쟁력 있는 단가.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: 1.10,
        outputPer1M: 4.40,
        cacheReadPer1M: 0.55,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 최신 추론'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.50,
        outputPer1M: 2.00,
        cacheReadPer1M: 0.25,
        discountPercent: 55,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-55% 할인'
      }
    ]
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: 'OpenAI의 상징적인 이미지 생성 모델. 자연어 프롬프트에 대한 가장 정교한 디테일 반영.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: 'Standard 1024x1024'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.02,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.02/장)'
      }
    ]
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '200K',
    description: '전 세계 개발자들이 가장 신뢰하는 코딩 및 시각 추론 벤치마크 1위 표준 모델.',
    offers: [
      {
        provider: 'Anthropic (공식)',
        providerKey: 'anthropic',
        isOfficial: true,
        inputPer1M: 3.00,
        outputPer1M: 15.00,
        cacheReadPer1M: 0.30,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.anthropic.com/pricing',
        note: '공식가 (캐시 90% 할인)'
      },
      {
        provider: 'OpenRouter',
        providerKey: 'openrouter',
        isOfficial: false,
        inputPer1M: 3.00,
        outputPer1M: 15.00,
        cacheReadPer1M: 0.30,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://openrouter.ai',
        note: '글로벌 라우팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.50,
        outputPer1M: 7.50,
        cacheReadPer1M: 0.15,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '200K',
    description: '이전 세대 Sonnet 수준의 코딩 실력을 초고속 초저단가로 제공하는 앤트로픽의 경량 플래그십.',
    offers: [
      {
        provider: 'Anthropic (공식)',
        providerKey: 'anthropic',
        isOfficial: true,
        inputPer1M: 0.80,
        outputPer1M: 4.00,
        cacheReadPer1M: 0.08,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.anthropic.com/pricing',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.40,
        outputPer1M: 2.00,
        cacheReadPer1M: 0.04,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    creator: 'Anthropic',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '200K',
    description: '복잡한 인문학적 글쓰기, 법률 문서 검토, 고난도 정성 분석에 독보적인 문장력을 발휘하는 모델.',
    offers: [
      {
        provider: 'Anthropic (공식)',
        providerKey: 'anthropic',
        isOfficial: true,
        inputPer1M: 15.00,
        outputPer1M: 75.00,
        cacheReadPer1M: 1.50,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://www.anthropic.com/pricing',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 7.50,
        outputPer1M: 37.50,
        cacheReadPer1M: 0.75,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '2M',
    description: '200만 토큰의 거대한 컨텍스트와 멀티모달 오디오/비디오/코드 통합 추론 최상위 모델.',
    offers: [
      {
        provider: 'Google (공식 AI Studio)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: 1.25,
        outputPer1M: 5.00,
        cacheReadPer1M: 0.31,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://ai.google.dev/pricing',
        note: '공식 2M 토큰'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.60,
        outputPer1M: 2.50,
        cacheReadPer1M: 0.15,
        discountPercent: 52,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-52% 최저가'
      }
    ]
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '1M',
    description: '100만 토큰 대규모 문맥을 초저지연과 파격적인 단가로 서빙하는 구글의 실시간 워크플로우 주력.',
    offers: [
      {
        provider: 'Google (공식 AI Studio)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: 0.075,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.018,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://ai.google.dev/pricing',
        note: '공식 초저가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.035,
        outputPer1M: 0.15,
        cacheReadPer1M: 0.009,
        discountPercent: 53,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 할인'
      }
    ]
  },
  {
    id: 'gemini-2-0-flash-thinking',
    name: 'Gemini 2.0 Flash Thinking',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '1M',
    description: '실시간 사고 과정(Thinking Process)을 노출하며 복잡한 수학과 코딩을 추론하는 구글의 최신 모델.',
    offers: [
      {
        provider: 'Google (공식 AI Studio)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.038,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://ai.google.dev/pricing',
        note: '공식 추론 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.019,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 할인'
      }
    ]
  },
  {
    id: 'gemma-2-27b',
    name: 'Gemma 2 27B',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Open Weights',
    mediaType: 'Text',
    contextWindow: '8K',
    description: '구글이 오픈 가중치로 제공하는 최고 성능의 27B 모델. 뛰어난 효율과 고품질 텍스트 생성.',
    offers: [
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.08,
        outputPer1M: 0.08,
        cacheReadPer1M: null,
        discountPercent: 60,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 최저가'
      }
    ]
  },
  {
    id: 'imagen-3',
    name: 'Imagen 3',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: '구글의 최고 화질 텍스트-투-이미지 생성 모델. 풍부한 디테일과 사실적인 텍스트 타이포그래피.',
    offers: [
      {
        provider: 'Google (공식 AI Studio)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.03,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://ai.google.dev/pricing',
        note: '공식 고화질'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.015,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.015/장)'
      }
    ]
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B Instruct',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '기존 405B급 추론 성능을 70B 파라미터로 실현한 메타의 현존 최강 오픈소스 플래그십.',
    offers: [
      {
        provider: 'Meta (Llama 공식)',
        providerKey: 'meta',
        isOfficial: true,
        inputPer1M: 0.70,
        outputPer1M: 0.80,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://llama.meta.com/',
        note: '공식 기준가'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.23,
        outputPer1M: 0.40,
        cacheReadPer1M: null,
        discountPercent: 58,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.88,
        outputPer1M: 0.88,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: 'Together 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.18,
        outputPer1M: 0.35,
        cacheReadPer1M: 0.02,
        discountPercent: 65,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-65% 최저가'
      }
    ]
  },
  {
    id: 'llama-3-1-405b',
    name: 'Llama 3.1 405B Instruct',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '오픈 가중치 역사상 최대 규모인 405B 파라미터 프론티어 모델. 최고 난도 지식과 코딩.',
    offers: [
      {
        provider: 'Meta (Llama 공식)',
        providerKey: 'meta',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 3.00,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Standard',
        siteUrl: 'https://llama.meta.com/',
        note: '공식 기준'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 1.50,
        outputPer1M: 1.50,
        cacheReadPer1M: null,
        discountPercent: 40,
        latency: 'Standard',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.80,
        outputPer1M: 1.50,
        cacheReadPer1M: 0.08,
        discountPercent: 54,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-54% 최저가'
      }
    ]
  },
  {
    id: 'llama-3-1-8b',
    name: 'Llama 3.1 8B Instruct',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '전 세계에서 가장 널리 쓰이는 표준 경량 오픈 모델. 빠른 속도와 극저비용 서빙.',
    offers: [
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.03,
        outputPer1M: 0.05,
        cacheReadPer1M: null,
        discountPercent: 45,
        latency: 'Ultra Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.02,
        outputPer1M: 0.04,
        cacheReadPer1M: null,
        discountPercent: 55,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-55% 최저가'
      }
    ]
  },
  {
    id: 'llama-3-2-11b-vision',
    name: 'Llama 3.2 11B Vision',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '이미지 입력 및 시각적 질문 응답(VQA)을 지원하는 메타의 오픈소스 멀티모달 비전 모델.',
    offers: [
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        cacheReadPer1M: null,
        discountPercent: 33,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: null,
        discountPercent: 60,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 최저가'
      }
    ]
  },
  {
    id: 'grok-2',
    name: 'Grok 2',
    creator: 'xAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '일론 머스크 xAI의 대표 플래그십 LLM. 실시간 지식과 필터 없는 직관적인 추론.',
    offers: [
      {
        provider: 'xAI (Grok 공식)',
        providerKey: 'grok_platform',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 10.00,
        cacheReadPer1M: 0.50,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://x.ai/api',
        note: '공식 플래그십'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.00,
        outputPer1M: 5.00,
        cacheReadPer1M: 0.25,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'grok-2-vision',
    name: 'Grok 2 Vision',
    creator: 'xAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '복잡한 다이어그램, 스크린샷, 차트 분석에 능통한 xAI의 최신 멀티모달 비전 모델.',
    offers: [
      {
        provider: 'xAI (Grok 공식)',
        providerKey: 'grok_platform',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 10.00,
        cacheReadPer1M: 0.50,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://x.ai/api',
        note: '공식 비전'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.00,
        outputPer1M: 5.00,
        cacheReadPer1M: 0.25,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'codestral-2501',
    name: 'Codestral 25.01',
    creator: 'Mistral AI',
    country: 'EU',
    countryLabel: '유럽/프랑스',
    flagEmoji: '🇪🇺',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '256K',
    description: '유럽 Mistral AI의 최신 코딩 및 소프트웨어 엔지니어링 전용 고속 모델 (FIM 기능 탑재).',
    offers: [
      {
        provider: 'Mistral AI (공식)',
        providerKey: 'mistral',
        isOfficial: true,
        inputPer1M: 0.30,
        outputPer1M: 0.90,
        cacheReadPer1M: 0.03,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://mistral.ai/pricing/',
        note: '공식 코딩 특화'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.45,
        cacheReadPer1M: 0.015,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'pixtral-large-124b',
    name: 'Pixtral Large 124B',
    creator: 'Mistral AI',
    country: 'EU',
    countryLabel: '유럽/프랑스',
    flagEmoji: '🇪🇺',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'Mistral Large 기반의 유럽 최고 성능 멀티모달 프론티어 비전-언어 모델.',
    offers: [
      {
        provider: 'Mistral AI (공식)',
        providerKey: 'mistral',
        isOfficial: true,
        inputPer1M: 2.00,
        outputPer1M: 6.00,
        cacheReadPer1M: 0.20,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://mistral.ai/pricing/',
        note: '공식 멀티모달'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.00,
        outputPer1M: 3.00,
        cacheReadPer1M: 0.10,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'mixtral-8x22b',
    name: 'Mixtral 8x22B',
    creator: 'Mistral AI',
    country: 'EU',
    countryLabel: '유럽/프랑스',
    flagEmoji: '🇪🇺',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '64K',
    description: '총 141B 파라미터(토큰당 39B 활성화) 대형 희소 MoE 오픈 모델의 표준.',
    offers: [
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.65,
        outputPer1M: 0.65,
        cacheReadPer1M: null,
        discountPercent: 28,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.40,
        outputPer1M: 0.40,
        cacheReadPer1M: null,
        discountPercent: 56,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-56% 최저가'
      }
    ]
  },
  {
    id: 'command-r-plus-08-2024',
    name: 'Command R+ (08-2024)',
    creator: 'Cohere',
    country: 'US',
    countryLabel: '북미/캐나다',
    flagEmoji: '🇨🇦',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '엔터프라이즈 RAG 및 외부 도구 호출(Tool Use) 분야 전 세계 1위 프론티어 모델.',
    offers: [
      {
        provider: 'Cohere (공식)',
        providerKey: 'cohere',
        isOfficial: true,
        inputPer1M: 2.50,
        outputPer1M: 10.00,
        cacheReadPer1M: 0.25,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://cohere.com/pricing',
        note: '공식 RAG 플래그십'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 1.20,
        outputPer1M: 4.80,
        cacheReadPer1M: 0.12,
        discountPercent: 52,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-52% 최저가'
      }
    ]
  },
  {
    id: 'command-r-08-2024',
    name: 'Command R (08-2024)',
    creator: 'Cohere',
    country: 'US',
    countryLabel: '북미/캐나다',
    flagEmoji: '🇨🇦',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '기업용 검색 증강 생성(RAG)을 경제적인 단가로 처리하는 고효율 비즈니스 모델.',
    offers: [
      {
        provider: 'Cohere (공식)',
        providerKey: 'cohere',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://cohere.com/pricing',
        note: '공식가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.008,
        discountPercent: 53,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 할인'
      }
    ]
  },
  {
    id: 'embed-v3-multilingual',
    name: 'Cohere Embed v3 Multilingual',
    creator: 'Cohere',
    country: 'US',
    countryLabel: '북미/캐나다',
    flagEmoji: '🇨🇦',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '512',
    description: '100개 이상의 언어에서 압도적인 검색 정확도를 제공하는 세계 최고 수준의 임베딩 모델.',
    offers: [
      {
        provider: 'Cohere (공식)',
        providerKey: 'cohere',
        isOfficial: true,
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://cohere.com/pricing',
        note: '공식 임베딩'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'phi-4-14b',
    name: 'Phi-4 (14B)',
    creator: 'Microsoft',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '16K',
    description: '합성 데이터 기반 고밀도 학습을 통해 동급 최대 성능을 자랑하는 MS의 최신 14B 모델.',
    offers: [
      {
        provider: 'Microsoft (Azure AI)',
        providerKey: 'microsoft',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.15,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://azure.microsoft.com',
        note: '공식 Azure 서빙'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.07,
        cacheReadPer1M: null,
        discountPercent: 53,
        latency: 'Ultra Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: null,
        discountPercent: 67,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-67% 최저가'
      }
    ]
  },
  {
    id: 'wizardlm-2-8x22b',
    name: 'WizardLM-2 8x22B',
    creator: 'Microsoft',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '64K',
    description: 'MS 연구진의 복잡한 다단계 추론 및 글쓰기 특화 대형 오픈소스 MoE 모델.',
    offers: [
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.50,
        outputPer1M: 0.50,
        cacheReadPer1M: null,
        discountPercent: 44,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.35,
        outputPer1M: 0.35,
        cacheReadPer1M: null,
        discountPercent: 61,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-61% 최저가'
      }
    ]
  },
  {
    id: 'amazon-nova-pro',
    name: 'Amazon Nova Pro',
    creator: 'Amazon',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '300K',
    description: '아마존 AWS가 자체 개발한 차세대 멀티모달 플래그십. 30만 토큰 컨텍스트와 강력한 가성비.',
    offers: [
      {
        provider: 'Amazon (AWS Bedrock Nova)',
        providerKey: 'amazon',
        isOfficial: true,
        inputPer1M: 0.80,
        outputPer1M: 3.20,
        cacheReadPer1M: 0.20,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://aws.amazon.com/bedrock/',
        note: '공식 AWS가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.40,
        outputPer1M: 1.60,
        cacheReadPer1M: 0.10,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'amazon-nova-lite',
    name: 'Amazon Nova Lite',
    creator: 'Amazon',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '300K',
    description: '초저지연 실시간 인터랙션과 대량 문서 처리를 위한 AWS의 초저가 멀티모달 모델.',
    offers: [
      {
        provider: 'Amazon (AWS Bedrock Nova)',
        providerKey: 'amazon',
        isOfficial: true,
        inputPer1M: 0.06,
        outputPer1M: 0.24,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://aws.amazon.com/bedrock/',
        note: '공식 초저가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.03,
        outputPer1M: 0.12,
        cacheReadPer1M: 0.008,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'amazon-nova-canvas',
    name: 'Amazon Nova Canvas',
    creator: 'Amazon',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: '스튜디오급 제품 사진 및 마케팅 비주얼 생성을 위한 AWS의 전용 이미지 생성 AI.',
    offers: [
      {
        provider: 'Amazon (AWS Bedrock Nova)',
        providerKey: 'amazon',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://aws.amazon.com/bedrock/',
        note: '공식 ~$0.04/장'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.02,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.02/장)'
      }
    ]
  },
  {
    id: 'deepseek-coder-v2',
    name: 'DeepSeek-Coder-V2',
    creator: 'DeepSeek',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '338개 프로그래밍 언어를 지원하는 오픈소스 코딩 분야의 절대 강자 (236B MoE).',
    offers: [
      {
        provider: 'DeepSeek (공식)',
        providerKey: 'deepseek',
        isOfficial: true,
        inputPer1M: 0.14,
        outputPer1M: 0.28,
        cacheReadPer1M: 0.014,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://platform.deepseek.com/',
        note: '공식 초저가'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.14,
        outputPer1M: 0.28,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.14,
        cacheReadPer1M: 0.007,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'deepseek-vl2',
    name: 'DeepSeek-VL2',
    creator: 'DeepSeek',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '차트, 표, 시각적 접지(Visual Grounding)에 뛰어난 DeepSeek의 차세대 오픈 비전 모델.',
    offers: [
      {
        provider: 'DeepSeek (공식)',
        providerKey: 'deepseek',
        isOfficial: true,
        inputPer1M: 0.20,
        outputPer1M: 0.40,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://platform.deepseek.com/',
        note: '공식 비전'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.20,
        cacheReadPer1M: 0.01,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'qwen-2-5-vl-72b',
    name: 'Qwen 2.5-VL 72B',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '오픈소스 비전-언어 멀티모달 벤치마크 1위를 달성한 알리바바의 72B 비전 플래그십.',
    offers: [
      {
        provider: '알리바바 클라우드 (공식 DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.60,
        outputPer1M: 1.80,
        cacheReadPer1M: 0.06,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '공식 비전 72B'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.50,
        outputPer1M: 0.50,
        cacheReadPer1M: null,
        discountPercent: 42,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.30,
        outputPer1M: 0.80,
        cacheReadPer1M: 0.03,
        discountPercent: 54,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-54% 최저가'
      }
    ]
  },
  {
    id: 'qwen-2-5-plus',
    name: 'Qwen 2.5 Plus',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '알리바바의 최고 가성비 프론티어 모델. Max에 근접한 지능을 훨씬 경제적인 가격에 제공.',
    offers: [
      {
        provider: '알리바바 클라우드 (공식 DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.40,
        outputPer1M: 1.20,
        cacheReadPer1M: 0.04,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '공식 플러스'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.18,
        outputPer1M: 0.50,
        cacheReadPer1M: 0.02,
        discountPercent: 57,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-57% 할인'
      }
    ]
  },
  {
    id: 'flux-1-dev',
    name: 'FLUX.1 Dev',
    creator: 'Black Forest Labs',
    country: 'EU',
    countryLabel: '유럽/독일',
    flagEmoji: '🇪🇺',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: '전 세계 오픈소스 이미지 생성 분야에서 가장 많이 쓰이는 디테일과 해상도의 1위 모델.',
    offers: [
      {
        provider: 'Black Forest Labs (공식)',
        providerKey: 'bfl',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.03,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://blackforestlabs.ai/',
        note: '공식 기준'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.025,
        priceUnit: '장',
        discountPercent: 17,
        latency: 'Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: 'Together 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.015,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 ($0.015/장)'
      }
    ]
  },
  {
    id: 'recraft-v3',
    name: 'Recraft v3 / Vector',
    creator: 'Recraft AI',
    country: 'EU',
    countryLabel: '영국/유럽',
    flagEmoji: '🇬🇧',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: '전문 디자이너를 위한 고해상도 벡터 그래픽, SVG, 일러스트레이션 생성 전 세계 1위.',
    offers: [
      {
        provider: 'Recraft AI (공식)',
        providerKey: 'recraft',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.recraft.ai/',
        note: '공식 벡터 AI'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.02,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.02/장)'
      }
    ]
  },
  {
    id: 'luma-ray-2',
    name: 'Luma Ray 2 (Dream Machine)',
    creator: 'Luma AI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: 'Ray 2 기반의 극사실적 시네마틱 카메라 앵글과 부드러운 물리 효과의 AI 영상 생성 모델.',
    offers: [
      {
        provider: 'Luma AI (공식)',
        providerKey: 'luma',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.10,
        priceUnit: '초',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://lumalabs.ai/dream-machine',
        note: '공식 Ray 2'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '초',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.05/초)'
      }
    ]
  },
  {
    id: 'pika-2-0',
    name: 'Pika 2.0',
    creator: 'Pika Labs',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: 'Pikaffects 특수 효과와 모션 제어를 자랑하는 크리에이티브 소셜 비디오 생성 모델.',
    offers: [
      {
        provider: 'Pika Labs (공식)',
        providerKey: 'pika',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.08,
        priceUnit: '초',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://pika.art/',
        note: '공식 2.0 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '초',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.04/초)'
      }
    ]
  },
  {
    id: 'udio-v1-5',
    name: 'Udio v1.5',
    creator: 'Udio',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Music Generation',
    mediaType: 'Music',
    contextWindow: '-',
    description: 'DeepMind 출신 연구진이 구축한 스튜디오급 초고음질 AI 음악 작곡 및 보컬 생성 모델.',
    offers: [
      {
        provider: 'Udio (공식)',
        providerKey: 'udio',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.10,
        priceUnit: '곡',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.udio.com/',
        note: '스튜디오급 작곡'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '곡',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.05/곡)'
      }
    ]
  },
  {
    id: 'whisper-large-v3-turbo',
    name: 'Whisper Large v3 Turbo',
    creator: 'OpenAI',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Audio TTS',
    mediaType: 'Music',
    contextWindow: '-',
    description: 'OpenAI의 최신 초고속 음성 인식(STT) 모델. 8배 빠른 속도로 전 세계 언어 텍스트 변환.',
    offers: [
      {
        provider: 'OpenAI (공식)',
        providerKey: 'openai',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.006,
        priceUnit: '분',
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://openai.com/api/pricing/',
        note: '공식 $0.006/분'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.003,
        priceUnit: '분',
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://deepinfra.com',
        note: '호스팅 $0.003/분'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.003,
        priceUnit: '분',
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 ($0.003/분)'
      }
    ]
  },
  // =================================================================
  // [중국 대표 LLM & 멀티모달 2차 대규모 확장 15종]
  // =================================================================
  {
    id: 'yi-lightning',
    name: 'Yi-Lightning',
    creator: '01.AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: 'LMSYS Chatbot Arena에서 글로벌 3위, 중국 1위를 기록했던 01.AI의 초고속 고지능 플래그십.',
    offers: [
      {
        provider: '01.AI (Yi 공식)',
        providerKey: 'yi',
        isOfficial: true,
        inputPer1M: 0.14,
        outputPer1M: 0.14,
        cacheReadPer1M: 0.014,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://platform.01.ai/',
        note: '공식 초고속 플래그십'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.07,
        cacheReadPer1M: 0.007,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'qwen-2-5-math-72b',
    name: 'Qwen 2.5 Math 72B',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Reasoning & Coding',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '전 세계 오픈소스 수학 벤치마크 1위를 석권한 알리바바의 전문 수학·알고리즘 추론 모델.',
    offers: [
      {
        provider: '알리바바 클라우드 (공식 DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.60,
        outputPer1M: 1.80,
        cacheReadPer1M: 0.06,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '공식 수학 1위'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.40,
        outputPer1M: 0.60,
        cacheReadPer1M: null,
        discountPercent: 42,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.30,
        outputPer1M: 0.80,
        cacheReadPer1M: 0.03,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 최저가'
      }
    ]
  },
  {
    id: 'ernie-4-turbo',
    name: 'ERNIE 4.0 Turbo',
    creator: 'Baidu',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '바이두의 상용 주력 초고속 고지능 플래그십 LLM. 풍부한 검색 지식과 정교한 명령 수행.',
    offers: [
      {
        provider: '바이두 (Qianfan 공식)',
        providerKey: 'baidu',
        isOfficial: true,
        inputPer1M: 0.42,
        outputPer1M: 1.26,
        cacheReadPer1M: 0.042,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://cloud.baidu.com/product/wenxinworkshop',
        note: '공식 상용 플래그십'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.20,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.02,
        discountPercent: 52,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-52% 할인 특가'
      }
    ]
  },
  {
    id: 'glm-4-air',
    name: 'GLM-4-Air',
    creator: 'Zhipu AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '플래그십급 종합 성능을 1/10 단가로 서빙하는 지푸 AI의 최고 가성비 주력 모델.',
    offers: [
      {
        provider: '지푸 AI (공식 BigModel)',
        providerKey: 'zhipu',
        isOfficial: true,
        inputPer1M: 0.14,
        outputPer1M: 0.14,
        cacheReadPer1M: 0.014,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://open.bigmodel.cn',
        note: '공식 가성비 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.07,
        cacheReadPer1M: 0.007,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'glm-4-long',
    name: 'GLM-4-Long',
    creator: 'Zhipu AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Long Context',
    mediaType: 'Text',
    contextWindow: '1M',
    description: '100만 토큰의 방대한 문맥을 지원하여 장편 소설 전권 및 복합 기술 문서를 통째로 분석하는 모델.',
    offers: [
      {
        provider: '지푸 AI (공식 BigModel)',
        providerKey: 'zhipu',
        isOfficial: true,
        inputPer1M: 0.14,
        outputPer1M: 0.14,
        cacheReadPer1M: 0.014,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://open.bigmodel.cn',
        note: '공식 100만 토큰'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.07,
        cacheReadPer1M: 0.007,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'internlm-2-5-72b',
    name: 'InternLM 2.5 72B',
    creator: 'Shanghai AI Lab',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '상하이 AI 랩(국가연구소)의 대표 오픈소스 LLM. 정교한 다단계 추론과 100만 토큰 바늘찾기 100% 달성.',
    offers: [
      {
        provider: '상하이 AI 랩 (공식)',
        providerKey: 'internlm',
        isOfficial: true,
        inputPer1M: 0.50,
        outputPer1M: 1.50,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://internlm.intern-ai.org.cn',
        note: '국가 연구소 공식'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.35,
        outputPer1M: 0.50,
        cacheReadPer1M: null,
        discountPercent: 40,
        latency: 'Fast',
        siteUrl: 'https://deepinfra.com',
        note: '오픈소스 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.25,
        outputPer1M: 0.70,
        cacheReadPer1M: 0.025,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 최저가'
      }
    ]
  },
  {
    id: 'internvl-2-5-78b',
    name: 'InternVL 2.5 78B',
    creator: 'Shanghai AI Lab',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '오픈소스 멀티모달 비전 벤치마크 전 세계 1위를 다투는 상하이 AI 랩의 78B 비전-언어 모델.',
    offers: [
      {
        provider: '상하이 AI 랩 (공식)',
        providerKey: 'internlm',
        isOfficial: true,
        inputPer1M: 0.60,
        outputPer1M: 1.80,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://internlm.intern-ai.org.cn',
        note: '공식 비전 78B'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.30,
        outputPer1M: 0.80,
        cacheReadPer1M: 0.03,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 최저가'
      }
    ]
  },
  {
    id: 'doubao-vision-pro',
    name: 'Doubao-Vision-Pro',
    creator: 'ByteDance',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '바이트댄스(틱톡)의 옴니 비전 멀티모달 모델. 동영상 및 고해상도 이미지 다각도 시각 분석.',
    offers: [
      {
        provider: '바이트댄스 (공식 / 火山方舟)',
        providerKey: 'bytedance',
        isOfficial: true,
        inputPer1M: 0.20,
        outputPer1M: 0.50,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.volcengine.com/product/doubao',
        note: '공식 비전 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.25,
        cacheReadPer1M: 0.01,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'hunyuan-vision',
    name: 'Hunyuan-Vision',
    creator: 'Tencent',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '텐센트의 비전-언어 융합 모델. 도면, UI 스크린샷, 복합 차트의 시각적 그라운딩에 특화.',
    offers: [
      {
        provider: '텐센트 클라우드 (공식)',
        providerKey: 'tencent',
        isOfficial: true,
        inputPer1M: 0.30,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.03,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://cloud.tencent.com/product/hunyuan',
        note: '공식 비전'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.15,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.015,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'step-1v',
    name: 'Step-1V (비전 멀티모달)',
    creator: 'StepFun',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '스텝펀의 100B급 고해상도 비전-언어 모델. 초정밀 다큐멘트 파싱 및 복잡한 시각 논리 해석.',
    offers: [
      {
        provider: '스텝펀 (공식 阶跃星辰)',
        providerKey: 'stepfun',
        isOfficial: true,
        inputPer1M: 0.60,
        outputPer1M: 1.50,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://platform.stepfun.com/',
        note: '공식 비전 100B'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.30,
        outputPer1M: 0.75,
        cacheReadPer1M: 0.03,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'milm-mobile',
    name: 'Xiaomi MiLM 6B (온디바이스)',
    creator: 'Xiaomi',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '16K',
    description: '샤오미 HyperOS 스마트폰 및 스마트 가전 생태계에 내장된 온디바이스 모바일 엣지 LLM.',
    offers: [
      {
        provider: '샤오미 (공식 Xiaomi AI)',
        providerKey: 'xiaomi',
        isOfficial: true,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://ai.mi.com',
        note: '공식 모바일 LLM'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.03,
        outputPer1M: 0.03,
        cacheReadPer1M: null,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'taichu-3-0',
    name: 'Zidong Taichu 3.0 (자동태초)',
    creator: 'CASIA',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Multimodal',
    mediaType: 'Text',
    contextWindow: '64K',
    description: '중국과학원이 자체 개발한 중국 최초의 텍스트-영상-음성 3차원 크로스모달 옴니 파운데이션 모델.',
    offers: [
      {
        provider: '중국과학원 (공식 Taichu)',
        providerKey: 'taichu',
        isOfficial: true,
        inputPer1M: 0.80,
        outputPer1M: 2.00,
        cacheReadPer1M: null,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://taichu-ai.com',
        note: '중국 국가 랩 공식'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.40,
        outputPer1M: 1.00,
        cacheReadPer1M: 0.04,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인'
      }
    ]
  },
  {
    id: 'hailuo-ai-video',
    name: 'Hailuo AI (T2V-01)',
    creator: 'MiniMax',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: '미니맥스의 AI 비디오 모델. 인물 움직임, 복잡한 물리 상호작용, 표정 연출 전 세계 최고 수준.',
    offers: [
      {
        provider: 'Minimax (공식)',
        providerKey: 'minimax',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.10,
        priceUnit: '초',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.minimaxi.com/',
        note: '공식 ~$0.10/초'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.05,
        priceUnit: '초',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.05/초)'
      }
    ]
  },
  {
    id: 'cogview-4',
    name: 'CogView-4',
    creator: 'Zhipu AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Image Generation',
    mediaType: 'Image',
    contextWindow: '-',
    description: '지푸 AI의 최신 DiT(확산 트랜스포머) 이미지 생성 모델. 중국어/영어 텍스트 배치 및 복잡한 구도 최적화.',
    offers: [
      {
        provider: '지푸 AI (공식 BigModel)',
        providerKey: 'zhipu',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.03,
        priceUnit: '장',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://open.bigmodel.cn',
        note: '공식 DiT 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.015,
        priceUnit: '장',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.015/장)'
      }
    ]
  },
  {
    id: 'minimax-speech-01',
    name: 'MiniMax Speech-01',
    creator: 'MiniMax',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Audio TTS',
    mediaType: 'Music',
    contextWindow: '-',
    description: '미니맥스의 고감도 음성 합성 모델. 풍부한 감정 표현, 사투리/억양 제어, 자연스러운 호흡음 구현.',
    offers: [
      {
        provider: 'Minimax (공식)',
        providerKey: 'minimax',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.08,
        priceUnit: '1K 글자',
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.minimaxi.com/',
        note: '공식 ~$0.08/1K chars'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '1K 글자',
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 할인 ($0.04/1K chars)'
      }
    ]
  }
,

  // ==========================================
  // 중국 신규 멀티모달 & 비디오 (PixVerse 등)
  // ==========================================
  {
    id: 'pixverse-v3',
    name: 'PixVerse V3',
    creator: 'Alice Tech (爱诗科技)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    region: 'Asia',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: '알리스 테크놀로지의 차세대 비디오 생성 플래그십. 4K 해상도, 정교한 멀티 앵글 카메라 워크, 자연스러운 음성 립싱크 지원.',
    offers: [
      {
        provider: 'PixVerse (공식)',
        providerKey: 'pixverse',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.12,
        priceUnit: '5초 영상',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://pixverse.ai/',
        note: '공식 4K 고화질 생성 ($0.12/5s)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.06,
        priceUnit: '5초 영상',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 ($0.06/5s)'
      }
    ]
  },
  {
    id: 'pixverse-v2',
    name: 'PixVerse V2',
    creator: 'Alice Tech (爱诗科技)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    region: 'Asia',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: '초고속 렌더링에 특화된 비디오 생성 모델. 짧은 대기 시간과 안정적인 동적 모션 구현.',
    offers: [
      {
        provider: 'PixVerse (공식)',
        providerKey: 'pixverse',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.08,
        priceUnit: '5초 영상',
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://pixverse.ai/',
        note: '공식 고속 생성 ($0.08/5s)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.04,
        priceUnit: '5초 영상',
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 ($0.04/5s)'
      }
    ]
  },
  {
    id: 'kimi-k1-5',
    name: 'Kimi K1.5',
    creator: 'Moonshot AI (월지암면)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    region: 'Asia',
    category: 'Reasoning',
    mediaType: 'Text',
    contextWindow: '2M',
    description: '문샷 AI의 차세대 추론 특화 200만 토큰 멀티모달 LLM. 복잡한 수학, 코딩, 심층 논리 분석에서 OpenAI o1에 필적.',
    offers: [
      {
        provider: '문샷 AI (공식 Kimi)',
        providerKey: 'moonshot',
        isOfficial: true,
        inputPer1M: 0.28,
        outputPer1M: 0.84,
        cacheReadPer1M: 0.028,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://platform.moonshot.cn/',
        note: '공식 200만 토큰'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.14,
        outputPer1M: 0.42,
        cacheReadPer1M: 0.014,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'sensenova-5-5',
    name: 'SenseNova 5.5',
    creator: 'SenseTime (상탕과기)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    region: 'Asia',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '상탕과기의 옴니 멀티모달 플래그십 파운데이션 모델. 비전·오디오·텍스트 통합 처리 및 엔터프라이즈 업무 최적화.',
    offers: [
      {
        provider: '상탕과기 (공식)',
        providerKey: 'sensetime',
        isOfficial: true,
        inputPer1M: 0.20,
        outputPer1M: 0.60,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://sensenova.sensetime.com/',
        note: '공식 엔터프라이즈'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.10,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.01,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'skywork-o1',
    name: 'Skywork O1',
    creator: 'SingTian / Kunlun (싱톈과기)',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    region: 'Asia',
    category: 'Reasoning',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '싱톈과기(쿤룬)의 오픈 추론 특화 LLM. 체계적인 사고 연쇄(CoT) 및 수학·코딩 문제해결 벤치마크 최상위.',
    offers: [
      {
        provider: '허깅페이스 (공식 가중치)',
        providerKey: 'huggingface',
        isOfficial: true,
        inputPer1M: 0.18,
        outputPer1M: 0.54,
        cacheReadPer1M: 0.018,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://huggingface.co/Skywork',
        note: '오픈 가중치'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.08,
        outputPer1M: 0.24,
        cacheReadPer1M: 0.008,
        discountPercent: 55,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-55% 최저가'
      }
    ]
  },
  {
    id: 'viggle-v2',
    name: 'Viggle V2',
    creator: 'Viggle AI',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    region: 'Asia',
    category: 'Video Generation',
    mediaType: 'Video',
    contextWindow: '-',
    description: 'JST-1 물리 엔진 기반의 캐릭터 모션 제어 및 영상 합성 모델. 원하는 캐릭터에 자유자재로 움직임 부여.',
    offers: [
      {
        provider: 'Viggle AI (공식)',
        providerKey: 'viggle',
        isOfficial: true,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.09,
        priceUnit: '영상 1건',
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://viggle.ai/',
        note: '공식 모션 비디오 ($0.09/건)'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: null,
        outputPer1M: null,
        cacheReadPer1M: null,
        pricePerUnit: 0.045,
        priceUnit: '영상 1건',
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 ($0.045/건)'
      }
    ]
  },

  // ==========================================
  // 아시아 신규 파운데이션 모델 (일본, 싱가포르, 인도)
  // ==========================================
  {
    id: 'fugaku-llm-16b',
    name: 'Fugaku-LLM 16B',
    creator: 'RIKEN & Tokyo Tech (이화학연구소)',
    country: 'JP',
    countryLabel: '일본',
    flagEmoji: '🇯🇵',
    region: 'Asia',
    category: 'Open Weights',
    mediaType: 'Text',
    contextWindow: '32K',
    description: '일본 최고 슈퍼컴퓨터 후가쿠(Fugaku)를 사용해 학습된 일본 국가대표 오픈소스 파운데이션 LLM.',
    offers: [
      {
        provider: '후가쿠 연구연합 (공식)',
        providerKey: 'fugaku',
        isOfficial: true,
        inputPer1M: 0.12,
        outputPer1M: 0.36,
        cacheReadPer1M: 0.012,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://github.com/fugaku-llm/fugaku-llm',
        note: '국책 오픈 가중치'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.18,
        cacheReadPer1M: 0.006,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'rakuten-ai-7b',
    name: 'Rakuten AI 7B',
    creator: 'Rakuten (라쿠텐)',
    country: 'JP',
    countryLabel: '일본',
    flagEmoji: '🇯🇵',
    region: 'Asia',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '32K',
    description: '일본 라쿠텐의 자체 개발 상업 및 전자상거래 최적화 경량 파운데이션 LLM. 일본어 질의응답 및 요약 특화.',
    offers: [
      {
        provider: '라쿠텐 AI (공식)',
        providerKey: 'rakuten',
        isOfficial: true,
        inputPer1M: 0.08,
        outputPer1M: 0.24,
        cacheReadPer1M: 0.008,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://corp.rakuten.co.jp/innovation/ai/',
        note: '공식 상업 LLM'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.04,
        outputPer1M: 0.12,
        cacheReadPer1M: 0.004,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'cyberagent-calm3-22b',
    name: 'CyberAgent CALM3 22B',
    creator: 'CyberAgent (사이버에이전트)',
    country: 'JP',
    countryLabel: '일본',
    flagEmoji: '🇯🇵',
    region: 'Asia',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '32K',
    description: '일본 최대 디지털 광고사 사이버에이전트의 22B 주력 LLM. 광고 카피라이팅, 크리에이티브 콘텐츠 생성 1위.',
    offers: [
      {
        provider: '사이버에이전트 (공식)',
        providerKey: 'cyberagent',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.45,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.cyberagent.co.jp/ai/',
        note: '공식 크리에이티브 LLM'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.21,
        cacheReadPer1M: 0.007,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 최저가'
      }
    ]
  },
  {
    id: 'nec-cotomi',
    name: 'NEC cotomi',
    creator: 'NEC',
    country: 'JP',
    countryLabel: '일본',
    flagEmoji: '🇯🇵',
    region: 'Asia',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '일본 엔터프라이즈 및 공공기관에 가장 널리 도입된 보안 특화 초대형 생성형 AI 파운데이션 모델.',
    offers: [
      {
        provider: 'NEC (공식)',
        providerKey: 'nec',
        isOfficial: true,
        inputPer1M: 0.25,
        outputPer1M: 0.75,
        cacheReadPer1M: 0.025,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://jpn.nec.com/generative-ai/index.html',
        note: '공식 엔터프라이즈 보안'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.12,
        outputPer1M: 0.36,
        cacheReadPer1M: 0.012,
        discountPercent: 52,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-52% 최저가'
      }
    ]
  },
  {
    id: 'sea-lion-v3-7b',
    name: 'SEA-LION v3 7B',
    creator: 'AI Singapore',
    country: 'SG',
    countryLabel: '싱가포르',
    flagEmoji: '🇸🇬',
    region: 'Asia',
    category: 'Open Weights',
    mediaType: 'Text',
    contextWindow: '32K',
    description: '싱가포르 정부의 AI Singapore 프로젝트. 인도네시아어, 태국어, 베트남어 등 동남아시아 11개국 언어 최적화.',
    offers: [
      {
        provider: 'AI Singapore (공식)',
        providerKey: 'aisingapore',
        isOfficial: true,
        inputPer1M: 0.10,
        outputPer1M: 0.30,
        cacheReadPer1M: 0.01,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://sea-lion.ai/',
        note: '아세안 국책 오픈 모델'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.15,
        cacheReadPer1M: 0.005,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  },
  {
    id: 'krutrim-pro',
    name: 'Krutrim Pro',
    creator: 'Krutrim (Ola)',
    country: 'IN',
    countryLabel: '인도',
    flagEmoji: '🇮🇳',
    region: 'Asia',
    category: 'High Performance',
    mediaType: 'Text',
    contextWindow: '128K',
    description: '인도 최초의 유니콘 AI 기업 Krutrim의 인도 22개 공용어 및 힌디어·영어 심층 다국어 파운데이션 모델.',
    offers: [
      {
        provider: 'Krutrim (공식)',
        providerKey: 'krutrim',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.45,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://krutrim.com/',
        note: '공식 인도 국산 파운데이션'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.21,
        cacheReadPer1M: 0.007,
        discountPercent: 53,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-53% 최저가'
      }
    ]
  },
  {
    id: 'sarvam-2b',
    name: 'Sarvam-2B',
    creator: 'Sarvam AI',
    country: 'IN',
    countryLabel: '인도',
    flagEmoji: '🇮🇳',
    region: 'Asia',
    category: 'Fast & Lightweight',
    mediaType: 'Text',
    contextWindow: '8K',
    description: '인도의 대표 AI 연구팀 Sarvam의 10개 인도 현지어 음성 및 텍스트 초경량 고효율 파운데이션 모델.',
    offers: [
      {
        provider: 'Sarvam AI (공식)',
        providerKey: 'sarvam',
        isOfficial: true,
        inputPer1M: 0.04,
        outputPer1M: 0.12,
        cacheReadPer1M: 0.004,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.sarvam.ai/',
        note: '공식 초경량 현지어'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.02,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.002,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가'
      }
    ]
  }

,
// =================================================================
  // [초경량(Fast & Lightweight) 최신 온디바이스/소형 LLM 라인업]
  // =================================================================
  {
    id: 'llama-3-2-1b-instruct',
    name: 'Llama 3.2 1B Instruct',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    contextWindow: '128K',
    description: 'Meta의 초경량 온디바이스 1B 모델. 모바일·엣지 장비 및 실시간 요약/분류에 최적.',
    offers: [
      {
        provider: 'Meta (Together AI)',
        providerKey: 'together',
        isOfficial: true,
        inputPer1M: 0.04,
        outputPer1M: 0.04,
        cacheReadPer1M: 0.005,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: '온디바이스 1B 초저가 서빙'
      },
      {
        provider: 'Groq (LPU)',
        providerKey: 'groq',
        isOfficial: false,
        inputPer1M: 0.04,
        outputPer1M: 0.04,
        cacheReadPer1M: 0.005,
        discountPercent: 0,
        latency: 'Ultra Fast (400 T/s)',
        siteUrl: 'https://groq.com',
        note: '초당 400+ 토큰 실시간 추론'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.02,
        outputPer1M: 0.02,
        cacheReadPer1M: 0.002,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 초경량 할인가'
      }
    ]
  },
  {
    id: 'llama-3-2-3b-instruct',
    name: 'Llama 3.2 3B Instruct',
    creator: 'Meta',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    contextWindow: '128K',
    description: 'Meta의 초고성능 3B 경량 모델. 소형 모델 중 최고 수준의 코딩 및 다국어 능력.',
    offers: [
      {
        provider: 'Meta (Together AI)',
        providerKey: 'together',
        isOfficial: true,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.008,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: 'Together 3B 서빙 단가'
      },
      {
        provider: 'Groq (LPU)',
        providerKey: 'groq',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.008,
        discountPercent: 0,
        latency: 'Ultra Fast (350 T/s)',
        siteUrl: 'https://groq.com',
        note: '초당 350+ 토큰 실시간 추론'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.03,
        outputPer1M: 0.03,
        cacheReadPer1M: 0.003,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 할인'
      }
    ]
  },
  {
    id: 'gemma-2-2b-it',
    name: 'Gemma 2 2B IT',
    creator: 'Google',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    contextWindow: '8K',
    description: 'Google DeepMind 기술로 지식 증류된 초고효율 2B 경량 모델. 랩탑 및 온디바이스 구동 최적화.',
    offers: [
      {
        provider: 'Google (공식 AI Studio)',
        providerKey: 'google',
        isOfficial: true,
        inputPer1M: 0.075,
        outputPer1M: 0.075,
        cacheReadPer1M: 0.01,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://ai.google.dev/pricing',
        note: '구글 공식 종량제'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.008,
        discountPercent: 20,
        latency: 'Ultra Fast',
        siteUrl: 'https://deepinfra.com',
        note: '서버리스 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.03,
        outputPer1M: 0.03,
        cacheReadPer1M: 0.003,
        discountPercent: 60,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-60% 파격 할인'
      }
    ]
  },
  {
    id: 'qwen-2-5-0-5b-instruct',
    name: 'Qwen 2.5 0.5B Instruct',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    contextWindow: '32K',
    description: '알리바바의 0.5B 초소형 임베디드 LLM. CPU 환경에서도 초당 수백 토큰 속도 발휘.',
    offers: [
      {
        provider: '알리바바 클라우드 (DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.03,
        outputPer1M: 0.03,
        cacheReadPer1M: 0.004,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '알리바바 공식'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.04,
        outputPer1M: 0.04,
        cacheReadPer1M: 0.005,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: 'Together 서버리스'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.015,
        outputPer1M: 0.015,
        cacheReadPer1M: 0.002,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 초저가 ($0.015/1M)'
      }
    ]
  },
  {
    id: 'qwen-2-5-1-5b-instruct',
    name: 'Qwen 2.5 1.5B Instruct',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    contextWindow: '32K',
    description: '1.5B 체급에서 압도적 1위 벤치마크. 수학, 코딩, 다국어 처리에서 대형 모델 필적.',
    offers: [
      {
        provider: '알리바바 클라우드 (DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: 0.006,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: 'DashScope 공식'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.007,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: '글로벌 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.025,
        outputPer1M: 0.025,
        cacheReadPer1M: 0.003,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 할인'
      }
    ]
  },
  {
    id: 'qwen-2-5-3b-instruct',
    name: 'Qwen 2.5 3B Instruct',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    contextWindow: '32K',
    description: '알리바바의 3B 소형 모델. 가벼운 리소스로 복합 업무 처리 및 한국어·다국어 유창.',
    offers: [
      {
        provider: '알리바바 클라우드 (DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.08,
        outputPer1M: 0.08,
        cacheReadPer1M: 0.01,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '공식 단가'
      },
      {
        provider: 'DeepInfra',
        providerKey: 'deepinfra',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.07,
        cacheReadPer1M: 0.008,
        discountPercent: 12,
        latency: 'Ultra Fast',
        siteUrl: 'https://deepinfra.com',
        note: 'DeepInfra 단가'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.04,
        outputPer1M: 0.04,
        cacheReadPer1M: 0.004,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 단일 최저가'
      }
    ]
  },
  {
    id: 'qwen-2-5-7b-instruct',
    name: 'Qwen 2.5 7B Instruct',
    creator: 'Alibaba',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    contextWindow: '128K',
    description: '글로벌 개발자들에게 가장 사랑받는 7B 대표 모델. Llama 3.1 8B를 능가하는 종합 벤치마크.',
    offers: [
      {
        provider: '알리바바 클라우드 (DashScope)',
        providerKey: 'alibaba',
        isOfficial: true,
        inputPer1M: 0.12,
        outputPer1M: 0.12,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.alibabacloud.com/product/dashscope',
        note: '알리바바 공식'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.18,
        outputPer1M: 0.18,
        cacheReadPer1M: 0.02,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: 'Together 서버리스'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.06,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.006,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 ($0.06/1M)'
      }
    ]
  },
  {
    id: 'phi-3-5-mini-instruct',
    name: 'Phi-3.5 Mini Instruct (3.8B)',
    creator: 'Microsoft',
    country: 'US',
    countryLabel: '미국',
    flagEmoji: '🇺🇸',
    category: 'Fast & Lightweight',
    contextWindow: '128K',
    description: 'Microsoft의 3.8B 경량 최고봉 모델. 교과서 수준의 고품질 데이터 학습으로 대형 모델급 논리 추론.',
    offers: [
      {
        provider: 'Microsoft (Azure AI)',
        providerKey: 'microsoft',
        isOfficial: true,
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        cacheReadPer1M: 0.012,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://azure.microsoft.com/products/ai-services/',
        note: 'MS Azure 공식'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.12,
        outputPer1M: 0.12,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: 'Together 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: 0.005,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 파격 할인'
      }
    ]
  },
  {
    id: 'smollm2-1-7b-instruct',
    name: 'SmolLM2 1.7B Instruct',
    creator: 'Hugging Face',
    country: 'EU',
    countryLabel: '글로벌/유럽',
    flagEmoji: '🇪🇺',
    category: 'Fast & Lightweight',
    contextWindow: '8K',
    description: 'Hugging Face의 차세대 온디바이스 로컬 소형 언어 모델. 텍스트 정제, 펑션 콜링 최적화.',
    offers: [
      {
        provider: 'Hugging Face (Serverless)',
        providerKey: 'huggingface',
        isOfficial: true,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: 0.006,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://huggingface.co/blog/smollm2',
        note: '허깅페이스 서버리스'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.025,
        outputPer1M: 0.025,
        cacheReadPer1M: 0.003,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 서빙'
      }
    ]
  },
  {
    id: 'ministral-3b-instruct',
    name: 'Ministral 3B',
    creator: 'Mistral AI',
    country: 'EU',
    countryLabel: '유럽',
    flagEmoji: '🇪🇺',
    category: 'Fast & Lightweight',
    contextWindow: '128K',
    description: 'Mistral AI의 최신 엣지/온디바이스 3B 모델. 지연시간 극소화 및 오프라인 구동 최적.',
    offers: [
      {
        provider: 'Mistral (공식 La Plateforme)',
        providerKey: 'mistral',
        isOfficial: true,
        inputPer1M: 0.10,
        outputPer1M: 0.10,
        cacheReadPer1M: 0.01,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://mistral.ai/technology/#models',
        note: '공식 엣지 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.05,
        cacheReadPer1M: 0.005,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 할인'
      }
    ]
  },
  {
    id: 'ministral-8b-instruct',
    name: 'Ministral 8B',
    creator: 'Mistral AI',
    country: 'EU',
    countryLabel: '유럽',
    flagEmoji: '🇪🇺',
    category: 'Fast & Lightweight',
    contextWindow: '128K',
    description: '강력한 다국어 및 코드 이해도를 갖춘 엣지용 8B 고성능 경량 모델.',
    offers: [
      {
        provider: 'Mistral (공식 La Plateforme)',
        providerKey: 'mistral',
        isOfficial: true,
        inputPer1M: 0.15,
        outputPer1M: 0.15,
        cacheReadPer1M: 0.015,
        discountPercent: 0,
        latency: 'Fast',
        siteUrl: 'https://mistral.ai/technology/#models',
        note: '공식 8B 요금'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.075,
        outputPer1M: 0.075,
        cacheReadPer1M: 0.0075,
        discountPercent: 50,
        latency: 'Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 최저가 할인'
      }
    ]
  },
  {
    id: 'deepseek-r1-distill-qwen-1-5b',
    name: 'DeepSeek-R1-Distill-Qwen-1.5B',
    creator: 'DeepSeek',
    country: 'CN',
    countryLabel: '중국',
    flagEmoji: '🇨🇳',
    category: 'Fast & Lightweight',
    contextWindow: '64K',
    description: 'DeepSeek R1의 심층 추론 사고(Chain-of-Thought)를 1.5B에 응축한 초소형 추론 모델.',
    offers: [
      {
        provider: 'DeepSeek (공식)',
        providerKey: 'deepseek',
        isOfficial: true,
        inputPer1M: 0.04,
        outputPer1M: 0.06,
        cacheReadPer1M: 0.005,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://platform.deepseek.com',
        note: '공식 추론 단가'
      },
      {
        provider: 'Together AI',
        providerKey: 'together',
        isOfficial: false,
        inputPer1M: 0.05,
        outputPer1M: 0.07,
        cacheReadPer1M: 0.006,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.together.ai/pricing',
        note: 'Together 호스팅'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.02,
        outputPer1M: 0.03,
        cacheReadPer1M: 0.0025,
        discountPercent: 50,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-50% 초경량 추론가'
      }
    ]
  },
  {
    id: 'lg-exaone-3-5-2-4b',
    name: 'EXAONE 3.5 (2.4B)',
    creator: 'LG AI Research',
    country: 'KR',
    countryLabel: '한국',
    flagEmoji: '🇰🇷',
    category: 'Fast & Lightweight',
    contextWindow: '32K',
    description: 'LG AI 연구원의 한국어/영어 바이링구얼 초경량 2.4B 온디바이스 모델.',
    offers: [
      {
        provider: 'LG AI Research (공식)',
        providerKey: 'lg',
        isOfficial: true,
        inputPer1M: 0.08,
        outputPer1M: 0.08,
        cacheReadPer1M: 0.01,
        discountPercent: 0,
        latency: 'Ultra Fast',
        siteUrl: 'https://www.lgresearch.ai',
        note: 'LG 공식 기준가'
      },
      {
        provider: 'Hugging Face (Endpoints)',
        providerKey: 'huggingface',
        isOfficial: false,
        inputPer1M: 0.07,
        outputPer1M: 0.07,
        cacheReadPer1M: 0.009,
        discountPercent: 12,
        latency: 'Ultra Fast',
        siteUrl: 'https://huggingface.co/LGAI-EXAONE',
        note: 'HF 가중치 서빙'
      },
      {
        provider: 'KIE API',
        providerKey: 'kie',
        isOfficial: false,
        inputPer1M: 0.035,
        outputPer1M: 0.035,
        cacheReadPer1M: 0.0035,
        discountPercent: 56,
        latency: 'Ultra Fast',
        siteUrl: 'https://kie.ai/pricing',
        note: '-56% 최저가 할인'
      }
    ]
  }
];

/**
 * 마지막 업데이트 일시 조회
 */
export function getLastUpdatedTimestamp() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
    if (saved) {
      // 날짜 형태만 추출 (예: 2026.09.15 또는 2026-09-15)
      const match = saved.match(/(\d{4})[.-](\d{2})[.-](\d{2})/);
      if (match) {
        const cleanDate = `${match[1]}.${match[2]}.${match[3]}`;
        return cleanDate;
      }
    }
  } catch (e) {}
  return DEFAULT_TIMESTAMP || '2026.09.15';
}

/**
 * 마지막 업데이트 일시 저장
 */
export function setLastUpdatedTimestamp(timestamp) {
  try {
    localStorage.setItem(STORAGE_KEY_TIMESTAMP, timestamp);
  } catch (e) {
    console.warn('localStorage 저장 실패:', e);
  }
}

/**
 * 데이터 갱신 (새로고침 시뮬레이션 및 타임스탬프 업데이트)
 */
export function refreshPriceData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const formatted = `${year}.${month}.${day}`;
  setLastUpdatedTimestamp(formatted);
  return formatted;
}

/**
 * 모델별 최저가 및 절감 통계 자동 계산
 */
export function processModelsData(models = RAW_MODELS) {
  return models.map(model => {
    const officialOffer = model.offers.find(o => o.isOfficial) || model.offers[0];
    const calcCost = (offer) => offer.inputPer1M + offer.outputPer1M;

    let lowestOffer = model.offers[0];
    let lowestCost = calcCost(lowestOffer);

    model.offers.forEach(offer => {
      const cost = calcCost(offer);
      if (cost < lowestCost) {
        lowestCost = cost;
        lowestOffer = offer;
      }
    });

    const officialCost = calcCost(officialOffer);
    const enrichedOffers = model.offers.map(offer => {
      const currentCost = calcCost(offer);
      const isLowest = offer.provider === lowestOffer.provider;
      const savingPercent = officialCost > 0 
        ? Math.round(((officialCost - currentCost) / officialCost) * 100) 
        : 0;

      return {
        ...offer,
        modelId: model.id,
        modelName: model.name,
        modelCreator: model.creator,
        modelCategory: model.category,
        modelContext: model.contextWindow,
        country: model.country,
        countryLabel: model.countryLabel,
        flagEmoji: model.flagEmoji,
        isLowest,
        total1MCost: currentCost,
        savingPercentVsOfficial: Math.max(0, savingPercent)
      };
    });

    return {
      ...model,
      officialOffer,
      lowestOffer,
      lowestTotal1MCost: lowestCost,
      officialTotal1MCost: officialCost,
      maxDiscountPercent: Math.max(...enrichedOffers.map(o => o.savingPercentVsOfficial || 0)),
      offers: enrichedOffers
    };
  });
}

/**
 * 사이트(플랫폼)별로 그룹화된 데이터 생성
 */
export function getSiteGroupedData(processedModels = processModelsData(RAW_MODELS)) {
  const sitesMap = new Map();

  // 모든 플랫폼 메타데이터 초기화
  Object.keys(PLATFORMS_INFO).forEach(key => {
    const info = PLATFORMS_INFO[key];
    sitesMap.set(key, {
      ...info,
      modelsCount: 0,
      lowestCount: 0,
      maxDiscount: 0,
      models: []
    });
  });

  // 모델들의 각 오퍼를 해당 사이트에 매핑
  processedModels.forEach(model => {
    model.offers.forEach(offer => {
      const pKey = offer.providerKey;
      let siteEntry = sitesMap.get(pKey);

      if (!siteEntry) {
        siteEntry = {
          id: pKey,
          name: offer.provider,
          country: model.country || 'US',
          countryLabel: model.countryLabel || '글로벌',
          flag: model.flagEmoji || '🌐',
          type: offer.isOfficial ? 'official' : 'aggregator',
          typeLabel: offer.isOfficial ? '공식 개발사' : '통합 애그리게이터',
          badgeClass: offer.isOfficial ? 'official' : 'aggregator',
          description: `${offer.provider}에서 서비스하는 엔드포인트`,
          features: ['API 엔드포인트'],
          siteUrl: offer.siteUrl,
          modelsCount: 0,
          lowestCount: 0,
          maxDiscount: 0,
          models: []
        };
        sitesMap.set(pKey, siteEntry);
      }

      siteEntry.modelsCount += 1;
      if (offer.isLowest) {
        siteEntry.lowestCount += 1;
      }
      if (offer.savingPercentVsOfficial > siteEntry.maxDiscount) {
        siteEntry.maxDiscount = offer.savingPercentVsOfficial;
      }

      siteEntry.models.push({
        modelId: model.id,
        modelName: model.name,
        creator: model.creator,
        category: model.category,
        contextWindow: model.contextWindow,
        country: model.country,
        countryLabel: model.countryLabel,
        flagEmoji: model.flagEmoji,
        offer
      });
    });
  });

  const result = Array.from(sitesMap.values()).filter(site => site.modelsCount > 0);

  result.sort((a, b) => {
    if (b.lowestCount !== a.lowestCount) {
      return b.lowestCount - a.lowestCount;
    }
    return b.modelsCount - a.modelsCount;
  });

  return result;
}
