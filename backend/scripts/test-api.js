/**
 * API 엔드포인트 테스트 스크립트
 * 서버가 실행 중일 때 이 스크립트를 실행하세요.
 */

const BASE_URL = 'http://localhost:3001';

/**
 * API 요청 헬퍼 함수
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ 요청 실패: ${endpoint}`, error.message);
    throw error;
  }
};

/**
 * 테스트 1: 헬스 체크
 */
const testHealthCheck = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📝 테스트 1: 헬스 체크');
  console.log('='.repeat(60));

  const { status, data } = await apiRequest('/health');

  console.log(`상태 코드: ${status}`);
  console.log('응답:', JSON.stringify(data, null, 2));

  if (data.status === 'ok' && data.ragServiceInitialized) {
    console.log('✅ 헬스 체크 성공!');
  } else {
    console.log('❌ 헬스 체크 실패');
  }
};

/**
 * 테스트 2: 산업군 기반 이슈 추천
 */
const testRecommendByIndustry = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📝 테스트 2: 산업군 기반 이슈 추천');
  console.log('='.repeat(60));

  const testCases = [
    { industry: '의료장비', topK: 5 },
    { industry: '석유 및 가스', topK: 5 },
    { industry: '금융 서비스', topK: 5 },
  ];

  for (const testCase of testCases) {
    console.log(`\n🏭 테스트 케이스: ${testCase.industry}`);

    const { status, data } = await apiRequest(
      '/api/issues/recommend-by-industry',
      'POST',
      testCase
    );

    console.log(`상태 코드: ${status}`);

    if (data.success) {
      console.log(`✅ ${data.totalResults}개 이슈 추천 성공`);
      console.log('\n상위 3개 추천 이슈:');

      data.recommendations.slice(0, 3).forEach((rec, idx) => {
        console.log(`\n${idx + 1}. [${rec.source}] 유사도: ${rec.score.toFixed(3)}`);
        console.log(`   ${rec.issue.text.substring(0, 100)}...`);
        console.log(`   출처: ${rec.citation.source}`);
      });
    } else {
      console.log('❌ 추천 실패:', data);
    }
  }
};

/**
 * 테스트 3: 이슈별 표준 매칭
 */
const testMatchStandards = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📝 테스트 3: 이슈별 표준 매칭');
  console.log('='.repeat(60));

  const testIssues = [
    '온실가스 배출',
    '산업안전보건',
    '데이터 프라이버시',
  ];

  for (const issue of testIssues) {
    console.log(`\n🎯 테스트 케이스: ${issue}`);

    const { status, data } = await apiRequest(
      '/api/issues/match-standards',
      'POST',
      { issue, topK: 3 }
    );

    console.log(`상태 코드: ${status}`);

    if (data.success) {
      console.log('✅ 표준 매칭 성공');

      for (const [namespace, matches] of Object.entries(data.matches)) {
        if (matches.length > 0) {
          console.log(`\n   📘 ${namespace}:`);
          matches.slice(0, 2).forEach((match, idx) => {
            console.log(`      ${idx + 1}. 유사도: ${match.score.toFixed(3)}`);
            console.log(`         ${match.text.substring(0, 80)}...`);
          });
        }
      }
    } else {
      console.log('❌ 매칭 실패:', data);
    }
  }
};

/**
 * 테스트 4: 일괄 점수 계산
 */
const testCalculateScores = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📝 테스트 4: 일괄 점수 계산');
  console.log('='.repeat(60));

  const issues = [
    { name: '온실가스 배출' },
    { name: '산업안전보건' },
    { name: '에너지 효율' },
  ];

  const { status, data } = await apiRequest(
    '/api/issues/calculate-scores',
    'POST',
    { issues }
  );

  console.log(`상태 코드: ${status}`);

  if (data.success) {
    console.log(`✅ ${data.totalIssues}개 이슈 점수 계산 성공\n`);

    data.results.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.issue}`);
      console.log(`   GRI 점수: ${result.scores.gri}`);
      console.log(`   SASB 점수: ${result.scores.sasb}`);
      console.log(`   ISSB 점수: ${result.scores.issb}`);
      console.log();
    });
  } else {
    console.log('❌ 점수 계산 실패:', data);
  }
};

/**
 * 메인 실행 함수
 */
const main = async () => {
  console.log('\n' + '█'.repeat(60));
  console.log('🧪 ESG API 엔드포인트 테스트');
  console.log('█'.repeat(60));

  try {
    // 테스트 실행
    await testHealthCheck();
    await testRecommendByIndustry();
    await testMatchStandards();
    await testCalculateScores();

    console.log('\n' + '█'.repeat(60));
    console.log('✅ 모든 테스트 완료!');
    console.log('█'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    process.exit(1);
  }
};

main();
