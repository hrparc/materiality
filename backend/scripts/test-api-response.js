/**
 * API 응답 형식 확인 테스트
 * 프론트엔드에서 받을 JSON 형식 확인
 */

import dotenv from 'dotenv';
import { initGemini } from '../src/config/gemini.js';
import { NewsScraper } from '../src/services/news-scraper.js';

dotenv.config();

async function testAPIResponse() {
  console.log('📋 API 응답 형식 테스트\n');

  try {
    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);

    // 적은 개수로 빠르게 테스트
    const newsArticles = await scraper.searchNews('삼성전자', 5);
    const analyzedNews = await scraper.analyzeNews(newsArticles);
    const recommendedIssues = scraper.recommendTopIssues(analyzedNews, 3);

    // API 응답 형태로 출력
    const apiResponse = {
      success: true,
      keyword: '삼성전자',
      totalNews: newsArticles.length,
      analyzedNews: analyzedNews.length,
      recommendedIssues: recommendedIssues,
      timestamp: new Date().toISOString(),
    };

    console.log('\n📤 프론트엔드가 받을 API 응답:\n');
    console.log(JSON.stringify(apiResponse, null, 2));

    // 첫 번째 이슈의 뉴스 확인
    if (recommendedIssues.length > 0 && recommendedIssues[0].관련_뉴스.length > 0) {
      console.log('\n✅ 첫 번째 이슈의 첫 번째 뉴스 상세:');
      console.log(JSON.stringify(recommendedIssues[0].관련_뉴스[0], null, 2));

      const firstNews = recommendedIssues[0].관련_뉴스[0];
      console.log('\n📋 포함된 필드:');
      console.log(`   제목: ${firstNews.제목 ? '✅' : '❌'}`);
      console.log(`   설명: ${firstNews.설명 ? '✅' : '❌'}`);
      console.log(`   링크: ${firstNews.링크 ? '✅' : '❌'}`);
      console.log(`   원문링크: ${firstNews.원문링크 ? '✅' : '❌'}`);
      console.log(`   날짜: ${firstNews.날짜 ? '✅' : '❌'}`);
      console.log(`   감정: ${firstNews.감정 ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

testAPIResponse();
