# ESG 이중 중대성 평가 서비스 - RAG 시스템

ESG 표준 문서(GRI, SASB, ISSB, KSSB)를 벡터화하여 산업군 기반 이슈 추천 및 표준 매칭을 제공하는 RAG 시스템입니다.

## 🚀 시작하기

### 1. 환경 설정

`.env` 파일을 생성하고 필요한 API 키를 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=esg-standards
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

### 2. 패키지 설치

```bash
npm install
```

### 3. Pinecone 인덱스 생성

Pinecone 대시보드에서 새 인덱스를 생성하세요:
- **Index Name**: `esg-standards`
- **Dimensions**: `768` (Gemini embedding 모델 차원)
- **Metric**: `cosine`

### 4. 문서 업로드

모든 ESG 표준 문서를 벡터 DB에 업로드합니다:

```bash
npm run upload-documents
```

특정 표준만 업로드하려면:
```bash
node scripts/upload-documents.js gri        # GRI만
node scripts/upload-documents.js sasb       # SASB만
node scripts/upload-documents.js issb       # ISSB만
node scripts/upload-documents.js kssb       # KSSB만
```

⚠️ **주의**: 이 작업은 시간이 오래 걸립니다 (1-2시간). 많은 PDF 파일을 처리하고 임베딩을 생성하기 때문입니다.

### 5. RAG 시스템 테스트

```bash
node scripts/test-rag.js
```

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── config/          # 설정 파일
│   │   ├── pinecone.js  # Pinecone 초기화 및 네임스페이스 정의
│   │   └── gemini.js    # Gemini AI 초기화 및 임베딩
│   ├── services/        # 비즈니스 로직
│   │   └── rag-service.js  # RAG 핵심 서비스
│   └── utils/           # 유틸리티
│       └── pdf-parser.js   # PDF 파싱 및 청킹
├── scripts/             # 실행 스크립트
│   ├── upload-documents.js  # 문서 업로드 스크립트
│   └── test-rag.js          # RAG 테스트 스크립트
├── package.json
└── .env
```

## 🗂️ 네임스페이스 구조

벡터 DB는 표준별/언어별로 격리되어 있습니다:

| 네임스페이스 | 설명 | 언어 |
|------------|------|------|
| `gri-en` | GRI Sector Standards | 영문 |
| `sasb-kr` | SASB 산업별 기준서 (77개) | 한국어 |
| `issb-kr` | ISSB IFRS S1, S2 | 한국어 |
| `kssb-kr` | KSSB 지속가능성 공시기준서 | 한국어 |

## 🔍 주요 기능

### 1. 산업군 기반 이슈 추천
```javascript
const results = await ragService.searchByIndustry('의료장비', 10);
```

### 2. 특정 이슈의 표준 매칭
```javascript
const matched = await ragService.matchIssueToStandards('온실가스 배출');
```

### 3. 네임스페이스 통계 확인
```javascript
await ragService.getNamespaceStats('gri-en');
```

## 🛠️ 기술 스택

- **벡터 DB**: Pinecone
- **AI 모델**: Google Gemini 2.0 Flash
  - 임베딩: `text-embedding-004`
  - 분류: Flash 모델
  - 추론: Pro 모델 (향후)
- **PDF 처리**: pdf-parse
- **런타임**: Node.js (ES Modules)

## 📊 처리 통계

- **GRI**: 4개 Sector Standards (영문)
- **SASB**: 77개 산업별 기준서 (한국어)
- **ISSB**: 6개 문서 (한국어)
- **KSSB**: 2개 공시기준서 (한국어)

총 약 **89개 문서**가 처리됩니다.

## 🔐 보안

- API 키는 `.env` 파일에 보관하며 git에 커밋하지 않습니다
- `.gitignore`에 `.env` 파일이 등록되어 있습니다

## 📝 다음 단계

- [ ] 설문조사 시스템 구축 (2단계)
- [ ] 이중 중대성 매트릭스 시각화 (3단계)
- [ ] 프론트엔드 개발
- [ ] 미디어 분석 에이전트 구현
- [ ] 뉴스 스크래핑 시스템

## 💡 참고사항

### 청킹 전략
- 기본 청크 크기: 500자
- 청크 간 겹침(overlap): 50자
- 문장 경계에서 자르기 (마침표, 줄바꿈)

### 추적성 (Traceability)
각 청크에는 다음 메타데이터가 포함됩니다:
- 원본 파일명
- 페이지 번호 (추정값)
- 청크 인덱스
- 원문 텍스트

이를 통해 AI 추천의 근거를 사용자에게 투명하게 제공할 수 있습니다.
