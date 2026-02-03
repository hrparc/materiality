import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @param {number} maxPages - Maximum number of pages to extract (default: 5)
 */
async function extractTextFromPDF(filePath, maxPages = 5) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // Check page limit
    if (pdfData.numpages > maxPages) {
      throw new Error(
        `PDF has ${pdfData.numpages} pages, but maximum allowed is ${maxPages} pages. ` +
        `Please upload only the materiality assessment section (중대성 평가 페이지만 업로드해주세요).`
      );
    }

    return {
      text: pdfData.text,
      pageCount: pdfData.numpages,
      metadata: pdfData.info
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}

/**
 * Extract text from image using Gemini Vision API
 */
async function extractTextFromImage(filePath) {
  try {
    const imageData = await fs.readFile(filePath);
    const base64Image = imageData.toString('base64');

    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const prompt = `이 이미지는 ESG 보고서의 일부입니다. 이미지에서 모든 텍스트를 추출하여 그대로 반환해주세요.
특히 "중대성 평가", "중대 이슈", "Materiality Assessment", "중요 이슈", "핵심 이슈" 등의 섹션에 집중해주세요.
텍스트를 정확하게 추출하여 원본 구조를 유지하면서 반환해주세요.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    return {
      text: text,
      pageCount: 1,
      metadata: { source: 'image_ocr' }
    };
  } catch (error) {
    console.error('Image OCR error:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

/**
 * Quick scan to check if image contains materiality issues list
 * Uses simple keyword detection to save API costs
 */
async function quickScanForMaterialityContent(filePath, fileType) {
  try {
    let text = '';

    // Extract text based on file type
    if (fileType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (fileType.startsWith('image/')) {
      // For images, use basic OCR
      const imageData = await fs.readFile(filePath);
      const base64Image = imageData.toString('base64');
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

      const prompt = `이 이미지에 "중대 이슈", "핵심 이슈", "Material Issues", "중요 이슈" 등의 제목과 함께 이슈 목록(리스트)이 있나요?
이슈 목록이 있으면 "YES", 없으면 "NO"만 답변하세요.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const answer = response.text().trim().toUpperCase();

      return {
        hasMaterialityContent: answer.includes('YES'),
        confidence: answer.includes('YES') ? 'high' : 'low'
      };
    }

    // Check for keywords in text
    const keywords = [
      '중대 이슈',
      '중대성 이슈',
      '핵심 이슈',
      '중요 이슈',
      'material issues',
      'material topics',
      'materiality',
      '이중 중대성'
    ];

    const lowerText = text.toLowerCase();
    const hasKeywords = keywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    // Check for list patterns (numbers, bullets)
    const hasListPattern = /(\d+\.|•|▪|-)[\s\S]{10,100}/g.test(text);

    return {
      hasMaterialityContent: hasKeywords && hasListPattern,
      confidence: hasKeywords && hasListPattern ? 'high' : 'low',
      keywords: keywords.filter(k => lowerText.includes(k.toLowerCase()))
    };

  } catch (error) {
    console.error('Quick scan error:', error);
    // If scan fails, assume content exists to be safe
    return {
      hasMaterialityContent: true,
      confidence: 'unknown',
      error: error.message
    };
  }
}

/**
 * Find materiality assessment section in text
 */
function findMaterialitySection(text) {
  const keywords = [
    '중대성 평가',
    '중대 이슈',
    '중요 이슈',
    '핵심 이슈',
    'materiality assessment',
    'material issues',
    'material topics',
    '이중 중대성',
    'double materiality'
  ];

  const lines = text.split('\n');
  let startIndex = -1;
  let endIndex = lines.length;

  // Find start of materiality section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(keyword => line.includes(keyword.toLowerCase()))) {
      startIndex = Math.max(0, i - 2); // Include 2 lines before for context
      break;
    }
  }

  // If found, extract a reasonable chunk (next 100 lines or until next major section)
  if (startIndex !== -1) {
    const sectionEndKeywords = ['참고문헌', '부록', 'appendix', 'reference'];
    for (let i = startIndex + 10; i < Math.min(lines.length, startIndex + 100); i++) {
      const line = lines[i].toLowerCase();
      if (sectionEndKeywords.some(keyword => line.includes(keyword))) {
        endIndex = i;
        break;
      }
    }

    const section = lines.slice(startIndex, endIndex).join('\n');
    return {
      found: true,
      section: section,
      fullText: text
    };
  }

  // If no specific section found, return the full text
  return {
    found: false,
    section: text.slice(0, 10000), // First 10k chars
    fullText: text
  };
}

