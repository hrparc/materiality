import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parsePDF } from '../src/utils/pdf-parser.js';
import { initGemini, getGeminiModel } from '../src/config/gemini.js';
import { GRI_SECTORS, SASB_INDUSTRIES } from '../src/config/industry-mapping.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');

/**
 * GRI/SASB 문서에서 명시적 지표를 추출하여 JSON으로 저장
 */

/**
 * AI로 GRI 문서에서 지표 추출
 */
async function extractGRIIndicators(pdfText, sectorInfo) {
  console.log(`\n📘 GRI ${sectorInfo.standard} 지표 추출 중...`);

  const genAI = initGemini();
  const proModel = getGeminiModel(genAI, 'pro');

  // "Topic Standards disclosures" 섹션 찾기
  const disclosuresIndex = pdfText.indexOf('Topic Standards disclosures');

  // "Additional" 관련 섹션 찾기
  const additionalIndex = pdfText.search(/Additional sector (recommendations|disclosures)/i);

  let relevantText = '';

  if (disclosuresIndex !== -1) {
    // Topic Standards disclosures부터 시작해서 충분한 길이 추출
    const startIndex = Math.max(0, disclosuresIndex - 500); // 앞쪽 컨텍스트 포함
    const endIndex = Math.min(pdfText.length, disclosuresIndex + 20000); // 충분히 긴 범위
    relevantText = pdfText.substring(startIndex, endIndex);
    console.log(`   📍 "Topic Standards disclosures" 섹션 발견 (위치: ${disclosuresIndex})`);
  } else {
    // 못 찾으면 Section 2 시도
    const section2Regex = /Section 2[.\s]*Likely material topics([\s\S]{0,15000})/i;
    const match = pdfText.match(section2Regex);
    relevantText = match ? match[0] : pdfText.substring(0, 15000);
    console.log(`   ⚠️  "Topic Standards disclosures" 섹션 미발견, Section 2 사용`);
  }

  const prompt = `
다음은 GRI ${sectorInfo.standard} (${sectorInfo.englishName}) 섹터 표준 문서입니다.

이 문서에서 명시적으로 나열된 모든 GRI Topic Standards를 추출해주세요.

텍스트:
${relevantText}

다음 형식의 JSON 배열로 응답해주세요:
[
  {
    "code": "GRI 305",
    "name": "Emissions",
    "nameKr": "온실가스 배출",
    "category": "E",
    "type": "필수",
    "description": "간단한 설명"
  }
]

**중요: 추출 규칙**
1. GRI 코드는 **Topic 수준만** 추출 (예: GRI 305, GRI 403)
2. 세부 공시 항목(예: GRI 305-1, GRI 305-2)은 제외
3. 각 섹션 제목을 보고 type을 구분:
   - "Topic Standards disclosures" 또는 "Disclosures" 섹션 아래 → "필수"
   - "Additional sector recommendations" 섹션 아래 → "권장"
   - "Additional sector disclosures" 섹션 아래 → "선택"

주의사항:
- 코드 형식은 반드시 "GRI XXX" (3자리 숫자만, 하이픈 없음)
- GRI 305-1, GRI 303-3 같은 세부 지표는 절대 포함하지 말 것
- category는 E(환경), S(사회), G(거버넌스) 중 하나
- 문서에 명시되지 않은 지표는 추가하지 말 것
`;

  try {
    const result = await proModel.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const indicators = JSON.parse(jsonMatch[0]);
      console.log(`   ✅ ${indicators.length}개 지표 추출 완료`);
      return indicators;
    } else {
      console.error(`   ❌ JSON 파싱 실패: JSON 배열을 찾을 수 없음`);
      console.log(`   응답 내용 (첫 500자):`, response.substring(0, 500));
    }
  } catch (error) {
    console.error(`   ❌ 추출 실패:`, error.message);
  }

  return [];
}

/**
 * AI로 SASB 문서에서 지표 추출
 */
