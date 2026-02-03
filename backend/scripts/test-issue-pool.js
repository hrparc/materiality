/**
 * 이슈풀 통합 API 테스트 스크립트
 *
 * 사용법:
 * npm run test-issue-pool
 */

const API_BASE_URL = 'http://localhost:3001';
const PROJECT_ID = 'test-project-pool';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 1. 통합 이슈풀 조회 (산업군 기반)
 */
async function testGetIssuePool() {
  log('\n[TEST 1] GET /api/issues/pool/:projectId - 통합 이슈풀 조회', 'cyan');

  const industry = '[헬스케어] 의료장비 및 용품';

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/issues/pool/${PROJECT_ID}?industry=${encodeURIComponent(industry)}`
    );
    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 이슈풀 조회 성공`, 'green');
      log(`     프로젝트 ID: ${data.projectId}`, 'blue');
      log(`     총 이슈 수: ${data.summary.totalIssues}`, 'blue');
      log(`\n     출처별 통계:`, 'yellow');
      log(`       - 산업군 기반: ${data.summary.bySource.industry}개`, 'blue');
      log(`       - 미디어 분석: ${data.summary.bySource.media}개`, 'blue');
      log(`       - 수동 입력: ${data.summary.bySource.manual}개`, 'blue');
      log(`\n     카테고리별 통계:`, 'yellow');
      log(`       - 환경 (E): ${data.summary.byCategory.E}개`, 'blue');
      log(`       - 사회 (S): ${data.summary.byCategory.S}개`, 'blue');
      log(`       - 거버넌스 (G): ${data.summary.byCategory.G}개`, 'blue');

      // 샘플 이슈 몇 개 출력
      if (data.allIssues.length > 0) {
        log(`\n     샘플 이슈 (처음 3개):`, 'yellow');
        data.allIssues.slice(0, 3).forEach((issue, index) => {
          log(`       [${index + 1}] ${issue.이슈명}`, 'blue');
          log(`           ID: ${issue.id}`, 'blue');
          log(`           카테고리: ${issue.category}`, 'blue');
          log(`           선택 상태: ${issue.isSelected ? 'O' : 'X'}`, 'blue');
          if (issue.sources && issue.sources.length > 0) {
            const sourceTags = issue.sources.map(s => s.label).join(', ');
            log(`           출처 태그: [${sourceTags}]`, 'blue');
          }
          if (issue.is_human_rights) log(`           🏷️  인권 이슈`, 'blue');
          if (issue.issb_kssb_recommended) log(`           🏷️  기후/환경 이슈`, 'blue');
        });
      }

      return data.allIssues;
    } else {
      log(`  ❌ 조회 실패: ${data.error}`, 'red');
      return [];
    }
  } catch (error) {
    log(`  ❌ 요청 실패: ${error.message}`, 'red');
    return [];
  }
}

/**
 * 2. 이슈풀 확정
 */
async function testConfirmIssuePool(issues) {
  log('\n[TEST 2] POST /api/issues/pool/confirm - 이슈풀 확정', 'cyan');

  if (issues.length === 0) {
    log(`  ⚠️  확정할 이슈가 없습니다.`, 'yellow');
    return;
  }

  // 처음 5개 이슈 선택
  const selectedIssues = issues.slice(0, 5).map(issue => ({
    이슈명: issue.이슈명,
    이슈_정의: issue.이슈_정의 || issue.description,
    category: issue.category || 'S',
    source: issue.source,
    is_human_rights: issue.is_human_rights || false,
    issb_kssb_recommended: issue.issb_kssb_recommended || false
  }));

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/pool/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        projectName: 'Test Project - ESG Materiality',
        industry: '[헬스케어] 의료장비 및 용품',
        selectedIssues
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 이슈풀 확정 성공`, 'green');
      log(`     프로젝트 ID: ${data.projectId}`, 'blue');
      log(`     확정 시각: ${data.confirmedAt}`, 'blue');
      log(`\n     통계:`, 'yellow');
      log(`       - 총 이슈 수: ${data.stats.totalIssues}`, 'blue');
      log(`       - 인권 이슈: ${data.stats.humanRightsIssues}개`, 'blue');
      log(`       - 기후/환경 이슈: ${data.stats.climateIssues}개`, 'blue');
      log(`\n     다음 단계:`, 'yellow');
      log(`       - ${data.nextStep.action}`, 'blue');
      log(`       - ${data.nextStep.description}`, 'blue');
    } else {
      log(`  ❌ 확정 실패: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`  ❌ 요청 실패: ${error.message}`, 'red');
  }
}

/**
 * 3. 확정된 이슈풀 조회
 */
async function testGetConfirmedPool() {
  log('\n[TEST 3] GET /api/issues/pool/:projectId/confirmed - 확정된 이슈풀 조회', 'cyan');

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/pool/${PROJECT_ID}/confirmed`);
    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 확정 이슈풀 조회 성공`, 'green');
      log(`     프로젝트명: ${data.projectName}`, 'blue');
      log(`     상태: ${data.status}`, 'blue');
      log(`     이슈 수: ${data.issueCount}`, 'blue');
      log(`     확정 시각: ${data.confirmedAt}`, 'blue');
      log(`     다음 단계: ${data.nextStep}`, 'blue');
    } else {
      log(`  ❌ 조회 실패: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`  ❌ 요청 실패: ${error.message}`, 'red');
  }
}

/**
 * 4. 이슈풀 삭제 (재설정)
 */
async function testDeleteIssuePool() {
  log('\n[TEST 4] DELETE /api/issues/pool/:projectId - 이슈풀 삭제', 'cyan');

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/pool/${PROJECT_ID}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 이슈풀 삭제 성공`, 'green');
      log(`     프로젝트 ID: ${data.projectId}`, 'blue');
    } else {
      log(`  ❌ 삭제 실패: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`  ❌ 요청 실패: ${error.message}`, 'red');
  }
}

/**
 * 메인 테스트 실행
 */
async function runTests() {
  log('═'.repeat(60), 'yellow');
  log('이슈풀 통합 API 테스트 시작', 'yellow');
  log('═'.repeat(60), 'yellow');

  // 1. 통합 이슈풀 조회
  const issues = await testGetIssuePool();

  if (issues.length > 0) {
    // 2. 이슈풀 확정
    await testConfirmIssuePool(issues);

    // 3. 확정된 이슈풀 조회
    await testGetConfirmedPool();

    // 4. 이슈풀 삭제
    await testDeleteIssuePool();
  }

  log('\n' + '═'.repeat(60), 'yellow');
  log('테스트 완료!', 'yellow');
  log('═'.repeat(60), 'yellow');
  log('\n💡 서버를 중지하려면 Ctrl+C를 누르세요.\n', 'cyan');
}

// 테스트 실행
runTests().catch(error => {
  log(`\n❌ 테스트 실행 중 오류 발생: ${error.message}`, 'red');
  log('서버가 실행 중인지 확인하세요: npm start\n', 'yellow');
});
