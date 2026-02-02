import { initPinecone } from '../src/config/pinecone.js';
import { initGemini } from '../src/config/gemini.js';
import { RAGService } from '../src/services/rag-service.js';

/**
 * RAG 시스템 테스트 스크립트
 */
const main = async () => {
  console.log('\n' + '█'.repeat(60));
  console.log('🧪 RAG 시스템 테스트');
  console.log('█'.repeat(60) + '\n');

  try {
    // 초기화
    const pinecone = await initPinecone();
    const genAI = initGemini();
    const indexName = process.env.PINECONE_INDEX_NAME || 'esg-standards';
    const ragService = new RAGService(pinecone, genAI, indexName);

    // 테스트 1: 산업군 기반 검색
    console.log('\n📝 테스트 1: 산업군 기반 이슈 추천');
    console.log('-'.repeat(60));

    const testIndustries = [
      '의료장비',
      '석유 및 가스',
      '금융 서비스',
    ];

    for (const industry of testIndustries) {
      const results = await ragService.searchByIndustry(industry, 5);

      console.log(`\n🏭 산업군: ${industry}`);
      console.log(`   추천 이슈: ${results.length}개\n`);

      results.slice(0, 3).forEach((result, idx) => {
        console.log(`   ${idx + 1}. [${result.source}] 유사도: ${result.score.toFixed(3)}`);
        console.log(`      ${result.metadata?.text?.substring(0, 100)}...`);
        console.log(`      출처: ${result.metadata?.fileName}\n`);
      });
    }

    // 테스트 2: 특정 이슈 매칭
    console.log('\n📝 테스트 2: 이슈별 표준 매칭');
    console.log('-'.repeat(60));

    const testIssues = [
      '온실가스 배출',
      '산업안전보건',
      '데이터 프라이버시',
    ];

    for (const issue of testIssues) {
      const matched = await ragService.matchIssueToStandards(issue, null, 3);

      console.log(`\n🎯 이슈: ${issue}`);

      for (const [namespace, results] of Object.entries(matched)) {
        if (results.length > 0) {
          console.log(`\n   📘 ${namespace}:`);
          results.slice(0, 2).forEach((result, idx) => {
            console.log(`      ${idx + 1}. 유사도: ${result.score.toFixed(3)}`);
            console.log(`         ${result.metadata?.text?.substring(0, 80)}...`);
          });
        }
      }
    }

    console.log('\n' + '█'.repeat(60));
    console.log('✅ 테스트 완료!');
    console.log('█'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
};

main();
