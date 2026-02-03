/**
 * 미디어 기반 이슈 추천 API 테스트
 * Phase 1.2 완성 테스트
 *
 * 실행 방법:
 * node scripts/test-recommend-issues.js
 */

import dotenv from 'dotenv';
import { initGemini } from '../src/config/gemini.js';
import { NewsScraper } from '../src/services/news-scraper.js';

dotenv.config();

async function testRecommendIssues() {
  console.log('═'.repeat(70));
  console.log('🎯 미디어 기반 이슈 추천 테스트 (Phase 1.2)');
  console.log('═'.repeat(70));

  try {
    // 1. Gemini 초기화
    console.log('\n1️⃣  Gemini AI 초기화 중...');
    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);
    console.log('✅ Gemini AI 초기화 완료');

    // 2. 테스트 파라미터
    const keyword = '삼성전자';
    const maxResults = 10; // 테스트를 위해 10개만
    const topN = 10;

    console.log('\n2️⃣  테스트 파라미터:');
    console.log(`   키워드: "${keyword}"`);
    console.log(`   최대 뉴스 수: ${maxResults}개`);
    console.log(`   추천 이슈 수: 상위 ${topN}개`);

    // 3. 뉴스 검색
    console.log('\n3️⃣  뉴스 검색 중...');
    const newsArticles = await scraper.searchNews(keyword, maxResults);

    if (!newsArticles || newsArticles.length === 0) {
      console.log('⚠️  검색 결과가 없습니다.');
      return;
    }

    console.log(`✅ ${newsArticles.length}개 뉴스 발견`);

    // 4. AI 분석
    console.log('\n4️⃣  AI 분석 중...');
    const analyzedNews = await scraper.analyzeNews(newsArticles);

    const esgRelated = analyzedNews.filter(n => n.analysis?.isESGRelated);
    console.log(`✅ ${analyzedNews.length}개 뉴스 분석 완료`);
    console.log(`   ESG 관련 뉴스: ${esgRelated.length}개`);

    // 5. 이슈 추천
    console.log('\n5️⃣  이슈 빈도수 집계 및 추천...');
    const recommendedIssues = scraper.recommendTopIssues(analyzedNews, topN);

    if (recommendedIssues.length === 0) {
      console.log('⚠️  추천할 이슈가 없습니다.');
      return;
    }

    // 6. 결과 출력
    console.log('\n' + '═'.repeat(70));
    console.log('📊 추천 이슈 결과');
    console.log('═'.repeat(70));

    recommendedIssues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.이슈명}`);
      console.log(`   언급 횟수: ${issue.언급횟수}회`);
      console.log(`   ESG 카테고리: ${issue.ESG_카테고리.join(', ')}`);
      console.log(`   감정 분석:`);
      console.log(`      긍정: ${issue.긍정_비율}% (${issue.긍정_뉴스}개)`);
      console.log(`      부정: ${issue.부정_비율}% (${issue.부정_뉴스}개)`);
      console.log(`      중립: ${((issue.중립_뉴스 / issue.언급횟수) * 100).toFixed(1)}% (${issue.중립_뉴스}개)`);

      if (issue.관련_뉴스.length > 0) {
        console.log(`   대표 뉴스 (${issue.관련_뉴스.length}개):`);
        issue.관련_뉴스.slice(0, 2).forEach((news, idx) => {
          console.log(`      ${idx + 1}. ${news.제목}`);
          console.log(`         ${news.링크}`);
        });
      }
    });

    // 7. 요약 통계
    console.log('\n' + '═'.repeat(70));
    console.log('📈 통계 요약');
    console.log('═'.repeat(70));
    console.log(`   총 뉴스: ${newsArticles.length}개`);
    console.log(`   ESG 관련 뉴스: ${esgRelated.length}개`);
    console.log(`   추천 이슈: ${recommendedIssues.length}개`);
    console.log(`   총 언급 횟수: ${recommendedIssues.reduce((sum, i) => sum + i.언급횟수, 0)}회`);

    console.log('\n' + '═'.repeat(70));
    console.log('✅ 테스트 완료!');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('상세:', error);
    process.exit(1);
  }
}

testRecommendIssues();
