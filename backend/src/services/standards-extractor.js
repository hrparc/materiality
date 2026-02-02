import { getGeminiModel } from '../config/gemini.js';

/**
 * GRI/SASB 표준 문서에서 명시적 지표만 추출하는 서비스
 * PRD 요구사항: 필수/권장/선택 지표만 추천
 */
export class StandardsExtractor {
  constructor(genAI) {
    this.genAI = genAI;
    this.proModel = getGeminiModel(genAI, 'pro');
  }

  /**
   * GRI 섹터 표준에서 명시적 지표 추출
   * @param {Array} ragResults - RAG 검색 결과
   * @returns {Promise<Array>} 추출된 지표 목록
   */
  async extractGRIIndicators(ragResults) {
    console.log('\n📊 GRI 명시적 지표 추출 중...');

    const indicators = [];

    for (const result of ragResults) {
      const text = result.metadata?.text || '';

      // "Section 2. Likely material topics" 또는 "Topic Standards" 포함된 텍스트만
      if (text.includes('Likely material topics') ||
          text.includes('Topic Standard') ||
          text.includes('GRI ')) {

        const extracted = await this.extractIndicatorsWithAI(text, 'GRI');

        if (extracted && extracted.length > 0) {
          indicators.push(...extracted.map(ind => ({
            ...ind,
            source: 'GRI',
            fileName: result.metadata?.fileName,
            page: result.metadata?.estimatedPage,
            originalText: text.substring(0, 200) + '...',
          })));
        }
      }
    }

    console.log(`✅ GRI에서 ${indicators.length}개 지표 추출 완료`);
    return indicators;
  }

  /**
   * SASB 산업 표준에서 명시적 지표 추출
   * @param {Array} ragResults - RAG 검색 결과
   * @returns {Promise<Array>} 추출된 지표 목록
   */
  async extractSASBIndicators(ragResults) {
    console.log('\n📊 SASB 명시적 지표 추출 중...');

    const indicators = [];

    for (const result of ragResults) {
      const text = result.metadata?.text || '';

      // "지속가능성 공시 주제" 또는 "회계 지표" 포함된 텍스트만
      if (text.includes('지속가능성 공시') ||
          text.includes('회계 지표') ||
          text.includes('주제') ||
          text.includes('지표')) {

        const extracted = await this.extractIndicatorsWithAI(text, 'SASB');

        if (extracted && extracted.length > 0) {
          indicators.push(...extracted.map(ind => ({
            ...ind,
            source: 'SASB',
            fileName: result.metadata?.fileName,
            page: result.metadata?.estimatedPage,
            originalText: text.substring(0, 200) + '...',
          })));
        }
      }
    }

    console.log(`✅ SASB에서 ${indicators.length}개 지표 추출 완료`);
    return indicators;
  }

  /**
   * AI를 사용하여 텍스트에서 구조화된 지표 추출
   * @private
   */
  async extractIndicatorsWithAI(text, standard) {
    const prompt = `
다음은 ${standard} 표준 문서의 일부입니다. 이 텍스트에서 **명시적으로 제시된 ESG 지표/주제**만 추출해주세요.

텍스트:
${text}

다음 형식의 JSON 배열로 응답해주세요:
[
  {
    "indicator": "지표명 (예: 온실가스 배출)",
    "category": "E/S/G 중 하나",
    "type": "필수/권장/선택 중 하나",
    "description": "간단한 설명 (한 줄)"
  }
]

주의사항:
- 문서에 **명확히 나열된 지표**만 포함
- 일반적인 설명이나 배경 정보는 제외
- 지표가 없으면 빈 배열 [] 반환
`;

    try {
      const result = await this.proModel.generateContent(prompt);
      const response = result.response.text();

      // JSON 파싱
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const indicators = JSON.parse(jsonMatch[0]);
        return indicators.filter(ind => ind.indicator && ind.indicator.length > 0);
      }
    } catch (error) {
      console.error('   ⚠️  지표 추출 실패:', error.message);
    }

    return [];
  }

  /**
   * 중복 제거 및 우선순위 정렬
   * @param {Array} indicators - 지표 목록
   * @returns {Array} 정렬된 지표 목록
   */
  deduplicateAndSort(indicators) {
    // 지표명 기준 중복 제거
    const uniqueMap = new Map();

    indicators.forEach(ind => {
      const key = ind.indicator.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ind);
      } else {
        // 필수 > 권장 > 선택 우선순위
        const existing = uniqueMap.get(key);
        const typePriority = { '필수': 3, '권장': 2, '선택': 1 };

        if ((typePriority[ind.type] || 0) > (typePriority[existing.type] || 0)) {
          uniqueMap.set(key, ind);
        }
      }
    });

    // 타입별 정렬
    const result = Array.from(uniqueMap.values());
    result.sort((a, b) => {
      const typePriority = { '필수': 3, '권장': 2, '선택': 1 };
      return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
    });

    return result;
  }
}