/**
 * Extract issues using Gemini AI
 */
async function extractIssuesWithAI(text, materialitySection) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const prompt = `다음은 ESG 보고서에서 추출한 텍스트입니다. 이 보고서에서 언급된 중대 이슈(Material Issues)를 추출해주세요.

텍스트:
${materialitySection}

다음 JSON 형식으로 응답해주세요:
{
  "issues": [
    {
      "issue_name": "이슈 이름 (한국어)",
      "issue_name_en": "Issue name (English, if mentioned)",
      "category": "E" | "S" | "G",
      "description": "이슈에 대한 설명 (보고서에서 언급된 내용)",
      "context": "이슈가 언급된 문맥이나 배경",
      "page_reference": "페이지 번호 또는 위치 정보 (가능한 경우)"
    }
  ],
  "metadata": {
    "total_issues_found": 숫자,
    "materiality_section_found": true/false,
    "extraction_confidence": "high" | "medium" | "low"
  }
}

주의사항:
1. 중대 이슈, 핵심 이슈, 중요 이슈 등으로 명시된 항목들을 우선 추출
2. 각 이슈를 E(환경), S(사회), G(거버넌스) 카테고리로 분류
3. 이슈 이름은 간결하게 (15자 이내)
4. 설명은 보고서의 원문을 기반으로 작성
5. 중복되거나 유사한 이슈는 통합
6. 최소 3개 이상의 이슈를 추출하되, 보고서에 명시되지 않은 이슈는 만들지 말 것

반드시 JSON 형식으로만 응답하세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsedResult = JSON.parse(responseText);

    return parsedResult;

  } catch (error) {
    console.error('AI extraction error:', error);

    // Return a fallback response
    return {
      issues: [],
      metadata: {
        total_issues_found: 0,
        materiality_section_found: false,
        extraction_confidence: 'low',
        error: error.message
      }
    };
  }
}

/**
 * Main function to extract issues from a report file
 * @param {string} filePath - Path to the report file
 * @param {string} fileType - MIME type of the file
 * @param {number} maxPages - Maximum pages for PDF (default: 5)
 */
async function extractIssues(filePath, fileType, maxPages = 5) {
  try {
    let extractedData;

    // Step 1: Extract text based on file type
    if (fileType === 'application/pdf') {
      console.log(`Extracting text from PDF (max ${maxPages} pages)...`);
      extractedData = await extractTextFromPDF(filePath, maxPages);
    } else if (fileType.startsWith('image/')) {
      console.log('Extracting text from image using OCR...');
      extractedData = await extractTextFromImage(filePath);
    } else {
      throw new Error('Unsupported file type');
    }

    console.log(`Extracted ${extractedData.text.length} characters from file`);

    // Step 2: Find materiality assessment section
    console.log('Finding materiality assessment section...');
    const { found, section, fullText } = findMaterialitySection(extractedData.text);
    console.log(`Materiality section found: ${found}`);

    // Step 3: Extract issues using AI
    console.log('Extracting issues with AI...');
    const aiResult = await extractIssuesWithAI(fullText, section);

    // Step 4: Format and return results
    return {
      issues: aiResult.issues || [],
      metadata: {
        ...aiResult.metadata,
        materiality_section_found: found,
        pageCount: extractedData.pageCount,
        textLength: extractedData.text.length,
        fileType: fileType
      }
    };

  } catch (error) {
    console.error('Extract issues error:', error);
    throw error;
  }
}

export {
  extractIssues,
  extractTextFromPDF,
  extractTextFromImage,
  quickScanForMaterialityContent,
  findMaterialitySection,
  extractIssuesWithAI
};
