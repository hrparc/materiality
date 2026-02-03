/**
 * 뉴스 검색 API 테스트 스크립트
 *
 * 실행 방법:
 * node scripts/test-news-search.js
 */

import dotenv from 'dotenv';
import { initGemini } from '../src/config/gemini.js';
import { NewsScraper } from '../src/services/news-scraper.js';

dotenv.config();

async function testNewsSearch() {
  console.log('═'.repeat(60));
  console.log('📰 뉴스 검색 API 테스트');
  console.log('═'.repeat(60));

  try {
    // Gemini AI 초기화
    console.log('\n1️⃣  Gemini AI 초기화 중...');
    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);

    // 테스트 검색어
    const keyword = '삼성전자 ESG';
    const maxResults = 10;

    console.log(`\n2️⃣  뉴스 검색 테스트: "${keyword}"`);
    const news = await scraper.searchNews(keyword, maxResults);

    console.log(`\n3️⃣  검색 결과:`);
    console.log(`   총 ${news.length}개 뉴스 발견\n`);

    // 결과 출력
    news.slice(0, 5).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   링크: ${article.link}`);
      console.log(`   내용: ${article.snippet.substring(0, 100)}...`);
      console.log('');
    });

    console.log('═'.repeat(60));
    console.log('✅ 테스트 완료!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('상세:', error);
    process.exit(1);
  }
}

testNewsSearch();
