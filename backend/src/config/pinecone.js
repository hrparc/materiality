import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Pinecone 클라이언트 초기화
 */
export const initPinecone = async () => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    console.log('✅ Pinecone 클라이언트 초기화 완료');
    return pinecone;
  } catch (error) {
    console.error('❌ Pinecone 초기화 실패:', error);
    throw error;
  }
};

/**
 * Pinecone 인덱스 가져오기
 * @param {Pinecone} pinecone - Pinecone 클라이언트 인스턴스
 * @param {string} indexName - 인덱스 이름
 */
export const getIndex = async (pinecone, indexName) => {
  try {
    const index = pinecone.index(indexName);
    console.log(`✅ 인덱스 "${indexName}" 연결 완료`);
    return index;
  } catch (error) {
    console.error(`❌ 인덱스 "${indexName}" 연결 실패:`, error);
    throw error;
  }
};

/**
 * 네임스페이스별 데이터 저장
 * PRD 요구사항에 따라 표준별/언어별 격리:
 * - gri-en: GRI 영문 원본
 * - sasb-kr: SASB 한국어 번역본
 * - issb-kr: ISSB 한국어 번역본
 * - kssb-kr: KSSB 한국어 공시 표준
 */
export const NAMESPACES = {
  GRI_EN: 'gri-en',
  SASB_KR: 'sasb-kr',
  ISSB_KR: 'issb-kr',
  KSSB_KR: 'kssb-kr',
};
