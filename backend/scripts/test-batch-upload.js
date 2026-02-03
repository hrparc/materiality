import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Test batch report upload and analysis
 */
async function testBatchUpload(filePaths) {
  try {
    console.log('\n='.repeat(60));
    console.log('📄 다중 보고서 업로드 및 스마트 분석 테스트');
    console.log('='.repeat(60));

    console.log(`\n📁 업로드할 파일 개수: ${filePaths.length}`);
    filePaths.forEach((fp, i) => {
      console.log(`   ${i + 1}. ${path.basename(fp)}`);
    });

    // Step 1: Upload multiple files
    console.log('\n⬆️  Step 1: 파일 업로드 중...');
    const form = new FormData();

    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' :
                         ext === '.png' ? 'image/png' : 'image/jpeg';

      form.append('files', fs.createReadStream(filePath), {
        filename: fileName,
        contentType: contentType
      });
    }

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
    console.log(`   Batch ID: ${uploadData.batchId}`);
    console.log(`   업로드된 파일: ${uploadData.files.length}개`);

    uploadData.files.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.originalName} (${(file.fileSize / 1024).toFixed(2)} KB)`);
    });

    const batchId = uploadData.batchId;

    // Step 2: Analyze batch with smart scanning
    console.log('\n🔍 Step 2: 스마트 스캔 및 분석 중...');
    console.log('   (관련 있는 파일만 분석하여 비용을 절감합니다)');
    console.log('   (이 작업은 수십 초 소요될 수 있습니다...)\n');

    const analyzeResponse = await fetch(`${API_URL}/api/reports/batch/${batchId}/analyze`, {
      method: 'POST',
    });

    if (!analyzeResponse.ok) {
      const error = await analyzeResponse.json();
      throw new Error(`Analysis failed: ${error.error || analyzeResponse.statusText}`);
    }

    const analysisData = await analyzeResponse.json();
    console.log('\n✅ 분석 완료!');

    // Display summary
    console.log('\n📊 분석 요약:');
    console.log('='.repeat(60));
    console.log(`   전체 파일: ${analysisData.summary.totalFiles}개`);
    console.log(`   스캔 완료: ${analysisData.summary.scannedFiles}개`);
    console.log(`   상세 분석: ${analysisData.summary.analyzedFiles}개 ✅`);
    console.log(`   건너뛴 파일: ${analysisData.summary.skippedFiles}개 ⏭️`);
    console.log(`   추출된 이슈: ${analysisData.summary.totalIssuesFound}개`);

    // Display file results
    console.log('\n📋 파일별 결과:');
    console.log('='.repeat(60));
    analysisData.fileResults.forEach((result, i) => {
      const statusIcon = result.status === 'completed' ? '✅' :
                        result.status === 'skipped' ? '⏭️' : '❌';
      console.log(`\n${i + 1}. ${statusIcon} ${result.fileName}`);
      console.log(`   상태: ${result.status}`);

      if (result.status === 'completed') {
        console.log(`   추출된 이슈: ${result.issuesFound}개`);
        console.log(`   신뢰도: ${result.metadata.extraction_confidence}`);
      } else if (result.status === 'skipped') {
        console.log(`   사유: ${result.reason}`);
      } else if (result.status === 'error') {
        console.log(`   에러: ${result.error}`);
      }
    });

    // Display extracted issues
    if (analysisData.issues && analysisData.issues.length > 0) {
      console.log('\n📑 추출된 이슈 목록:');
      console.log('='.repeat(60));

      analysisData.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.issue_name}`);
        if (issue.issue_name_en) {
          console.log(`   (${issue.issue_name_en})`);
        }
        console.log(`   카테고리: ${issue.category}`);
        console.log(`   설명: ${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}`);
      });
    } else {
      console.log('\n⚠️  추출된 이슈가 없습니다.');
      console.log('   모든 파일에서 중대성 이슈 목록을 찾을 수 없었습니다.');
    }

    console.log('\n='.repeat(60));
    console.log('✅ 테스트 완료!');
    console.log('='.repeat(60) + '\n');

    return {
      batchId,
      summary: analysisData.summary,
      issues: analysisData.issues
    };

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('상세:', error);
    throw error;
  }
}

// Run test if file paths are provided
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\n사용법: npm run test-batch-upload <파일경로1> [파일경로2] [파일경로3] ...');
  console.log('\n예시:');
  console.log('  npm run test-batch-upload test-data/*.png');
  console.log('  npm run test-batch-upload test-data/file1.pdf test-data/file2.png');
  console.log('\n⚠️  제한 사항:');
  console.log('  - 최대 파일 개수: 5개');
  console.log('  - 파일 크기: 최대 3MB');
  console.log('  - PDF: 최대 5페이지');
  console.log('  - 형식: PDF, JPG, PNG만 지원');
  console.log('\n💡 스마트 스캔 기능:');
  console.log('  - AI가 각 파일을 빠르게 스캔하여 중대성 이슈 목록이 있는지 확인합니다');
  console.log('  - 관련 있는 파일만 상세 분석하여 비용과 시간을 절약합니다');
  console.log('  - 여러 페이지를 올려도 자동으로 필터링됩니다\n');
  process.exit(1);
}

const filePaths = args.map(arg => path.resolve(arg));
testBatchUpload(filePaths)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
