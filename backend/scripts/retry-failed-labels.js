/**
 * 라벨링 실패한 이슈만 재시도
 *
 * 실행 방법:
 * node scripts/retry-failed-labels.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initGemini } from '../src/config/gemini.js';
import { IssueLabelingService } from '../src/services/issue-labeling-service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

async function main() {
  console.log('═'.repeat(60));
  console.log('🔄 실패한 이슈 재라벨링 스크립트');
  console.log('═'.repeat(60));

  try {
    // 1. Gemini AI 초기화
    console.log('\n1️⃣  Gemini AI 초기화 중...');
    const genAI = initGemini();
    const labelingService = new IssueLabelingService(genAI);
    console.log('✅ Gemini AI 초기화 완료');

    // 2. 기존 데이터 로드
    console.log('\n2️⃣  기존 데이터 로드 중...');
    const dataPath = path.join(ROOT_DIR, 'src/data/sasb-industry-issues.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const industryData = JSON.parse(rawData);
    console.log(`✅ ${industryData.length}개 산업군 데이터 로드 완료`);

    // 3. 실패한 이슈 찾기
    console.log('\n3️⃣  실패한 이슈 검색 중...');
    const failedIssues = [];

    industryData.forEach((sector, sectorIdx) => {
      sector.이슈_목록.forEach((issue, issueIdx) => {
        // ai_reasoning에 "실패" 또는 "파싱 실패"가 포함된 경우
        if (issue.ai_reasoning &&
            (issue.ai_reasoning.includes('실패') ||
             issue.ai_reasoning.includes('파싱'))) {
          failedIssues.push({
            sectorIdx,
            issueIdx,
            sector: sector.섹터명,
            issue: issue.이슈명,
          });
        }
      });
    });

    console.log(`✅ 실패한 이슈: ${failedIssues.length}개`);

    if (failedIssues.length === 0) {
      console.log('\n🎉 모든 이슈가 정상적으로 라벨링되었습니다!');
      return;
    }

    // 실패한 이슈 목록 출력
    console.log('\n실패한 이슈 목록:');
    failedIssues.forEach((item, idx) => {
      console.log(`   ${idx + 1}. [${item.sector}] ${item.issue}`);
    });

    // 4. 재라벨링 수행
    console.log('\n4️⃣  재라벨링 수행 중...');

    for (let i = 0; i < failedIssues.length; i++) {
      const { sectorIdx, issueIdx, sector, issue } = failedIssues[i];

      console.log(`\n[${i + 1}/${failedIssues.length}] ${issue}`);

      const originalIssue = industryData[sectorIdx].이슈_목록[issueIdx];
      const labeledIssue = await labelingService.labelIssue(originalIssue);

      // 업데이트
      industryData[sectorIdx].이슈_목록[issueIdx] = labeledIssue;

      // 결과 출력
      console.log(`   인권: ${labeledIssue.is_human_rights}, 기후: ${labeledIssue.issb_kssb_recommended}`);

      // API 제한 방지 (2초 대기)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ 재라벨링 완료');

    // 5. 결과 저장
    console.log('\n5️⃣  결과 저장 중...');
    fs.writeFileSync(dataPath, JSON.stringify(industryData, null, 2), 'utf-8');
    console.log(`✅ 저장 완료: ${dataPath}`);

    // 6. 최종 통계
    console.log('\n6️⃣  최종 통계:');
    let humanRightsCount = 0;
    let climateCount = 0;
    let bothCount = 0;
    let totalIssues = 0;

    industryData.forEach(sector => {
      sector.이슈_목록.forEach(issue => {
        totalIssues++;
        if (issue.is_human_rights) humanRightsCount++;
        if (issue.issb_kssb_recommended) climateCount++;
        if (issue.is_human_rights && issue.issb_kssb_recommended) bothCount++;
      });
    });

    console.log(`   총 이슈: ${totalIssues}개`);
    console.log(`   인권 이슈: ${humanRightsCount}개 (${Math.round(humanRightsCount / totalIssues * 100)}%)`);
    console.log(`   기후/환경 이슈: ${climateCount}개 (${Math.round(climateCount / totalIssues * 100)}%)`);
    console.log(`   둘 다 해당: ${bothCount}개`);

    console.log('\n═'.repeat(60));
    console.log('🎉 재라벨링 완료!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ 에러 발생:', error);
    process.exit(1);
  }
}

main();
