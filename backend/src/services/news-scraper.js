import { getGeminiModel } from '../config/gemini.js';

/**
 * 뉴스 스크래핑 및 분석 서비스
 * Google Search API를 사용하여 뉴스를 수집하고 Gemini로 분석
 */
export class NewsScraper {
  constructor(genAI) {
    this.genAI = genAI;
    this.flashModel = getGeminiModel(genAI, 'flash');
  }

  /**
   * 키워드 기반 뉴스 검색
   * @param {string} keyword - 검색 키워드 (예: "삼성전자 ESG")
   * @param {number} maxResults - 최대 결과 수 (기본: 50)
   * @returns {Promise<Array>} 뉴스 기사 배열
   */
  async searchNews(keyword, maxResults = 50) {
    console.log(`\n🔍 뉴스 검색: "${keyword}"`);

    try {
      // 실제 Google Custom Search API 사용
      const news = await this.searchNewsWithGoogle(keyword, maxResults);

      console.log(`✅ ${news.length}개 뉴스 기사 수집 완료`);
      return news;

    } catch (error) {
      console.error('❌ 뉴스 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 실제 Google Custom Search API 호출
   * @param {string} keyword - 검색 키워드
   * @param {number} maxResults - 최대 결과 수
   */
  async searchNewsWithGoogle(keyword, maxResults = 50) {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.warn('⚠️  Google Search API 키가 설정되지 않았습니다. Mock 데이터를 사용합니다.');
      return this.generateMockNews(keyword, maxResults);
    }

    const results = [];
    const queries = Math.ceil(maxResults / 10); // Google은 한 번에 10개까지

    for (let i = 0; i < queries; i++) {
      const startIndex = i * 10 + 1;
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(keyword)}&dateRestrict=y1&start=${startIndex}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        // 디버깅: API 응답 확인
        if (data.error) {
          console.error(`❌ API 에러 (페이지 ${i + 1}):`, data.error.message);
          break;
        }

        if (data.items) {
          console.log(`   ✓ 페이지 ${i + 1}: ${data.items.length}개 결과 발견`);
          results.push(...data.items.map(item => ({
            title: item.title,
            snippet: item.snippet,
            link: item.link,
            publishDate: item.pagemap?.metatags?.[0]?.['article:published_time'] || new Date().toISOString(),
          })));
        } else {
          console.log(`   ⚠️  페이지 ${i + 1}: 결과 없음`);
        }

        // API 요청 제한 고려
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ 뉴스 검색 API 호출 실패 (페이지 ${i + 1}):`, error.message);
        break;
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * Gemini로 뉴스 분석 및 ESG 이슈 분류
   * @param {Array} newsArticles - 뉴스 기사 배열
   * @returns {Promise<Array>} 분석된 뉴스 배열
   */
  async analyzeNews(newsArticles) {
    console.log(`\n🤖 Gemini로 ${newsArticles.length}개 뉴스 분석 시작`);

    const analyzedNews = [];

    for (let i = 0; i < newsArticles.length; i++) {
      const article = newsArticles[i];

      try {
        const analysis = await this.analyzeArticle(article);
        analyzedNews.push({
          ...article,
          analysis,
        });

        if ((i + 1) % 10 === 0) {
          console.log(`   진행 중: ${i + 1}/${newsArticles.length} 기사 분석 완료`);
        }

        // API 요청 제한 고려
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ⚠️  기사 분석 실패 (${i + 1}):`, error.message);
        analyzedNews.push({
          ...article,
          analysis: null,
        });
      }
    }

