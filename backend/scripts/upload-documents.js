import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initPinecone, NAMESPACES } from '../src/config/pinecone.js';
import { initGemini } from '../src/config/gemini.js';
import { parsePDF, chunkPDFWithMetadata } from '../src/utils/pdf-parser.js';
import { RAGService } from '../src/services/rag-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트 디렉토리
const ROOT_DIR = path.join(__dirname, '../..');

/**
 * 디렉토리 내의 모든 PDF 파일 가져오기
 */
const getPDFFiles = (dirPath) => {
  const files = fs.readdirSync(dirPath);
  return files
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(dirPath, file));
};

/**
 * GRI 문서 처리 및 업로드
 */
const processGRI = async (ragService) => {
  console.log('\n' + '='.repeat(60));
  console.log('📚 GRI 문서 처리 시작 (영문)');
  console.log('='.repeat(60));

  const griDir = path.join(ROOT_DIR, 'standards', 'GRI');
  const pdfFiles = getPDFFiles(griDir);

  console.log(`찾은 PDF 파일: ${pdfFiles.length}개`);

  for (const pdfFile of pdfFiles) {
    try {
      console.log(`\n처리 중: ${path.basename(pdfFile)}`);

      // PDF 파싱
      const pdfData = await parsePDF(pdfFile);

      // 청킹 (500자 단위)
      const chunks = chunkPDFWithMetadata(pdfData, 500);

      // Pinecone에 업로드
      await ragService.uploadChunks(chunks, NAMESPACES.GRI_EN);

    } catch (error) {
      console.error(`❌ 파일 처리 실패: ${path.basename(pdfFile)}`, error.message);
      continue;
    }
  }

  console.log('\n✅ GRI 문서 처리 완료');
};

/**
 * SASB 문서 처리 및 업로드
 */
const processSASB = async (ragService) => {
  console.log('\n' + '='.repeat(60));
  console.log('📚 SASB 문서 처리 시작 (한국어)');
  console.log('='.repeat(60));

  const sasbDir = path.join(ROOT_DIR, 'standards', 'SASB');
  const pdfFiles = getPDFFiles(sasbDir);

  console.log(`찾은 PDF 파일: ${pdfFiles.length}개`);

  for (const pdfFile of pdfFiles) {
    try {
      console.log(`\n처리 중: ${path.basename(pdfFile)}`);

      const pdfData = await parsePDF(pdfFile);
      const chunks = chunkPDFWithMetadata(pdfData, 500);

      await ragService.uploadChunks(chunks, NAMESPACES.SASB_KR);

    } catch (error) {
      console.error(`❌ 파일 처리 실패: ${path.basename(pdfFile)}`, error.message);
      continue;
    }
  }

  console.log('\n✅ SASB 문서 처리 완료');
};

/**
 * ISSB 문서 처리 및 업로드
 */
const processISSB = async (ragService) => {
  console.log('\n' + '='.repeat(60));
  console.log('📚 ISSB 문서 처리 시작 (한국어)');
  console.log('='.repeat(60));

  const issbDir = path.join(ROOT_DIR, 'standards', 'ISSB');
  const pdfFiles = getPDFFiles(issbDir);

  console.log(`찾은 PDF 파일: ${pdfFiles.length}개`);

  for (const pdfFile of pdfFiles) {
    try {
      console.log(`\n처리 중: ${path.basename(pdfFile)}`);

      const pdfData = await parsePDF(pdfFile);
      const chunks = chunkPDFWithMetadata(pdfData, 500);

      await ragService.uploadChunks(chunks, NAMESPACES.ISSB_KR);

    } catch (error) {
      console.error(`❌ 파일 처리 실패: ${path.basename(pdfFile)}`, error.message);
      continue;
    }
  }

  console.log('\n✅ ISSB 문서 처리 완료');
};

/**
 * KSSB 문서 처리 및 업로드
 */
const processKSSB = async (ragService) => {
  console.log('\n' + '='.repeat(60));
  console.log('📚 KSSB 문서 처리 시작 (한국어)');
  console.log('='.repeat(60));

  const kssbDir = path.join(ROOT_DIR, 'standards', 'KSSB');
  const pdfFiles = getPDFFiles(kssbDir);

  console.log(`찾은 PDF 파일: ${pdfFiles.length}개`);

  for (const pdfFile of pdfFiles) {
    try {
      console.log(`\n처리 중: ${path.basename(pdfFile)}`);

      const pdfData = await parsePDF(pdfFile);
      const chunks = chunkPDFWithMetadata(pdfData, 500);

      await ragService.uploadChunks(chunks, NAMESPACES.KSSB_KR);

    } catch (error) {
      console.error(`❌ 파일 처리 실패: ${path.basename(pdfFile)}`, error.message);
      continue;
    }
  }

  console.log('\n✅ KSSB 문서 처리 완료');
};

/**
 * 메인 실행 함수
 */
const main = async () => {
  console.log('\n' + '█'.repeat(60));
  console.log('🚀 ESG 표준 문서 벡터화 및 업로드 시작');
  console.log('█'.repeat(60));

  try {
    // Pinecone 및 Gemini 초기화
    const pinecone = await initPinecone();
    const genAI = initGemini();

    const indexName = process.env.PINECONE_INDEX_NAME || 'esg-standards';
    const ragService = new RAGService(pinecone, genAI, indexName);

    // 처리할 표준 선택 (커맨드 라인 인자로 제어)
    const args = process.argv.slice(2);
    const processAll = args.length === 0 || args.includes('all');

    if (processAll || args.includes('gri')) {
      await processGRI(ragService);
    }

    if (processAll || args.includes('sasb')) {
      await processSASB(ragService);
    }

    if (processAll || args.includes('issb')) {
      await processISSB(ragService);
    }

    if (processAll || args.includes('kssb')) {
      await processKSSB(ragService);
    }

    // 최종 통계 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 통계');
    console.log('='.repeat(60));

    for (const namespace of Object.values(NAMESPACES)) {
      await ragService.getNamespaceStats(namespace);
    }

    console.log('\n' + '█'.repeat(60));
    console.log('✅ 모든 문서 업로드 완료!');
    console.log('█'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  }
};

// 스크립트 실행
main();
