/**
 * 미디어 분석 API 직접 테스트
 * 서버 없이 뉴스 스크래핑 기능을 직접 테스트
 *
 * 실행 방법:
 * node scripts/test-media-analyze.js
 */

import dotenv from 'dotenv';
import { initGemini } from '../src/config/gemini.js';
import { NewsScraper } from '../src/services/news-scraper.js';

dotenv.config();

async function testMediaAnalyze() {
  console.log('═'.repeat(70));
  console.log('📰 미디어 분석 API 직접 테스트 (Phase 1.2)');
  console.log('═'.repeat(70));

  try {
    // 1. Gemini 초기화
    console.log('\n1️⃣  Gemini AI 초기화 중...');
    const genAI = initGemini();
    const scraper = new NewsScraper(genAI);
    console.log('✅ Gemini AI 초기화 완료');

    // 2. 테스트 파라미터
    const testCases = [
      {
        keyword: '삼성전자',
        period: 'y1',
        maxResults: 5,
        description: '삼성전자 1년간 뉴스 (5개)'
      },
    ];

    for (const testCase of testCases) {
      console.log('\n' + '─'.repeat(70));
      console.log(`\n2️⃣  테스트: ${testCase.description}`);
      console.log(`   키워드: "${testCase.keyword}"`);
      console.log(`   기간: ${testCase.period}`);
      console.log(`   최대 결과: ${testCase.maxResults}개`);

      // 3. 뉴스 검색
      console.log('\n3️⃣  뉴스 검색 중...');
      let newsArticles;
      try {
        newsArticles = await scraper.searchNews(
          testCase.keyword,
          testCase.maxResults,
          testCase.period
        );

        if (!newsArticles || newsArticles.length === 0) {
          console.log('⚠️  검색 결과가 없습니다.');
          continue;
        }

        console.log(`✅ ${newsArticles.length}개 뉴스 발견\n`);

        // 검색 결과 미리보기
        console.log('📄 검색 결과 미리보기:');
        newsArticles.slice(0, 3).forEach((article, index) => {
          console.log(`\n   ${index + 1}. ${article.title}`);
          console.log(`      링크: ${article.link}`);
          console.log(`      내용: ${article.snippet.substring(0, 100)}...`);
        });

      } catch (searchError) {
        console.error('❌ 뉴스 검색 실패:', searchError.message);
        console.error('   상세:', searchError);
        continue;
      }

      // 4. AI 분석 (첫 2개만 테스트)
      console.log(`\n4️⃣  AI 분석 시작 (${Math.min(2, newsArticles.length)}개 뉴스)...`);
      try {
        const analyzedNews = await scraper.analyzeNews(newsArticles.slice(0, 2));

        console.log('\n🤖 AI 분석 결과:');
        analyzedNews.forEach((news, index) => {
          if (news.analysis) {
            console.log(`\n   ${index + 1}. ${news.title}`);
            console.log(`      ESG 관련: ${news.analysis.isESGRelated ? 'Yes ✓' : 'No ✗'}`);
            if (news.analysis.isESGRelated) {
              console.log(`      카테고리: ${news.analysis.esgCategories?.join(', ') || 'N/A'}`);
              console.log(`      이슈: ${news.analysis.issues?.join(', ') || 'N/A'}`);
              console.log(`      감정: ${news.analysis.sentiment || 'N/A'}`);
              console.log(`      관련성 점수: ${news.analysis.relevanceScore || 'N/A'}/5`);
            }
          } else {
            console.log(`\n   ${index + 1}. ${news.title}`);
            console.log(`      분석 실패 ✗`);
          }
        });

        // 통계 계산
        const esgRelated = analyzedNews.filter(n => n.analysis?.isESGRelated);
        console.log('\n📊 통계:');
        console.log(`   전체 뉴스: ${analyzedNews.length}개`);
        console.log(`   ESG 관련 뉴스: ${esgRelated.length}개 (${((esgRelated.length / analyzedNews.length) * 100).toFixed(1)}%)`);

        if (esgRelated.length > 0) {
          const byCategory = {
            E: esgRelated.filter(n => n.analysis?.esgCategories?.includes('E')).length,
            S: esgRelated.filter(n => n.analysis?.esgCategories?.includes('S')).length,
            G: esgRelated.filter(n => n.analysis?.esgCategories?.includes('G')).length,
          };
          console.log(`   카테고리별: E(${byCategory.E}), S(${byCategory.S}), G(${byCategory.G})`);

          const bySentiment = {
            positive: esgRelated.filter(n => n.analysis?.sentiment === 'positive').length,
            negative: esgRelated.filter(n => n.analysis?.sentiment === 'negative').length,
            neutral: esgRelated.filter(n => n.analysis?.sentiment === 'neutral').length,
          };
          console.log(`   감정별: 긍정(${bySentiment.positive}), 부정(${bySentiment.negative}), 중립(${bySentiment.neutral})`);
        }

      } catch (analysisError) {
        console.error('❌ AI 분석 실패:', analysisError.message);
        console.error('   상세:', analysisError);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ 모든 테스트 완료!');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('상세:', error);
    process.exit(1);
  }
}

testMediaAnalyze();
