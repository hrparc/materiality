import { generateEmbedding } from '../config/gemini.js';
import { NAMESPACES } from '../config/pinecone.js';

/**
 * RAG 서비스 클래스
 * 벡터 DB에 문서를 저장하고 검색하는 기능 제공
 */
export class RAGService {
  constructor(pinecone, genAI, indexName) {
    this.pinecone = pinecone;
    this.genAI = genAI;
    this.index = pinecone.index(indexName);
  }

  /**
   * 문서 청크들을 벡터 DB에 업로드
   * @param {Array<Object>} chunks - 청크 배열 (chunkPDFWithMetadata 결과)
   * @param {string} namespace - 네임스페이스 (gri-en, sasb-kr 등)
   * @param {number} batchSize - 배치 크기 (기본: 100)
   */
  async uploadChunks(chunks, namespace, batchSize = 100) {
    console.log(`\n📤 벡터 DB 업로드 시작: ${namespace}`);
    console.log(`   - 총 청크 수: ${chunks.length}`);

    const vectors = [];

    // 각 청크에 대해 임베딩 생성
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Gemini로 임베딩 생성
        const embedding = await generateEmbedding(this.genAI, chunk.text);

        vectors.push({
          id: chunk.id,
          values: embedding,
          metadata: {
            text: chunk.text,
            ...chunk.metadata,
          },
        });

        if ((i + 1) % 10 === 0) {
          console.log(`   진행 중: ${i + 1}/${chunks.length} 청크 처리됨`);
        }

        // 배치 단위로 업로드
        if (vectors.length >= batchSize) {
          await this.index.namespace(namespace).upsert(vectors);
          console.log(`   ✅ ${vectors.length}개 벡터 업로드 완료`);
          vectors.length = 0; // 배열 초기화
        }

        // API 요청 제한 고려 (약간의 지연)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ 청크 ${i} 처리 실패:`, error.message);
        // 실패한 청크는 건너뛰고 계속 진행
        continue;
      }
    }

    // 남은 벡터 업로드
    if (vectors.length > 0) {
      await this.index.namespace(namespace).upsert(vectors);
      console.log(`   ✅ 마지막 ${vectors.length}개 벡터 업로드 완료`);
    }

    console.log(`✅ 네임스페이스 "${namespace}" 업로드 완료\n`);
  }

  /**
   * 산업군 기반 이슈 검색 (1단계: 이슈풀 구축용)
   * @param {string} industryKeyword - 산업군 키워드 (예: "의료장비", "석유 및 가스")
   * @param {number} topK - 반환할 결과 수 (기본: 10)
   * @returns {Promise<Array>} 검색 결과 배열
   */
  async searchByIndustry(industryKeyword, topK = 10) {
    console.log(`\n🔍 산업군 기반 검색: "${industryKeyword}"`);

    try {
      // 검색 쿼리 임베딩 생성
      const queryEmbedding = await generateEmbedding(this.genAI, industryKeyword);

      // GRI와 SASB에서 검색 (병렬 처리)
      const [griResults, sasbResults] = await Promise.all([
        this.index.namespace(NAMESPACES.GRI_EN).query({
          vector: queryEmbedding,
          topK: Math.floor(topK / 2),
          includeMetadata: true,
        }),
        this.index.namespace(NAMESPACES.SASB_KR).query({
          vector: queryEmbedding,
          topK: Math.floor(topK / 2),
          includeMetadata: true,
        }),
      ]);

      const allResults = [
        ...griResults.matches.map(m => ({
          ...m,
          source: 'GRI',
          namespace: NAMESPACES.GRI_EN,
        })),
        ...sasbResults.matches.map(m => ({
          ...m,
          source: 'SASB',
          namespace: NAMESPACES.SASB_KR,
        })),
      ];

      // 유사도 점수로 정렬
      allResults.sort((a, b) => b.score - a.score);

      console.log(`✅ ${allResults.length}개 결과 반환`);
      return allResults.slice(0, topK);

    } catch (error) {
      console.error('❌ 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 이슈에 대한 표준 문서 매칭 (3단계: 점수 산출용)
   * @param {string} issueName - 이슈 이름 (예: "온실가스 배출")
   * @param {Array<string>} namespaces - 검색할 네임스페이스 배열
   * @param {number} topK - 반환할 결과 수
   * @returns {Promise<Object>} 표준별 검색 결과
   */
  async matchIssueToStandards(issueName, namespaces = null, topK = 5) {
    console.log(`\n🔍 이슈 매칭 검색: "${issueName}"`);

    const searchNamespaces = namespaces || [
      NAMESPACES.GRI_EN,
      NAMESPACES.SASB_KR,
      NAMESPACES.ISSB_KR,
      NAMESPACES.KSSB_KR,
    ];

    try {
      const queryEmbedding = await generateEmbedding(this.genAI, issueName);

      // 모든 네임스페이스에서 병렬 검색
      const searchPromises = searchNamespaces.map(ns =>
        this.index.namespace(ns).query({
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true,
        })
      );

      const results = await Promise.all(searchPromises);

      const matchedStandards = {};
      searchNamespaces.forEach((ns, index) => {
        matchedStandards[ns] = results[index].matches;
      });

      console.log(`✅ 표준 매칭 완료`);
      return matchedStandards;

    } catch (error) {
      console.error('❌ 이슈 매칭 실패:', error);
      throw error;
    }
  }

  /**
   * 네임스페이스 통계 확인
   * @param {string} namespace - 네임스페이스 이름
   */
  async getNamespaceStats(namespace) {
    try {
      const stats = await this.index.describeIndexStats();
      const nsStats = stats.namespaces?.[namespace];

      if (nsStats) {
        console.log(`\n📊 네임스페이스 "${namespace}" 통계:`);
        console.log(`   - 벡터 수: ${nsStats.recordCount || nsStats.vectorCount || 0}`);
      } else {
        console.log(`\n⚠️  네임스페이스 "${namespace}"가 비어있거나 존재하지 않습니다.`);
      }

      return nsStats;
    } catch (error) {
      console.error('❌ 통계 조회 실패:', error);
      throw error;
    }
  }
}
