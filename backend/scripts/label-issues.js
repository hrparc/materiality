/**
 * SASB 산업군별 이슈에 AI 라벨링 수행
 *
 * 실행 방법:
 * node scripts/label-issues.js
 *
 * 결과:
 * - src/data/sasb-industry-issues.json 파일 업데이트
 * - 각 이슈에 is_human_rights, issb_kssb_recommended 플래그 추가
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
  console.log('🏷️  SASB 이슈 AI 라벨링 스크립트');
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

    // 총 이슈 개수 계산
    const totalIssues = industryData.reduce((sum, sector) => sum + sector.이슈_목록.length, 0);
    console.log(`   총 이슈 개수: ${totalIssues}개`);

    // 3. AI 라벨링 수행
    console.log('\n3️⃣  AI 라벨링 수행 중...');
    console.log(`   예상 소요 시간: 약 ${Math.ceil(totalIssues * 0.5 / 60)} 분`);

    const labeledData = await labelingService.labelSectorData(industryData);

    // 4. 결과 통계
    console.log('\n4️⃣  라벨링 결과 통계:');
    let humanRightsCount = 0;
    let climateCount = 0;
    let bothCount = 0;

    labeledData.forEach(sector => {
      sector.이슈_목록.forEach(issue => {
        if (issue.is_human_rights) humanRightsCount++;
        if (issue.issb_kssb_recommended) climateCount++;
        if (issue.is_human_rights && issue.issb_kssb_recommended) bothCount++;
      });
    });

    console.log(`   인권 이슈: ${humanRightsCount}개 (${Math.round(humanRightsCount / totalIssues * 100)}%)`);
    console.log(`   기후/환경 이슈: ${climateCount}개 (${Math.round(climateCount / totalIssues * 100)}%)`);
    console.log(`   둘 다 해당: ${bothCount}개`);

    // 5. 백업 생성
    console.log('\n5️⃣  기존 파일 백업 중...');
    const backupPath = path.join(ROOT_DIR, 'src/data/sasb-industry-issues.backup.json');
    fs.copyFileSync(dataPath, backupPath);
    console.log(`✅ 백업 완료: ${backupPath}`);

    // 6. 라벨링된 데이터 저장
    console.log('\n6️⃣  라벨링된 데이터 저장 중...');
    fs.writeFileSync(dataPath, JSON.stringify(labeledData, null, 2), 'utf-8');
    console.log(`✅ 저장 완료: ${dataPath}`);

    console.log('\n═'.repeat(60));
    console.log('🎉 라벨링 완료!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ 에러 발생:', error);
    process.exit(1);
  }
}

main();
