/**
 * GRI 섹터 표준과 SASB 산업 매핑
 * 각 산업에 대해 어떤 표준이 적용되는지 정의
 */

// GRI Sector Standards (업로드된 것만)
export const GRI_SECTORS = {
  'oil-gas': {
    name: '석유 및 가스',
    englishName: 'Oil and Gas',
    fileName: 'GRI 11_ Oil and Gas Sector 2021.pdf',
    standard: 'GRI 11',
  },
  'coal': {
    name: '석탄',
    englishName: 'Coal',
    fileName: 'GRI 12_ Coal Sector 2022.pdf',
    standard: 'GRI 12',
  },
  'agriculture': {
    name: '농업, 수산양식, 어업',
    englishName: 'Agriculture, Aquaculture and Fishing',
    fileName: 'GRI 13_ Agriculture Aquaculture and Fishing Sectors 2022.pdf',
    standard: 'GRI 13',
  },
  'mining': {
    name: '광업',
    englishName: 'Mining',
    fileName: 'GRI 14_ Mining Sector 2024 - English.pdf',
    standard: 'GRI 14',
  },
};

// SASB 산업 목록 (40개)
export const SASB_INDUSTRIES = [
  // 금융
  { id: 'finance-insurance', category: '금융', name: '보험', fileName: '[금융] 보험.pdf' },
  { id: 'finance-commercial-banks', category: '금융', name: '상업은행', fileName: '[금융] 상업은행.pdf' },
  { id: 'finance-securities', category: '금융', name: '증권 및 상품거래소', fileName: '[금융] 증권 및 상품거래소.pdf' },
  { id: 'finance-investment', category: '금융', name: '투자은행 및 중개', fileName: '[금융] 투자은행 및 중개.pdf' },

  // 기술 및 통신
  { id: 'tech-semiconductor', category: '기술 및 통신', name: '반도체', fileName: '[기술 및 통신] 반도체.pdf' },
  { id: 'tech-software', category: '기술 및 통신', name: '소프트웨어 및 IT 서비스', fileName: '[기술 및 통신] 소프트웨어 및 IT 서비스.pdf' },
  { id: 'tech-telecom', category: '기술 및 통신', name: '통신 서비스', fileName: '[기술 및 통신] 통신 서비스.pdf' },
  { id: 'tech-hardware', category: '기술 및 통신', name: '하드웨어', fileName: '[기술 및 통신] 하드웨어.pdf' },

  // 서비스
  { id: 'service-advertising', category: '서비스', name: '광고 및 마케팅', fileName: '[서비스] 광고 및 마케팅.pdf' },
  { id: 'service-leisure', category: '서비스', name: '레저시설', fileName: '[서비스] 레저시설.pdf' },
  { id: 'service-media', category: '서비스', name: '미디어 및 엔터테인먼트', fileName: '[서비스] 미디어 및 엔터테인먼트.pdf' },

  // 소비재
  { id: 'consumer-appliances', category: '소비재', name: '가전제품 제조', fileName: '[소비재] 가전제품 제조.pdf' },
  { id: 'consumer-household', category: '소비재', name: '가정 및 개인용품', fileName: '[소비재] 가정 및 개인용품.pdf' },
  { id: 'consumer-retail', category: '소비재', name: '대형, 전문 유통 및 배급', fileName: '[소비재] 대형, 전문 유통 및 배급.pdf' },

  // 식음료
  { id: 'food-processed', category: '식음료', name: '가공식품', fileName: '[식음료] 가공식품.pdf' },
  { id: 'food-tobacco', category: '식음료', name: '담배', fileName: '[식음료] 담배.pdf' },

  // 운송
  { id: 'transport-road', category: '운송', name: '도로 운송', fileName: '[운송] 도로 운송.pdf' },
  { id: 'transport-auto-parts', category: '운송', name: '자동차 부품', fileName: '[운송] 자동차 부품.pdf' },
  { id: 'transport-auto', category: '운송', name: '자동차', fileName: '[운송] 자동차.pdf' },
  { id: 'transport-air-logistics', category: '운송', name: '항공 운송 및 물류', fileName: '[운송] 항공 운송 및 물류.pdf' },
  { id: 'transport-air', category: '운송', name: '항공', fileName: '[운송] 항공.pdf' },
  { id: 'transport-marine', category: '운송', name: '해상 운송', fileName: '[운송] 해상 운송.pdf' },

  // 인프라
  { id: 'infra-gas', category: '인프라', name: '가스 유틸리티 및 유통', fileName: '[인프라] 가스 유틸리티 및 유통.pdf' },
  { id: 'infra-engineering', category: '인프라', name: '엔지니어링 및 건축 서비스', fileName: '[인프라] 엔지니어링 및 건축 서비스.pdf' },
  { id: 'infra-power', category: '인프라', name: '전력 및 발전', fileName: '[인프라] 전력 및 발전.pdf' },
  { id: 'infra-housing', category: '인프라', name: '주택건설', fileName: '[인프라] 주택건설.pdf' },

  // 자원 변환
  { id: 'resource-machinery', category: '자원 변환', name: '산업기계 및 제품', fileName: '[자원 변환] 산업기계 및 제품.pdf' },
  { id: 'resource-container', category: '자원 변환', name: '용기 및 포장', fileName: '[자원 변환] 용기 및 포장.pdf' },
  { id: 'resource-aerospace', category: '자원 변환', name: '우주항공 및 국방', fileName: '[자원 변환] 우주항공 및 국방.pdf' },
  { id: 'resource-electrical', category: '자원 변환', name: '전기 및 전자장비', fileName: '[자원 변환] 전기 및 전자장비.pdf' },
  { id: 'resource-chemical', category: '자원 변환', name: '화학', fileName: '[자원 변환] 화학.pdf' },

  // 재생가능 자원
  { id: 'renewable-fuel-cell', category: '재생가능 자원', name: '연료 전지 및 산업용 배터리', fileName: '[재생가능 자원 및 대체 에너지] 연료 전지 및 산업용 배터리.pdf' },
  { id: 'renewable-pulp', category: '재생가능 자원', name: '펄프 및 종이 제품', fileName: '[재생가능 자원 및 대체 에너지] 펄프 및 종이 제품.pdf' },

  // 추출물 및 광물
  { id: 'extractive-construction', category: '추출물 및 광물', name: '건축 자재', fileName: '[추출물 및 광물 처리] 건축 자재.pdf' },
  { id: 'extractive-metals', category: '추출물 및 광물', name: '금속 및 채광', fileName: '[추출물 및 광물 처리] 금속 및 채광.pdf' },
  { id: 'extractive-oil-gas', category: '추출물 및 광물', name: '석유 및 가스 - 정제 및 판매', fileName: '[추출물 및 광물 처리] 석유 및 가스 - 정제 및 판매.pdf' },
  { id: 'extractive-coal', category: '추출물 및 광물', name: '석탄 사업', fileName: '[추출물 및 광물 처리] 석탄 사업.pdf' },
  { id: 'extractive-steel', category: '추출물 및 광물', name: '철강 제조', fileName: '[추출물 및 광물 처리] 철강 제조.pdf' },

  // 헬스케어
  { id: 'healthcare-biotech', category: '헬스케어', name: '바이오기술 및 제약', fileName: '[헬스케어] 바이오기술 및 제약.pdf' },
  { id: 'healthcare-medical', category: '헬스케어', name: '의료장비 및 용품', fileName: '[헬스케어] 의료장비 및 용품.pdf' },
];

/**
 * 산업 ID로 적용 가능한 표준 찾기
 * @param {string} industryId - SASB 산업 ID
 * @returns {Object} GRI와 SASB 표준 정보
 */
export const getApplicableStandards = (industryId) => {
  const result = {
    gri: null,
    sasb: null,
  };

  // SASB 찾기
  const sasbIndustry = SASB_INDUSTRIES.find(ind => ind.id === industryId || ind.name === industryId);
  if (sasbIndustry) {
    result.sasb = sasbIndustry;
  }

  // GRI 매핑 (특정 산업만)
  const griMapping = {
    'extractive-oil-gas': 'oil-gas',  // 석유 및 가스
    'extractive-coal': 'coal',         // 석탄
    'extractive-metals': 'mining',     // 금속 및 채광 → 광업
  };

  if (griMapping[industryId]) {
    result.gri = GRI_SECTORS[griMapping[industryId]];
  }

  return result;
};

/**
 * 모든 산업 목록 반환 (드롭다운용)
 */
export const getAllIndustries = () => {
  return SASB_INDUSTRIES.map(ind => ({
    id: ind.id,
    display: `[${ind.category}] ${ind.name}`,
    category: ind.category,
    name: ind.name,
  }));
};
