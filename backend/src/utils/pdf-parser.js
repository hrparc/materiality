import fs from 'fs';
import pdf from 'pdf-parse';
import crypto from 'crypto';

/**
 * PDF 파일을 읽어서 텍스트로 변환
 * @param {string} filePath - PDF 파일 경로
 * @returns {Promise<Object>} PDF 내용 (텍스트, 페이지 수 등)
 */
export const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    console.log(`📄 PDF 파싱 완료: ${filePath}`);
    console.log(`   - 페이지 수: ${data.numpages}`);
    console.log(`   - 텍스트 길이: ${data.text.length}자`);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      filePath: filePath,
    };
  } catch (error) {
    console.error(`❌ PDF 파싱 실패 (${filePath}):`, error.message);
    throw error;
  }
};

/**
 * 텍스트를 청크(chunk)로 분할
 * PRD 요구사항: 조항 단위 또는 500자 내외로 분할
 *
 * @param {string} text - 분할할 텍스트
 * @param {number} chunkSize - 청크 크기 (기본: 500자)
 * @param {number} overlap - 청크 간 겹침 크기 (기본: 50자)
 * @returns {Array<Object>} 청크 배열
 */
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // 마지막 청크가 아니면, 문장 경계에서 자르기
    if (endIndex < text.length) {
      // 마침표, 줄바꿈 등에서 끊기
      const periodIndex = text.lastIndexOf('.', endIndex);
      const newlineIndex = text.lastIndexOf('\n', endIndex);
      const cutIndex = Math.max(periodIndex, newlineIndex);

      if (cutIndex > startIndex) {
        endIndex = cutIndex + 1;
      }
    }

    const chunkText = text.slice(startIndex, endIndex).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        startIndex: startIndex,
        endIndex: endIndex,
      });
    }

    // 다음 청크 시작 위치 (겹침 고려)
    startIndex = endIndex - overlap;
  }

  console.log(`✂️  텍스트 청킹 완료: ${chunks.length}개 청크 생성`);
  return chunks;
};

/**
 * 특정 섹션이나 키워드를 포함하는 텍스트만 추출
 * GRI의 경우 "Section 2. Likely material topics" 우선 추출
 *
 * @param {string} text - 전체 텍스트
 * @param {Array<string>} keywords - 찾을 키워드 배열
 * @returns {string} 필터링된 텍스트
 */
export const extractRelevantSections = (text, keywords = []) => {
  if (keywords.length === 0) {
    return text;
  }

  const lines = text.split('\n');
  const relevantLines = [];
  let isRelevantSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 키워드를 포함하는 섹션 시작
    for (const keyword of keywords) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        isRelevantSection = true;
        break;
      }
    }

    if (isRelevantSection) {
      relevantLines.push(line);

      // 다음 섹션이 시작되면 종료 (단순화된 로직)
      if (line.match(/^Section \d+/i) && relevantLines.length > 10) {
        isRelevantSection = false;
      }
    }
  }

  return relevantLines.length > 0 ? relevantLines.join('\n') : text;
};

/**
 * PDF에서 페이지 번호 정보와 함께 청크 생성
 * 추적성(Traceability)을 위해 원본 위치 정보 포함
 *
 * @param {Object} pdfData - parsePDF 결과
 * @param {number} chunkSize - 청크 크기
 * @returns {Array<Object>} 메타데이터 포함 청크 배열
 */
export const chunkPDFWithMetadata = (pdfData, chunkSize = 500) => {
  const chunks = chunkText(pdfData.text, chunkSize);

  // 파일명에서 ASCII만 추출하여 ID로 사용 (한글 제거)
  const fileName = pdfData.filePath.split('/').pop();
  const fileHash = crypto.createHash('md5').update(pdfData.filePath).digest('hex').substring(0, 8);

  return chunks.map((chunk, index) => ({
    id: `doc-${fileHash}-chunk-${index}`,
    text: chunk.text,
    metadata: {
      source: pdfData.filePath,
      fileName: fileName,
      chunkIndex: index,
      totalChunks: chunks.length,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      // 페이지 번호는 대략적으로 추정 (정확한 페이지는 pdf-parse로는 어려움)
      estimatedPage: Math.floor((chunk.startIndex / pdfData.text.length) * pdfData.numPages) + 1,
    },
  }));
};
