import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Gemini AI 클라이언트 초기화
 */
export const initGemini = () => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI 클라이언트 초기화 완료');
    return genAI;
  } catch (error) {
    console.error('❌ Gemini 초기화 실패:', error);
    throw error;
  }
};

/**
 * Gemini 모델 가져오기
 * - flash: 가벼운 작업용 (Gemini 2.5 Flash-Lite)
 * - pro: 사고가 필요한 복잡한 작업용 (Gemini 2.5 Pro)
 */
export const getGeminiModel = (genAI, modelType = 'flash') => {
  const modelName = modelType === 'pro'
    ? 'gemini-2.5-pro'  // Pro 모델 (사고 작업)
    : 'gemini-2.5-flash-lite';  // Flash-Lite 모델 (가벼운 작업)

  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * 텍스트 임베딩 생성
 * @param {GoogleGenerativeAI} genAI - Gemini 클라이언트
 * @param {string} text - 임베딩할 텍스트
 * @returns {Promise<number[]>} 임베딩 벡터
 */
export const generateEmbedding = async (genAI, text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('❌ 임베딩 생성 실패:', error);
    throw error;
  }
};
