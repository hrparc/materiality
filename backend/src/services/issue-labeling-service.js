/**
 * AI 이슈 라벨링 서비스
 *
 * 이슈를 분석하여 다음 레이블을 자동으로 부여:
 * 1. is_human_rights: 인권 관련 이슈 여부
 * 2. issb_kssb_recommended: 기후/환경 이슈 여부 (ISSB/KSSB 권장)
 *
 * PRD 참조:
 * - 인권 이슈: 노동권, 차별, 안전, 프라이버시 등
 * - 기후/환경 이슈: 탄소배출, 에너지, 자원순환, 생태계 등
 */

export class IssueLabelingService {
  constructor(genAI) {
    this.genAI = genAI;
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' }); // Flash Lite for simple task
  }

  /**
   * 단일 이슈를 분석하여 레이블 부여 (재시도 로직 포함)
   * @param {Object} issue - 이슈 객체 (이슈명, 이슈_정의 포함)
   * @param {number} retryCount - 재시도 횟수 (기본값: 0)
   * @returns {Object} - 원본 이슈 + is_human_rights, issb_kssb_recommended 플래그
   */
  async labelIssue(issue, retryCount = 0) {
    const MAX_RETRIES = 3; // 최대 3번 재시도
    const RETRY_DELAY = 30000; // 429 에러 시 30초 대기

    try {
      const prompt = `다음 ESG 이슈를 분석하여 두 가지 질문에 YES 또는 NO로만 답하세요.

이슈명: ${issue.이슈명}
이슈 정의: ${issue.이슈_정의}

질문 1: 이 이슈가 "인권 관련 이슈"인가요?
- 인권 이슈의 예시: 노동권(아동노동, 강제노동, 결사의 자유), 차별(성별, 인종), 산업안전보건, 개인정보보호, 지역사회 권리 등
- YES 또는 NO로만 답하세요.

질문 2: 이 이슈가 "기후/환경 관련 이슈"인가요?
- 기후/환경 이슈의 예시: 온실가스 배출, 기후변화 영향, 에너지 효율, 재생에너지, 물 사용, 폐기물 관리, 생물다양성, 환경오염 등
- YES 또는 NO로만 답하세요.

응답 형식 (JSON만 출력):
{
  "is_human_rights": true 또는 false,
  "issb_kssb_recommended": true 또는 false,
  "reasoning": "간단한 판단 근거 (1문장)"
}`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      // JSON 추출 (마크다운 코드 블록이 있을 수 있음)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️  AI 응답에서 JSON을 찾을 수 없습니다:', responseText);
        return {
          ...issue,
          is_human_rights: false,
          issb_kssb_recommended: false,
          ai_reasoning: 'JSON 파싱 실패',
        };
      }

      const labels = JSON.parse(jsonMatch[0]);

      return {
        ...issue,
        is_human_rights: labels.is_human_rights || false,
        issb_kssb_recommended: labels.issb_kssb_recommended || false,
        ai_reasoning: labels.reasoning || '',
      };
    } catch (error) {
      // 429 에러 (Too Many Requests) 처리
      if (error.message && error.message.includes('429') && retryCount < MAX_RETRIES) {
        console.warn(`⚠️  429 에러 발생: ${issue.이슈명}`);
        console.warn(`   ${RETRY_DELAY / 1000}초 후 재시도 (${retryCount + 1}/${MAX_RETRIES})...`);

        // 30초 대기
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

        // 재시도
        return this.labelIssue(issue, retryCount + 1);
      }

      // 재시도 횟수 초과 또는 다른 에러
      console.error('❌ 이슈 라벨링 실패:', issue.이슈명, error);
      return {
        ...issue,
        is_human_rights: false,
        issb_kssb_recommended: false,
        ai_reasoning: `라벨링 실패: ${error.message}`,
      };
    }
  }

  /**
   * 여러 이슈를 한번에 라벨링
   * @param {Array} issues - 이슈 배열
   * @returns {Array} - 라벨링된 이슈 배열
   */
  async labelIssues(issues) {
    console.log(`🏷️  ${issues.length}개 이슈 라벨링 시작...`);

    const labeledIssues = [];
    for (let i = 0; i < issues.length; i++) {
      const labeledIssue = await this.labelIssue(issues[i]);
      labeledIssues.push(labeledIssue);

      // 진행상황 로그
      if ((i + 1) % 5 === 0 || i === issues.length - 1) {
        console.log(`   진행: ${i + 1}/${issues.length} (${Math.round((i + 1) / issues.length * 100)}%)`);
      }

      // API Rate Limit 방지 (0.5초 대기)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ 라벨링 완료: ${labeledIssues.length}개 이슈`);
    return labeledIssues;
  }

  /**
   * 산업군별 이슈 데이터에 라벨 추가
   * @param {Array} sectorData - 산업군 데이터 배열
   * @returns {Array} - 라벨링된 산업군 데이터
   */
  async labelSectorData(sectorData) {
    console.log(`\n🚀 전체 산업군 이슈 라벨링 시작...`);

    const labeledSectorData = [];
    for (const sector of sectorData) {
      console.log(`\n📊 [${sector.섹터명}] 라벨링 중... (이슈 ${sector.이슈_목록.length}개)`);

      const labeledIssues = await this.labelIssues(sector.이슈_목록);

      labeledSectorData.push({
        ...sector,
        이슈_목록: labeledIssues,
      });
    }

    console.log(`\n✅ 전체 라벨링 완료: ${labeledSectorData.length}개 산업군`);
    return labeledSectorData;
  }
}