    console.log(`✅ ${analyzedNews.length}개 뉴스 분석 완료\n`);
    return analyzedNews;
  }

  /**
   * 단일 뉴스 기사 분석
   * @private
   */
  async analyzeArticle(article) {
    const prompt = `
다음 뉴스 기사를 분석하여 ESG 이슈와의 관련성을 평가해주세요.

제목: ${article.title}
내용: ${article.snippet}

다음 형식으로 JSON 응답해주세요:
{
  "isESGRelated": true/false,
  "esgCategories": ["E", "S", "G"] 중 해당되는 것들,
  "issues": ["구체적인 이슈명들"],
  "sentiment": "positive/negative/neutral",
  "relevanceScore": 1-5 (1: 매우 낮음, 5: 매우 높음)
}
`;

    const result = await this.flashModel.generateContent(prompt);
    const response = result.response.text();

    // JSON 파싱
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('   ⚠️  JSON 파싱 실패:', error.message);
    }

    return null;
  }

  /**
   * PRD 5.4항 기준에 따른 미디어 점수 계산
   * @param {Array} analyzedNews - 분석된 뉴스 배열
   * @param {Object} issueKeywords - 이슈별 키워드 맵
   * @returns {Object} 이슈별 미디어 점수 (1~5점)
   */
  calculateMediaScores(analyzedNews, issueKeywords) {
    console.log('\n📊 미디어 점수 계산 중...');

    const issueScores = {};

    for (const [issueName, keywords] of Object.entries(issueKeywords)) {
      // 해당 이슈와 관련된 뉴스 필터링
      const relatedNews = analyzedNews.filter(news => {
        if (!news.analysis || !news.analysis.isESGRelated) return false;

        const titleLower = news.title.toLowerCase();
        const snippetLower = news.snippet.toLowerCase();

        return keywords.some(keyword =>
          titleLower.includes(keyword.toLowerCase()) ||
          snippetLower.includes(keyword.toLowerCase())
        );
      });

      const totalNews = analyzedNews.length;
      const relatedCount = relatedNews.length;
      const exposureRate = totalNews > 0 ? (relatedCount / totalNews) * 100 : 0;

      // 부정적 뉴스 비율 계산
      const negativeCount = relatedNews.filter(
        news => news.analysis?.sentiment === 'negative'
      ).length;
      const negativeRate = relatedCount > 0 ? (negativeCount / relatedCount) * 100 : 0;

      // PRD 5.4항 기준에 따른 점수 계산
      let score = 1;

      if (exposureRate >= 10 && negativeRate >= 70) {
        score = 5; // 최고점: 노출 빈도 상위 10% 이내 및 부정적 맥락 70% 이상
      } else if (exposureRate >= 10 && exposureRate <= 50) {
        score = 3; // 중간점: 노출 빈도 10%~50% 범위
      } else if (exposureRate < 10) {
        score = 1; // 최저점: 노출 빈도 하위
      }

      issueScores[issueName] = {
        score,
        exposureRate: exposureRate.toFixed(2),
        relatedNewsCount: relatedCount,
        negativeRate: negativeRate.toFixed(2),
        details: {
          totalNews,
          relatedNews: relatedCount,
          negativeNews: negativeCount,
        },
      };
    }

    console.log(`✅ ${Object.keys(issueScores).length}개 이슈 점수 계산 완료\n`);
    return issueScores;
  }

  /**
   * Mock 뉴스 데이터 생성 (테스트용)
   * @private
   */
  generateMockNews(keyword, count) {
    const mockNews = [];
    const esgTopics = [
      '온실가스 배출 감축',
      '재생에너지 전환',
      '산업안전보건',
      '근로자 인권',
      '공급망 관리',
      '데이터 프라이버시',
      '이사회 다양성',
      '윤리경영',
    ];

    for (let i = 0; i < count; i++) {
      const topic = esgTopics[i % esgTopics.length];
      const sentiment = Math.random() > 0.5 ? 'positive' : 'negative';

      mockNews.push({
        title: `${keyword} ${topic} 관련 ${sentiment === 'positive' ? '개선' : '논란'} (${i + 1})`,
        snippet: `${keyword}가 ${topic}과 관련하여 ${sentiment === 'positive' ? '긍정적인 성과를 달성' : '부정적인 이슈가 제기'}되었습니다. 최근 1년간의 데이터를 분석한 결과...`,
        link: `https://news.example.com/article-${i + 1}`,
        publishDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return mockNews;
  }
}