async function extractSASBIndicators(pdfText, industryInfo) {
  console.log(`\n📗 SASB [${industryInfo.category}] ${industryInfo.name} 지표 추출 중...`);

  const genAI = initGemini();
  const proModel = getGeminiModel(genAI, 'pro');

  // "지속가능성 공시 주제" 표 부분 추출 시도
  const tableRegex = /지속가능성 공시.*?주제.*?지표([\s\S]{0,5000})/i;
  const match = pdfText.match(tableRegex);
  const relevantText = match ? match[0] : pdfText.substring(0, 8000);

  const prompt = `
다음은 SASB [${industryInfo.category}] ${industryInfo.name} 산업 표준 문서입니다.

이 문서에서 "지속가능성 공시 주제 및 회계 지표" 표에 명시된 모든 주제(Topic)를 추출해주세요.

텍스트:
${relevantText}

다음 형식의 JSON 배열로 응답해주세요:
[
  {
    "topic": "온실가스 배출",
    "topicEn": "GHG Emissions",
    "category": "E",
    "metrics": ["관련 지표 설명"],
    "type": "필수"
  }
]

주의사항:
- SASB 표에 명시된 주제만 포함
- category는 E(환경), S(사회), G(거버넌스) 중 하나
- type은 모두 "필수"로 설정 (SASB는 모두 필수 공시)
- 일반적인 설명이나 배경은 제외
`;

  try {
    const result = await proModel.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const indicators = JSON.parse(jsonMatch[0]);
      console.log(`   ✅ ${indicators.length}개 주제 추출 완료`);
      return indicators;
    }
  } catch (error) {
    console.error(`   ❌ 추출 실패:`, error.message);
  }

  return [];
}

/**
 * GRI 전체 처리
 */
async function processAllGRI() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 GRI 섹터 표준 지표 추출 시작');
  console.log('='.repeat(60));

  const griData = {};

  for (const [key, sectorInfo] of Object.entries(GRI_SECTORS)) {
    try {
      const pdfPath = path.join(ROOT_DIR, 'standards', 'GRI', sectorInfo.fileName);
      console.log(`\n처리 중: ${sectorInfo.fileName}`);

      const pdfData = await parsePDF(pdfPath);
      const indicators = await extractGRIIndicators(pdfData.text, sectorInfo);

      griData[sectorInfo.standard] = {
        name: sectorInfo.name,
        englishName: sectorInfo.englishName,
        fileName: sectorInfo.fileName,
        indicators: indicators,
      };

      // API 제한 고려
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ ${sectorInfo.fileName} 처리 실패:`, error.message);
    }
  }

  // JSON 저장
  const outputPath = path.join(ROOT_DIR, 'backend', 'src', 'data', 'gri-indicators.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(griData, null, 2), 'utf-8');

  console.log(`\n✅ GRI 지표 데이터 저장 완료: ${outputPath}`);
  return griData;
}

/**
 * SASB 전체 처리
 */
async function processAllSASB() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 SASB 산업 표준 지표 추출 시작');
  console.log('='.repeat(60));

  const sasbData = {};

  for (const industryInfo of SASB_INDUSTRIES) {
    try {
      const pdfPath = path.join(ROOT_DIR, 'standards', 'SASB', industryInfo.fileName);
      console.log(`\n처리 중: ${industryInfo.fileName}`);

      const pdfData = await parsePDF(pdfPath);
      const indicators = await extractSASBIndicators(pdfData.text, industryInfo);

      sasbData[industryInfo.id] = {
        category: industryInfo.category,
        name: industryInfo.name,
        fileName: industryInfo.fileName,
        topics: indicators,
      };

      // API 제한 고려
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ ${industryInfo.fileName} 처리 실패:`, error.message);
    }
  }

  // JSON 저장
  const outputPath = path.join(ROOT_DIR, 'backend', 'src', 'data', 'sasb-indicators.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(sasbData, null, 2), 'utf-8');

  console.log(`\n✅ SASB 지표 데이터 저장 완료: ${outputPath}`);
  return sasbData;
}

/**
 * 메인 실행
 */
async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('🚀 ESG 표준 지표 추출 시작');
  console.log('█'.repeat(60));

  const args = process.argv.slice(2);
  const processAll = args.length === 0 || args.includes('all');

  try {
    if (processAll || args.includes('gri')) {
      await processAllGRI();
    }

    if (processAll || args.includes('sasb')) {
      await processAllSASB();
    }

    console.log('\n' + '█'.repeat(60));
    console.log('✅ 모든 지표 추출 완료!');
    console.log('█'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
