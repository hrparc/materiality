import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Test report upload and analysis
 */
async function testReportUpload(filePath) {
  try {
    console.log('\n='.repeat(60));
    console.log('📄 보고서 업로드 및 분석 테스트');
    console.log('='.repeat(60));

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileName = path.basename(filePath);
    console.log(`\n📁 파일: ${fileName}`);
    console.log(`📍 경로: ${filePath}`);

    // Step 1: Upload file
    console.log('\n⬆️  Step 1: 파일 업로드 중...');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: path.extname(filePath).toLowerCase() === '.pdf' ? 'application/pdf' : 'image/png'
    });

    const uploadResponse = await fetch(`${API_URL}/api/reports/upload`, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      },
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`Upload failed: ${error.error || uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ 업로드 성공!');
    console.log(`   Report ID: ${uploadData.reportId}`);
    console.log(`   File Size: ${(uploadData.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   File Type: ${uploadData.fileType}`);

    const reportId = uploadData.reportId;

    // Step 2: Analyze report
    console.log('\n🔍 Step 2: 보고서 분석 중...');
    console.log('   (이 작업은 수십 초 소요될 수 있습니다...)');

    const analyzeResponse = await fetch(`${API_URL}/api/reports/${reportId}/analyze`, {
      method: 'POST',
    });

    if (!analyzeResponse.ok) {
      const error = await analyzeResponse.json();
      throw new Error(`Analysis failed: ${error.error || analyzeResponse.statusText}`);
    }

    const analysisData = await analyzeResponse.json();
    console.log('✅ 분석 완료!');
    console.log(`   추출된 이슈 개수: ${analysisData.totalIssues}`);

    // Step 3: Display results
    console.log('\n📊 추출된 이슈 목록:');
    console.log('='.repeat(60));

    if (analysisData.issues && analysisData.issues.length > 0) {
      analysisData.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.issue_name}`);
        if (issue.issue_name_en) {
          console.log(`   (${issue.issue_name_en})`);
        }
        console.log(`   카테고리: ${issue.category}`);
        console.log(`   설명: ${issue.description}`);
        if (issue.context) {
          console.log(`   맥락: ${issue.context.substring(0, 100)}...`);
        }
        if (issue.page_reference) {
          console.log(`   위치: ${issue.page_reference}`);
        }
      });

      console.log('\n📈 분석 메타데이터:');
      console.log(`   총 이슈 수: ${analysisData.metadata.total_issues_found}`);
      console.log(`   중대성 섹션 발견: ${analysisData.metadata.materiality_section_found ? '예' : '아니오'}`);
      console.log(`   추출 신뢰도: ${analysisData.metadata.extraction_confidence}`);
      if (analysisData.metadata.pageCount) {
        console.log(`   페이지 수: ${analysisData.metadata.pageCount}`);
      }
      console.log(`   텍스트 길이: ${analysisData.metadata.textLength?.toLocaleString()} 자`);
    } else {
      console.log('\n⚠️  추출된 이슈가 없습니다.');
      console.log('   보고서에 중대성 평가 섹션이 없거나, 텍스트 추출에 실패했을 수 있습니다.');
    }

    // Step 4: Get issues via GET endpoint
    console.log('\n🔍 Step 3: GET 엔드포인트로 이슈 조회...');
    const getResponse = await fetch(`${API_URL}/api/reports/${reportId}/issues`);

    if (!getResponse.ok) {
      throw new Error('Failed to get issues');
    }

    const getData = await getResponse.json();
    console.log('✅ 조회 성공!');
    console.log(`   Report ID: ${getData.reportId}`);
    console.log(`   업로드 시각: ${new Date(getData.uploadedAt).toLocaleString('ko-KR')}`);
    console.log(`   추출 시각: ${new Date(getData.extractedAt).toLocaleString('ko-KR')}`);

    console.log('\n='.repeat(60));
    console.log('✅ 테스트 완료!');
    console.log('='.repeat(60) + '\n');

    return {
      reportId,
      issues: analysisData.issues,
      metadata: analysisData.metadata
    };

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('상세:', error);
    throw error;
  }
}

// Run test if file path is provided
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('\n사용법: npm run test-report-upload <파일경로>');
  console.log('\n예시:');
  console.log('  npm run test-report-upload ./test-data/sample-report.pdf');
  console.log('  npm run test-report-upload ./test-data/report-screenshot.png');
  console.log('\n⚠️  제한 사항:');
  console.log('  - 파일 크기: 최대 3MB');
  console.log('  - PDF: 최대 5페이지');
  console.log('  - 형식: PDF, JPG, PNG만 지원');
  console.log('\n💡 권장 사항:');
  console.log('  - 전체 ESG 보고서가 아닌 "중대성 평가" 섹션만 업로드하세요');
  console.log('  - 보고서가 크다면 해당 페이지를 PDF로 따로 추출하거나');
  console.log('  - 해당 페이지를 스크린샷(JPG/PNG)으로 캡처하여 업로드하세요\n');
  process.exit(1);
}

const filePath = path.resolve(args[0]);
testReportUpload(filePath)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
