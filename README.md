# ESG 이중 중대성 평가 서비스

글로벌 ESG 공시 표준(GRI, SASB, ISSB, KSSB)에 부합하는 이중 중대성 평가(Double Materiality Assessment)를 자동화하고 시각화하는 웹 기반 B2B 솔루션입니다.

## 📚 문서

프로젝트 관련 모든 문서는 [`docs/`](docs/) 폴더에 있습니다.

- **[PRD.md](docs/PRD.md)** - 제품 요구사항 정의서 (Product Requirements Document)
  - 전체 서비스 개요, 기능 명세, 비즈니스 로직

- **[DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - 개발 가이드라인
  - 기술 스택, 아키텍처, 개발 원칙

- **[ROADMAP.md](docs/ROADMAP.md)** - 개발 로드맵
  - 단계별 To-Do 리스트, 마일스톤

## 🚀 빠른 시작

### 백엔드 설정

```bash
cd backend
npm install
cp .env.example .env
# .env 파일에 API 키 설정 필요:
# - GEMINI_API_KEY
# - PINECONE_API_KEY
# - PINECONE_INDEX_NAME

npm start
```

자세한 내용은 [backend/README.md](backend/README.md)를 참고하세요.

## 📁 프로젝트 구조

```
materiality/
├── docs/                    # 프로젝트 문서
│   ├── PRD.md              # 제품 요구사항
│   ├── DEVELOPMENT_GUIDE.md # 개발 가이드
│   └── ROADMAP.md          # 개발 로드맵
├── backend/                 # 백엔드 (Node.js + Express)
│   ├── src/
│   │   ├── config/         # 설정 (Pinecone, Gemini)
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── routes/         # 라우팅
│   │   ├── services/       # 비즈니스 로직
│   │   ├── utils/          # 유틸리티
│   │   └── data/           # JSON 데이터 파일
│   ├── scripts/            # 유틸리티 스크립트
│   └── index.js            # 엔트리 포인트
├── standards/              # ESG 표준 PDF 문서 (gitignore)
│   ├── GRI/               # GRI 섹터 표준 (영문)
│   ├── SASB/              # SASB 산업 표준 (한글)
│   ├── ISSB/              # ISSB 공시 표준 (한글)
│   └── KSSB/              # KSSB 공시 표준 (한글)
└── README.md              # 이 파일
```

## 🛠 기술 스택

### 백엔드
- **프레임워크**: Node.js + Express.js
- **데이터베이스**: PostgreSQL (예정)
- **Vector DB**: Pinecone
- **AI 모델**:
  - Gemini 2.5 Flash Lite (간단한 작업)
  - Gemini 2.5 Pro (복잡한 추론)
  - Gemini text-embedding-004 (텍스트 임베딩)

### 프론트엔드 (예정)
- **시각화**: Recharts
- **UI 프레임워크**: TBD

## 📊 현재 진행 상황

### ✅ 완료
- [x] 백엔드 기본 구조 구축
- [x] RAG 시스템 구축 (Pinecone + Gemini)
- [x] ESG 표준 문서 벡터화 완료 (8,273개 벡터)
  - GRI: 5,007개
  - SASB: 2,447개
  - ISSB: 541개
  - KSSB: 278개
- [x] 프로젝트 문서화

### 🔄 진행 중
- [ ] 산업군별 이슈 JSON 데이터 정리
- [ ] 1단계 API 개발 (이슈풀 구축)

### 📋 예정
- [ ] 2단계: 설문조사 시스템
- [ ] 3단계: 매트릭스 분석 및 시각화
- [ ] 프론트엔드 개발

자세한 로드맵은 [docs/ROADMAP.md](docs/ROADMAP.md)를 참고하세요.

## 📄 API 문서

API 명세는 [backend/API.md](backend/API.md)를 참고하세요.

## 🔐 환경 변수

`.env` 파일에 다음 환경 변수가 필요합니다:

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=esg-standards

# Server
PORT=3000
```

## 🤝 개발 원칙

1. **AI 투명성 (Traceability)**
   - 모든 AI 추천 및 판단에 출처와 근거 명시
   - 사용자가 '출처 보기'로 쉽게 확인 가능

2. **데이터 격리**
   - 기업별 프로젝트 데이터 완전 분리
   - 로그인 기반 접근 제어

3. **실시간 처리**
   - 설문 응답 즉시 DB 반영
   - 응답 현황 대시보드 실시간 업데이트

4. **확장 가능성**
   - 다국어 지원을 위한 i18n 아키텍처
   - 모듈화된 코드 구조
   - API 기반 설계

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
