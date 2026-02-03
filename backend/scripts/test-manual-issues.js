/**
 * 수동 이슈 입력 API 테스트 스크립트
 *
 * 사용법:
 * npm run test-manual-issues
 */

import FormData from 'form-data';

const API_BASE_URL = 'http://localhost:3001';
const PROJECT_ID = 'test-project-123';

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

// 테스트 이슈 데이터
const testIssues = [
  {
    projectId: PROJECT_ID,
    이슈명: '협력사 ESG 평가',
    이슈_정의: '공급망 내 협력사의 ESG 리스크를 평가하고 관리',
    category: 'S',
    is_human_rights: true,
    issb_kssb_recommended: false
  },
  {
    projectId: PROJECT_ID,
    이슈명: '재생에너지 전환',
    이슈_정의: '사업장의 에너지원을 재생에너지로 전환',
    category: 'E',
    is_human_rights: false,
    issb_kssb_recommended: true
  },
  {
    projectId: PROJECT_ID,
    이슈명: '이사회 다양성',
    이슈_정의: '이사회 구성원의 성별, 연령, 전문성 다양성 확보',
    category: 'G',
    is_human_rights: false,
    issb_kssb_recommended: false
  }
];

/**
 * 1. 이슈 생성 테스트
 */
async function testCreateIssue() {
  log('\n[TEST 1] POST /api/issues/manual - 이슈 생성', 'cyan');

  const createdIssues = [];

  for (const issue of testIssues) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issue)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        log(`  ✅ 이슈 생성 성공: ${data.issue.이슈명}`, 'green');
        log(`     ID: ${data.issue.id}`, 'blue');
        log(`     카테고리: ${data.issue.category}`, 'blue');
        log(`     인권 이슈: ${data.issue.is_human_rights ? 'O' : 'X'}`, 'blue');
        log(`     기후/환경 이슈: ${data.issue.issb_kssb_recommended ? 'O' : 'X'}`, 'blue');
        createdIssues.push(data.issue);
      } else {
        log(`  ❌ 이슈 생성 실패: ${data.error}`, 'red');
      }
    } catch (error) {
      log(`  ❌ 요청 실패: ${error.message}`, 'red');
    }
  }

  return createdIssues;
}

/**
 * 2. 이슈 목록 조회 테스트
 */
async function testGetIssues() {
  log('\n[TEST 2] GET /api/issues/manual/:projectId - 이슈 목록 조회', 'cyan');

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/manual/${PROJECT_ID}`);
    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 이슈 목록 조회 성공`, 'green');
      log(`     프로젝트 ID: ${data.projectId}`, 'blue');
      log(`     총 이슈 수: ${data.totalIssues}`, 'blue');

      data.issues.forEach((issue, index) => {
        log(`\n     [${index + 1}] ${issue.이슈명}`, 'yellow');
        log(`         ID: ${issue.id}`, 'blue');
        log(`         카테고리: ${issue.category}`, 'blue');
        log(`         출처: ${issue.source}`, 'blue');
      });
    } else {
      log(`  ❌ 조회 실패: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`  ❌ 요청 실패: ${error.message}`, 'red');
  }
}

/**
 * 3. 이슈 수정 테스트
 */
async function testUpdateIssue(issueId) {
  log('\n[TEST 3] PUT /api/issues/manual/:issueId - 이슈 수정', 'cyan');

  const updateData = {
    이슈명: '협력사 ESG 평가 (수정됨)',
    이슈_정의: '공급망 내 협력사의 ESG 리스크를 평가하고 개선 지원 (업데이트)',
    is_human_rights: true,
    issb_kssb_recommended: true  // false → true로 변경
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/manual/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 이슈 수정 성공`, 'green');
      log(`     이슈명: ${data.issue.이슈명}`, 'blue');
      log(`     기후/환경 이슈: ${data.issue.issb_kssb_recommended ? 'O (변경됨)' : 'X'}`, 'blue');
    } else {
      log(`  ❌ 수정 실패: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`  ❌ 요청 실패: ${error.message}`, 'red');
  }
}

/**
 * 4. 이슈 삭제 테스트
 */
async function testDeleteIssue(issueId) {
  log('\n[TEST 4] DELETE /api/issues/manual/:issueId - 이슈 삭제', 'cyan');

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/manual/${issueId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 이슈 삭제 성공`, 'green');
      log(`     삭제된 이슈 ID: ${data.issueId}`, 'blue');
    } else {
      log(`  ❌ 삭제 실패: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`  ❌ 요청 실패: ${error.message}`, 'red');
  }
}

/**
 * 5. 삭제 후 목록 조회 테스트
 */
async function testGetIssuesAfterDelete() {
  log('\n[TEST 5] GET /api/issues/manual/:projectId - 삭제 후 이슈 목록 조회', 'cyan');

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/manual/${PROJECT_ID}`);
    const data = await response.json();

    if (response.ok && data.success) {
      log(`  ✅ 이슈 목록 조회 성공`, 'green');
      log(`     총 이슈 수: ${data.totalIssues} (1개 삭제됨)`, 'blue');
    } else {
      log(`  ❌ 조회 실패: ${data.error}`, 'red');
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
  log('수동 이슈 입력 API 테스트 시작', 'yellow');
  log('═'.repeat(60), 'yellow');

  // 1. 이슈 생성
  const createdIssues = await testCreateIssue();

  if (createdIssues.length === 0) {
    log('\n❌ 이슈 생성에 실패하여 테스트를 중단합니다.', 'red');
    return;
  }

  // 2. 이슈 목록 조회
  await testGetIssues();

  // 3. 첫 번째 이슈 수정
  await testUpdateIssue(createdIssues[0].id);

  // 4. 두 번째 이슈 삭제
  await testDeleteIssue(createdIssues[1].id);

  // 5. 삭제 후 목록 조회
  await testGetIssuesAfterDelete();

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
