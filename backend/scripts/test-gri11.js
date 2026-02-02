import { parsePDF } from '../src/utils/pdf-parser.js';
import { initGemini, getGeminiModel } from '../src/config/gemini.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');

async function testGRI11() {
  console.log('📘 GRI 11 테스트 시작\n');

  // PDF 파싱
  const pdfPath = path.join(ROOT_DIR, 'GRI', 'GRI 11_ Oil and Gas Sector 2021.pdf');
  const pdfData = await parsePDF(pdfPath);
  console.log(`PDF 파싱 완료: ${pdfData.text.length}자`);

  // "Topic Standards disclosures" 섹션 찾기
  const disclosuresIndex = pdfData.text.indexOf('Topic Standards disclosures');
  console.log(`\n"Topic Standards disclosures" 위치: ${disclosuresIndex}`);

  if (disclosuresIndex !== -1) {
    const startIndex = Math.max(0, disclosuresIndex - 500);
    const endIndex = Math.min(pdfData.text.length, disclosuresIndex + 20000);
    const relevantText = pdfData.text.substring(startIndex, endIndex);

    console.log(`\n추출된 텍스트 길이: ${relevantText.length}자`);
    console.log(`\n=== 추출된 텍스트 샘플 (처음 2000자) ===`);
    console.log(relevantText.substring(0, 2000));
    console.log('\n===================\n');

    // AI로 지표 추출
    const genAI = initGemini();
    const proModel = getGeminiModel(genAI, 'pro');

    const prompt = `
다음은 GRI 11 (Oil and Gas) 섹터 표준 문서입니다.

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
2. 세부 공시 항목(예: GRI 305-1, GRI 305-2)은 절대 제외
3. 각 섹션 제목을 보고 type을 구분:
   - "Topic Standards disclosures" 또는 "Disclosures" 섹션 아래 → "필수"
   - "Additional sector recommendations" 섹션 아래 → "권장"
   - "Additional sector disclosures" 섹션 아래 → "선택"

주의사항:
- 코드 형식은 반드시 "GRI XXX" (3자리 숫자만, 하이픈 없음)
- GRI 305-1, GRI 303-3 같은 세부 지표는 절대 포함하지 말 것
- category는 E(환경), S(사회), G(거버넌스) 중 하나
`;

    console.log('AI 분석 중...\n');
    const result = await proModel.generateContent(prompt);
    const response = result.response.text();

    console.log('=== AI 응답 ===');
    console.log(response);
    console.log('\n================\n');

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const indicators = JSON.parse(jsonMatch[0]);
      console.log(`✅ ${indicators.length}개 지표 추출 완료\n`);
      console.log(JSON.stringify(indicators, null, 2));
    } else {
      console.log('❌ JSON 파싱 실패');
    }
  } else {
    console.log('❌ "Topic Standards disclosures" 섹션을 찾을 수 없습니다');
  }
}

testGRI11().catch(console.error);
