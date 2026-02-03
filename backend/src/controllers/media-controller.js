import { NewsScraper } from '../services/news-scraper.js';
import { initGemini } from '../config/gemini.js';

/**
 * 미디어 분석 관련 API 컨트롤러
 * 1단계(이슈풀 구축) - 미디어 분석 기능
 */

/**
 * 키워드 기반 뉴스 분석
 * POST /api/media/analyze or POST /api/media/analyze-news
 */
export const analyzeNews = async (req, res) => {
  try {
    const { keyword, maxResults = 50, analyzeWithAI = true, period = 'y1' } = req.body;

    // 입력 검증
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '키워드(keyword) 정보가 필요합니다.',
        example: {
          keyword: '삼성전자',
          period: 'y1',
          maxResults: 50
        }
      });
    }

    // period 유효성 검사
    const validPeriods = ['y1', 'm6', 'm3', 'm1'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `유효하지 않은 기간입니다. 사용 가능한 값: ${validPeriods.join(', ')}`,
      });
    }

    console.log(`\n📰 뉴스 분석 요청: "${keyword}" (기간: ${period}, 최대: ${maxResults}개)`);

    // NewsScraper 초기화
    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);

    // 뉴스 검색 (기간 포함)
    let newsArticles;
    try {
      newsArticles = await scraper.searchNews(keyword, maxResults, period);
    } catch (searchError) {
      console.error('❌ 뉴스 검색 실패:', searchError);
      return res.status(500).json({
        success: false,
        error: 'Search Failed',
        message: `뉴스 검색에 실패했습니다: ${searchError.message}`,
        details: searchError.toString(),
      });
    }

    if (!newsArticles || newsArticles.length === 0) {
      return res.json({
        success: true,
        keyword,
        period,
        stats: {
          totalNews: 0,
          esgRelatedNews: 0,
          byCategory: { E: 0, S: 0, G: 0 },
          bySentiment: { positive: 0, negative: 0, neutral: 0 },
        },
        news: [],
        message: '검색 결과가 없습니다. 키워드를 변경해보세요.',
        timestamp: new Date().toISOString(),
      });
    }

    // AI 분석 (옵션)
    let analyzedNews = newsArticles;
    if (analyzeWithAI) {
      try {
        analyzedNews = await scraper.analyzeNews(newsArticles);
      } catch (analysisError) {
        console.error('⚠️  AI 분석 실패, 원본 데이터 반환:', analysisError.message);
        // AI 분석 실패 시에도 검색 결과는 반환
        analyzedNews = newsArticles.map(article => ({
          ...article,
          analysis: null,
        }));
      }
    }

    // ESG 관련 뉴스만 필터링
    const esgRelatedNews = analyzedNews.filter(
      news => news.analysis?.isESGRelated
    );

    // 통계 계산
    const stats = {
      totalNews: newsArticles.length,
      esgRelatedNews: esgRelatedNews.length,
      byCategory: {
        E: esgRelatedNews.filter(n => n.analysis?.esgCategories?.includes('E')).length,
        S: esgRelatedNews.filter(n => n.analysis?.esgCategories?.includes('S')).length,
        G: esgRelatedNews.filter(n => n.analysis?.esgCategories?.includes('G')).length,
      },
      bySentiment: {
        positive: esgRelatedNews.filter(n => n.analysis?.sentiment === 'positive').length,
        negative: esgRelatedNews.filter(n => n.analysis?.sentiment === 'negative').length,
        neutral: esgRelatedNews.filter(n => n.analysis?.sentiment === 'neutral').length,
      },
    };

    console.log(`✅ 뉴스 분석 완료: ${esgRelatedNews.length}개 ESG 관련 뉴스 발견\n`);

    res.json({
      success: true,
      keyword,
      stats,
      news: esgRelatedNews,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 뉴스 분석 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * 여러 이슈에 대한 미디어 점수 계산
 * POST /api/media/calculate-media-scores
 */
export const calculateMediaScores = async (req, res) => {
  try {
    const { keyword, issues } = req.body;

    // 입력 검증
    if (!keyword || !issues || !Array.isArray(issues)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '키워드(keyword)와 이슈 배열(issues)이 필요합니다.',
      });
    }

    console.log(`\n📊 미디어 점수 계산 요청: "${keyword}" (${issues.length}개 이슈)`);

    // NewsScraper 초기화
    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);

    // 뉴스 검색 및 분석
    const newsArticles = await scraper.searchNews(keyword, 100);
    const analyzedNews = await scraper.analyzeNews(newsArticles);

    // 이슈별 키워드 맵 생성
    const issueKeywords = {};
    issues.forEach(issue => {
      issueKeywords[issue.name] = issue.keywords || [issue.name];
    });

    // 미디어 점수 계산
    const mediaScores = scraper.calculateMediaScores(analyzedNews, issueKeywords);

    console.log(`✅ 미디어 점수 계산 완료\n`);

    res.json({
      success: true,
      keyword,
      totalNews: analyzedNews.length,
      scores: mediaScores,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 미디어 점수 계산 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * 특정 이슈의 관련 뉴스 검색
 * POST /api/media/search-issue-news
 */
export const searchIssueNews = async (req, res) => {
  try {
    const { companyName, issueName, maxResults = 20 } = req.body;

    if (!companyName || !issueName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '회사명(companyName)과 이슈명(issueName)이 필요합니다.',
      });
    }

    console.log(`\n🔍 이슈 관련 뉴스 검색: ${companyName} - ${issueName}`);

    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);

    // 검색 키워드 조합
    const searchKeyword = `${companyName} ${issueName}`;
    const newsArticles = await scraper.searchNews(searchKeyword, maxResults);
    const analyzedNews = await scraper.analyzeNews(newsArticles);

    // 관련성 높은 뉴스만 필터링
    const relevantNews = analyzedNews
      .filter(news => news.analysis?.isESGRelated)
      .sort((a, b) => (b.analysis?.relevanceScore || 0) - (a.analysis?.relevanceScore || 0));

    console.log(`✅ ${relevantNews.length}개 관련 뉴스 발견\n`);

    res.json({
      success: true,
      companyName,
      issueName,
      totalResults: relevantNews.length,
      news: relevantNews,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 이슈 뉴스 검색 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * 미디어 기반 이슈 추천
 * POST /api/media/recommend-issues
 */
export const recommendIssues = async (req, res) => {
  try {
    const { keyword, maxResults = 50, topN = 10 } = req.body;

    // 입력 검증
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '키워드(keyword)가 필요합니다.',
        example: {
          keyword: '삼성전자',
          maxResults: 50,
          topN: 10
        }
      });
    }

    console.log(`\n🎯 미디어 기반 이슈 추천 요청: "${keyword}"`);

    // NewsScraper 초기화
    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);

    // 1. 뉴스 검색
    const newsArticles = await scraper.searchNews(keyword, maxResults);

    if (!newsArticles || newsArticles.length === 0) {
      return res.json({
        success: true,
        keyword,
        recommendedIssues: [],
        message: '검색 결과가 없습니다.',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. AI 분석
    const analyzedNews = await scraper.analyzeNews(newsArticles);

    // 3. 이슈 빈도수 집계 및 추천
    const recommendedIssues = scraper.recommendTopIssues(analyzedNews, topN);

    console.log(`✅ ${recommendedIssues.length}개 이슈 추천 완료\n`);

    res.json({
      success: true,
      keyword,
      totalNews: newsArticles.length,
      analyzedNews: analyzedNews.length,
      recommendedIssues,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 이슈 추천 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      details: error.stack,
    });
  }
};
