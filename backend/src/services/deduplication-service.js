import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 뉴스 기사 중복 제거 서비스
 * Embedding 기반 의미론적 유사도 분석으로 중복 기사 탐지
 */
export class DeduplicationService {
  constructor(genAI) {
    this.genAI = genAI;

    // 설정값
    this.SIMILARITY_THRESHOLD = 0.85; // 코사인 유사도 임계값
    this.TIME_WINDOW_DAYS = 2; // 시간 윈도우 (일)
    this.BATCH_SIZE = 100; // 배치 처리 크기
  }

  /**
   * 뉴스 기사 중복 제거 (메인 함수)
   * @param {Array} articles - 뉴스 기사 배열
   * @returns {Promise<Array>} 중복 제거된 기사 배열 (대표 기사 + duplicate_count)
   */
  async deduplicateArticles(articles) {
    console.log(`\n🔄 중복 제거 시작: ${articles.length}개 기사`);

    if (!articles || articles.length === 0) {
      return [];
    }

    // Gemini API 확인
    if (!this.genAI) {
      console.warn('⚠️  Gemini API가 설정되지 않았습니다. 중복 제거를 건너뜁니다.');
      return articles.map(article => ({
        ...article,
        duplicate_count: 1,
        cluster_id: null,
      }));
    }

    try {
      // 1단계: Embedding 생성 (배치 처리)
      const articlesWithEmbeddings = await this.generateEmbeddings(articles);

      // 2단계: 시간 기반 사전 필터링
      const timeFilteredGroups = this.groupByTimeWindow(articlesWithEmbeddings);

      // 3단계: 유사도 기반 클러스터링
      const clusters = this.clusterSimilarArticles(timeFilteredGroups);

      // 4단계: 대표 기사 선정 및 결과 포맷팅
      const deduplicated = this.selectRepresentatives(clusters, articles);

      console.log(`✅ 중복 제거 완료: ${articles.length}개 → ${deduplicated.length}개 (${((1 - deduplicated.length / articles.length) * 100).toFixed(1)}% 감소)`);

      return deduplicated;

    } catch (error) {
      console.error('❌ 중복 제거 실패:', error.message);
      // 실패 시 원본 반환 (duplicate_count = 1)
      return articles.map(article => ({
        ...article,
        duplicate_count: 1,
        cluster_id: null,
      }));
    }
  }

  /**
   * Embedding 생성 (배치 처리)
   * @private
   */
  async generateEmbeddings(articles) {
    console.log(`   📊 Embedding 생성 중... (배치 크기: ${this.BATCH_SIZE})`);

    const articlesWithEmbeddings = [];
    const embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // 배치 처리
    for (let i = 0; i < articles.length; i += this.BATCH_SIZE) {
      const batch = articles.slice(i, i + this.BATCH_SIZE);

      try {
        // 제목 + 요약을 하나의 텍스트로 결합
        const texts = batch.map(article =>
          `${article.title}\n${article.snippet || ''}`
        );

        // Gemini Embedding API 호출 (배치 처리)
        const embeddingResults = await Promise.all(
          texts.map(text =>
            embeddingModel.embedContent(text).catch(err => {
              console.error('      ⚠️  개별 embedding 실패:', err.message);
              return null;
            })
          )
        );

        // 결과 병합
        batch.forEach((article, index) => {
          const embeddingResult = embeddingResults[index];
          articlesWithEmbeddings.push({
            ...article,
            embedding: embeddingResult?.embedding?.values || null,
          });
        });

        console.log(`      ✓ 배치 ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(articles.length / this.BATCH_SIZE)} 완료`);

        // Rate limiting 방지
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`      ⚠️  배치 ${Math.floor(i / this.BATCH_SIZE) + 1} 실패:`, error.message);

        // 실패한 배치는 null embedding으로 처리
        batch.forEach(article => {
          articlesWithEmbeddings.push({
            ...article,
            embedding: null,
          });
        });
      }
    }

