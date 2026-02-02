import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initPinecone } from './config/pinecone.js';
import { initGemini } from './config/gemini.js';
import { RAGService } from './services/rag-service.js';
import issueRoutes from './routes/issue-routes.js';
import mediaRoutes from './routes/media-routes.js';
import industryRoutes from './routes/industry-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 전역 변수로 RAG 서비스 저장
let ragService = null;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (테스트 페이지)
app.use(express.static('public'));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// RAG 서비스 초기화 함수
const initializeRAGService = async () => {
  try {
    console.log('\n🚀 RAG 서비스 초기화 중...');
    const pinecone = await initPinecone();
    const genAI = initGemini();
    const indexName = process.env.PINECONE_INDEX_NAME || 'esg-standards';

    ragService = new RAGService(pinecone, genAI, indexName);
    console.log('✅ RAG 서비스 초기화 완료\n');

    return ragService;
  } catch (error) {
    console.error('❌ RAG 서비스 초기화 실패:', error);
    throw error;
  }
};

// RAG 서비스를 요청 객체에 추가하는 미들웨어
app.use((req, res, next) => {
  req.ragService = ragService;
  next();
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ragServiceInitialized: ragService !== null,
  });
});

// API 라우트 등록
app.use('/api/issues', issueRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/industries', industryRoutes);

// 404 에러 핸들러
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `경로를 찾을 수 없습니다: ${req.path}`,
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error('❌ 서버 에러:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // RAG 서비스 초기화
    await initializeRAGService();

    // 서버 시작
    app.listen(PORT, () => {
      console.log('═'.repeat(60));
      console.log(`🌟 ESG 이중 중대성 평가 서비스 API 서버 실행 중`);
      console.log(`📍 포트: ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🏥 헬스 체크: http://localhost:${PORT}/health`);
      console.log('═'.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작 실행
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM 신호 수신, 서버 종료 중...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT 신호 수신 (Ctrl+C), 서버 종료 중...');
  process.exit(0);
});
