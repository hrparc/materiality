import { initPinecone, NAMESPACES } from '../src/config/pinecone.js';
import { initGemini } from '../src/config/gemini.js';
import { RAGService } from '../src/services/rag-service.js';

/**
 * Pinecone 네임스페이스 통계 확인
 */
const main = async () => {
  console.log('\n' + '█'.repeat(60));
  console.log('📊 Pinecone 네임스페이스 통계 확인');
  console.log('█'.repeat(60));

  try {
    const pinecone = await initPinecone();
    const genAI = initGemini();
    const indexName = process.env.PINECONE_INDEX_NAME || 'esg-standards';
    const ragService = new RAGService(pinecone, genAI, indexName);

    console.log('\n확인 중...\n');

    for (const [key, namespace] of Object.entries(NAMESPACES)) {
      await ragService.getNamespaceStats(namespace);
    }

    console.log('\n' + '█'.repeat(60));
    console.log('✅ 확인 완료!');
    console.log('█'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
};

main();