    return articlesWithEmbeddings;
  }

  /**
   * 시간 윈도우 기반 사전 필터링
   * @private
   */
  groupByTimeWindow(articles) {
    console.log(`   ⏱️  시간 윈도우 기반 그룹화 (${this.TIME_WINDOW_DAYS}일 이내)`);

    // 날짜별로 정렬
    const sorted = articles
      .filter(article => article.embedding !== null) // embedding 실패한 것 제외
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    const groups = [];
    let currentGroup = [];

    for (const article of sorted) {
      if (currentGroup.length === 0) {
        currentGroup.push(article);
        continue;
      }

      // 현재 그룹의 첫 번째 기사와 시간 차이 계산
      const firstDate = new Date(currentGroup[0].publishDate);
      const articleDate = new Date(article.publishDate);
      const daysDiff = (firstDate - articleDate) / (1000 * 60 * 60 * 24);

      if (daysDiff <= this.TIME_WINDOW_DAYS) {
        currentGroup.push(article);
      } else {
        // 새로운 그룹 시작
        groups.push(currentGroup);
        currentGroup = [article];
      }
    }

    // 마지막 그룹 추가
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    console.log(`      → ${groups.length}개 시간 그룹 생성`);
    return groups;
  }

  /**
   * 유사도 기반 클러스터링
   * @private
   */
  clusterSimilarArticles(timeGroups) {
    console.log(`   🔗 유사도 기반 클러스터링 (임계값: ${this.SIMILARITY_THRESHOLD})`);

    const allClusters = [];
    let clusterIdCounter = 0;

    for (const group of timeGroups) {
      const clusters = [];
      const processed = new Set();

      for (let i = 0; i < group.length; i++) {
        if (processed.has(i)) continue;

        const cluster = [i];
        processed.add(i);

        // 나머지 기사들과 유사도 비교
        for (let j = i + 1; j < group.length; j++) {
          if (processed.has(j)) continue;

          const similarity = this.cosineSimilarity(
            group[i].embedding,
            group[j].embedding
          );

          if (similarity >= this.SIMILARITY_THRESHOLD) {
            cluster.push(j);
            processed.add(j);
          }
        }

        // 클러스터에 실제 기사 데이터와 ID 추가
        clusters.push({
          id: clusterIdCounter++,
          articles: cluster.map(idx => group[idx]),
          size: cluster.length,
        });
      }

      allClusters.push(...clusters);
    }

    const duplicateCount = allClusters.reduce((sum, c) => sum + c.size, 0) - allClusters.length;
    console.log(`      → ${allClusters.length}개 클러스터 생성 (${duplicateCount}개 중복 발견)`);

    return allClusters;
  }

  /**
   * 대표 기사 선정
   * @private
   */
  selectRepresentatives(clusters, originalArticles) {
    console.log(`   🏆 대표 기사 선정 중...`);

    const representatives = [];

    for (const cluster of clusters) {
      // 대표 기사 선정 기준:
      // 1. 가장 최근 기사
      // 2. 제목이 가장 긴 기사 (정보량이 많을 가능성)

      const sortedArticles = cluster.articles.sort((a, b) => {
        const dateA = new Date(a.publishDate);
        const dateB = new Date(b.publishDate);

        // 날짜 차이가 1일 이내면 제목 길이로 비교
        if (Math.abs(dateB - dateA) < 1000 * 60 * 60 * 24) {
          return b.title.length - a.title.length;
        }

        // 그 외에는 최신순
        return dateB - dateA;
      });

      const representative = sortedArticles[0];

      // Embedding 제거 (응답 크기 감소)
      const { embedding, ...articleWithoutEmbedding } = representative;

      representatives.push({
        ...articleWithoutEmbedding,
        duplicate_count: cluster.size,
        cluster_id: cluster.id,
        cluster_dates: {
          earliest: new Date(Math.min(...cluster.articles.map(a => new Date(a.publishDate)))).toISOString(),
          latest: new Date(Math.max(...cluster.articles.map(a => new Date(a.publishDate)))).toISOString(),
        },
      });
    }

    // Embedding이 없었던 원본 기사들도 추가
    const processedTitles = new Set(
      clusters.flatMap(c => c.articles.map(a => a.title))
    );

    originalArticles.forEach(article => {
      if (!processedTitles.has(article.title)) {
        representatives.push({
          ...article,
          duplicate_count: 1,
          cluster_id: null,
        });
      }
    });

    return representatives;
  }

  /**
   * 코사인 유사도 계산
   * @private
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
