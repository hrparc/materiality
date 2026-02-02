# ESG 이중 중대성 평가 서비스 개발 로드맵

> 체크 표시(✅)는 완료된 작업을 의미합니다.

---

## Phase 0: 인프라 구축

### 0.1 백엔드 기본 구조 ✅ 완료
- [x] Express.js 서버 설정
- [x] API 라우팅 구조 설계 (issue-routes, media-routes, industry-routes)
- [x] 환경 변수 설정 (.env.example)

### 0.2 RAG 시스템 구축 ✅ 완료
- [x] Pinecone Vector DB 설정
- [x] Gemini AI 클라이언트 연동
- [x] PDF 파싱 및 청킹 시스템 구현 (500자 단위)
- [x] ESG 표준 문서 벡터화
  - GRI 영문 원본 (4개 파일) → 5,007개 벡터
  - SASB 한글 번역본 (40개 파일) → 2,447개 벡터
  - ISSB 한글 번역본 (6개 파일) → 541개 벡터
  - KSSB 한글 번역본 (2개 파일) → 278개 벡터
  - **총 8,273개 벡터 업로드 완료**

### 0.3 유틸리티 스크립트 ✅ 완료
- [x] PDF 업로드 스크립트 (upload-documents.js)
- [x] Pinecone 통계 확인 스크립트 (check-pinecone-stats.js)
- [x] GRI 지표 추출 스크립트 (extract-indicators.js) - 참고용

### 0.4 프로젝트 문서화 ✅ 완료
- [x] PRD.md (제품 요구사항 문서)
- [x] DEVELOPMENT_GUIDE.md (개발 가이드라인)
- [x] ROADMAP.md (개발 로드맵)
- [x] backend/README.md (백엔드 설명서)
- [x] backend/API.md (API 명세서)
- [x] 프로젝트 README.md

### 0.5 프로젝트 구조 정리 ✅ 완료
- [x] docs/ 폴더 생성 및 문서 이동
- [x] standards/ 폴더 생성 및 PDF 파일 정리
- [x] .gitignore 업데이트 및 보안 검증

### 0.6 산업군별 이슈 데이터 정리
- [ ] **GRI 산업별 이슈 JSON 작성**
  - 파일 위치: `backend/src/data/gri-industry-issues.json`
  - GRI 11 (석유 및 가스), GRI 12 (석탄), GRI 13 (농수산업), GRI 14 (광업) 섹터별 작성
  - 각 섹터의 필수/권장/선택 이슈 정리
  - 구조 예시:
    ```json
    {
      "oil-and-gas": {
        "industryName": "석유 및 가스",
        "standardReference": "GRI 11",
        "issues": [
          {
            "issueName": "온실가스 배출",
            "description": "Scope 1, 2, 3 배출량 관리 및 감축",
            "category": "E",
            "griReference": "GRI 305",
            "priority": "필수"
          }
        ]
      }
    }
    ```

- [ ] **SASB 산업별 이슈 JSON 작성**
  - 파일 위치: `backend/src/data/sasb-industry-issues.json`
  - SASB 77개 산업 전체 작성
  - 각 산업의 지속가능성 공시 주제 정리
  - 구조 예시:
    ```json
    {
      "E010100": {
        "industryCode": "E010100",
        "industryName": "석유 및 가스 - 탐사 및 생산",
        "sector": "추출물 및 광물 처리",
        "issues": [
          {
            "issueName": "온실가스 배출",
            "description": "직간접 온실가스 배출 관리",
            "category": "E",
            "sasbReference": "EM-EP-110a.1",
            "priority": "필수"
          }
        ]
      }
    }
    ```

- [ ] **산업군 코드 매핑 테이블 검증**
  - 현재 `backend/src/config/industry-mapping.js` 파일 확인
  - SASB 산업코드 ↔ GRI 섹터 ↔ 한글명 ↔ 영문명 매핑 완성도 체크
  - 필요시 보완

---

## Phase 1: 1단계 기능 구현 (이슈풀 구축)

### 1.1 산업군 기반 추천 API
- [ ] **산업군 목록 조회 API 구현**
  - `GET /api/industries`
  - SASB 77개 산업 + GRI 4개 섹터 통합 목록 반환
  - 카테고리별 그룹핑 (금융, 헬스케어, 인프라, 서비스 등)
  - 산업별 메타데이터 포함 (한글명, 영문명, 설명)

- [ ] **산업군별 이슈 추천 API 구현**
  - `GET /api/issues/recommend/industry/:industryCode`
  - Phase 0.6에서 작성한 JSON 파일 로드
  - 해당 산업의 필수/권장/선택 이슈 반환
  - 응답 형식:
    ```json
    {
      "industry": "석유 및 가스",
      "industryCode": "oil-and-gas",
      "standardReference": "GRI 11, SASB EM-EP",
      "recommendedIssues": [
        {
          "id": "issue_001",
          "name": "온실가스 배출",
          "description": "Scope 1, 2, 3 배출량 관리 및 감축",
          "category": "E",
          "source": "GRI 305, SASB EM-EP-110a.1",
          "priority": "필수"
        }
      ]
    }
    ```

### 1.2 미디어 분석 기능
- [ ] **뉴스 스크래핑 API 개선**
  - `POST /api/media/analyze`
  - 현재 news-scraper.js 개선
  - 요청 파라미터: `keyword` (기업명/업종명), `period` (기본 1년)
  - Puppeteer로 네이버/구글 뉴스 크롤링
  - 최근 1년간 뉴스 수집

- [ ] **뉴스 ESG 분류 및 감정 분석**
  - Gemini 2.5 Flash Lite로 뉴스 기사 ESG 카테고리 자동 분류
  - 긍정/부정/중립 감정 분석
  - 빈도수 집계 및 1~5점 점수 산출
  - PRD 2.3항의 미디어 점수 정규화 기준 적용

- [ ] **미디어 기반 이슈 추천 로직**
  - 뉴스 분석 결과 → ESG 이슈 후보 매칭
  - 원문 기사 링크 및 헤드라인 저장
  - 빈도수 높은 이슈 우선 추천

### 1.3 보고서 AI 분석
- [ ] **PDF 업로드 API**
  - `POST /api/reports/upload`
  - Multer로 PDF 파일 수신 및 임시 저장
  - 파일 크기 제한: 10MB
  - 지원 형식: PDF만

- [ ] **보고서 파싱 및 이슈 추출**
  - PDF에서 "중대성 평가", "중대 이슈", "Materiality Assessment" 섹션 자동 탐지
  - Gemini 2.5 Pro로 이슈 목록 추출
  - 페이지 번호 및 텍스트 위치 저장 (추적성 확보)

- [ ] **추출된 이슈 반환 API**
  - `GET /api/reports/:reportId/issues`
  - 추출된 이슈 목록 반환
  - PDF 내 원문 위치 정보 포함 (페이지 번호, 텍스트 하이라이트)

### 1.4 이슈풀 통합 및 확정
- [ ] **통합 이슈풀 조회 API**
  - `GET /api/issues/pool/:projectId`
  - 3가지 경로(산업군, 미디어, 보고서) 이슈 통합
  - 중복 제거 로직 (유사도 기반)
  - 이슈별 출처 표시

- [ ] **이슈풀 확정 API**
  - `POST /api/issues/pool/confirm`
  - 사용자가 선택한 이슈 저장
  - 프로젝트 ID와 연결
  - 다음 단계(설문조사)로 진행 가능 상태 생성

---

## Phase 2: 2단계 기능 구현 (설문조사)

### 2.1 데이터베이스 스키마 설계
- [ ] **Projects 테이블**
  - `id, name, industry_code, created_at, updated_at, status`

- [ ] **Issues 테이블**
  - `id, project_id, name, description, category, source, priority`

- [ ] **Stakeholders 테이블**
  - `id, project_id, group_id, name, email, organization, type (내부/외부)`

- [ ] **StakeholderGroups 테이블**
  - `id, project_id, name, type (internal/external), weight`

- [ ] **SurveyResponses 테이블**
  - `id, survey_id, stakeholder_id, issue_id, impact_score, financial_score, created_at`

- [ ] **AnalysisResults 테이블**
  - `id, project_id, issue_id, x_score, y_score, evidence_data, created_at`

- [ ] **데이터베이스 선택 및 설정**
  - PostgreSQL 또는 MongoDB 선택
  - 연결 설정 및 ORM 구성 (Prisma/Sequelize/Mongoose)
  - 마이그레이션 스크립트 작성

### 2.2 이해관계자 관리 API
- [ ] **이해관계자 그룹 CRUD**
  - `POST /api/stakeholders/groups` - 그룹 생성 (경영진, 실무진, 고객, NGO 등)
  - `GET /api/stakeholders/groups/:projectId` - 그룹 목록
  - `PUT /api/stakeholders/groups/:id` - 그룹 수정
  - `DELETE /api/stakeholders/groups/:id` - 그룹 삭제

- [ ] **이해관계자 개별 관리 CRUD**
  - `POST /api/stakeholders` - 이해관계자 추가
  - `GET /api/stakeholders/:projectId` - 목록 조회
  - `PUT /api/stakeholders/:id` - 수정
  - `DELETE /api/stakeholders/:id` - 삭제

- [ ] **CSV 일괄 업로드 기능**
  - `POST /api/stakeholders/upload-csv`
  - CSV 파일 파싱 및 유효성 검증
  - 대량 데이터 일괄 등록

### 2.3 설문 시스템
- [ ] **설문 생성 및 발송**
  - `POST /api/surveys/create`
  - 확정된 이슈풀 자동 E/S/G 분류
  - 설문 링크 생성 (토큰 기반, 보안)
  - 이메일 발송 로직 구현 (Nodemailer 또는 SendGrid)
  - 그룹별 맞춤 이메일 템플릿

- [ ] **설문 응답 페이지 (프론트엔드)**
  - 공개 설문 페이지 개발
  - 5점 리커트 척도 UI
  - 영향 중대성 질문 (Inside-Out)
  - 재무 중대성 질문 (Outside-In)
  - PRD 2.2의 질문 문구 및 설명 적용

- [ ] **설문 응답 저장 API**
  - `POST /api/surveys/responses`
  - 응답 데이터 검증 및 저장
  - 중복 응답 방지

- [ ] **응답 현황 대시보드**
  - `GET /api/surveys/:id/status` - 응답률 조회
  - 그룹별 응답 현황 통계
  - 미응답자 목록
  - 리마인더 이메일 재발송 기능

### 2.4 가중치 시스템
- [ ] **그룹별 가중치 설정**
  - 내부 그룹 (경영진, 실무진): 재무 중대성에 높은 가중치
  - 외부 그룹 (고객, NGO, 전문가): 영향 중대성에 높은 가중치
  - 기본 가중치: 내부 7 / 외부 3 (PRD 2.2 기준)
  - 커스텀 가중치 설정 API

---

## Phase 3: 3단계 기능 구현 (매트릭스 분석)

### 3.1 점수 산출 로직
- [ ] **설문 데이터 집계**
  - 그룹별 평균 점수 계산
  - S_ext (외부 그룹 평균), S_int (내부 그룹 평균) 산출
  - 가중치 적용 (7:3)

- [ ] **객관적 지표 자동 계산**
  - **미디어 점수**: 1단계 뉴스 분석 결과 활용 (1~5점 정규화)
  - **GRI 지표 부합도**: RAG로 Topic Standards disclosures 검색 후 점수화
  - **SASB 중요도**: JSON 파일의 priority 필드 + RAG 검색 결합
  - **ISSB/KSSB 적합성**: RAG로 핵심/필수 요구사항 검색
  - PRD 2.3항의 정규화 기준표 적용

- [ ] **최종 좌표 계산 API**
  - `POST /api/analysis/calculate`
  - PRD 2.3의 수식 구현:
    - 영향 중대성(X) = {(S_ext × 0.7 + S_int × 0.3) × 0.6} + {(미디어 점수 × 0.5 + GRI 지표 부합도 × 0.5) × 0.4}
    - 재무 중대성(Y) = {(S_int × 0.7 + S_ext × 0.3) × 0.6} + {(SASB 중요도 × 0.5 + 규제 공시 의무 × 0.5) × 0.4}
  - 각 이슈별 (X, Y) 좌표 반환

### 3.2 매트릭스 시각화
- [ ] **매트릭스 데이터 API**
  - `GET /api/analysis/matrix/:projectId`
  - 이슈별 좌표 및 메타데이터
  - 상위 10개 중대 이슈 자동 식별
  - 차트 렌더링에 필요한 모든 데이터 반환

- [ ] **프론트엔드 차트 구현**
  - Recharts로 산점도(Scatter Chart) 구현
  - X축: 영향 중대성, Y축: 재무 중대성
  - 이슈 클릭 시 상세 팝업 (근거 표시)
  - 축 레이블, 그리드, 범례
  - 상위 10개 이슈 색상/크기 강조

### 3.3 근거 제공 (Traceability)
- [ ] **이슈별 근거 API**
  - `GET /api/analysis/evidence/:issueId`
  - 설문 결과 요약 (그룹별 평균 점수)
  - 객관적 지표 상세 (각 지표별 점수 및 계산 과정)
  - RAG 검색 결과 (원문 인용, 페이지 번호, 조항 번호)
  - 계산 과정 투명화 (수식 및 중간값 표시)

- [ ] **출처 추적 시스템**
  - Vector DB 검색 결과 저장 (Pinecone 메타데이터)
  - 표준 문서 페이지 번호 및 조항 번호 저장
  - 뉴스 기사 링크 저장
  - (선택사항) PDF 하이라이트 기능

### 3.4 리포트 생성
- [ ] **최종 리포트 API**
  - `GET /api/analysis/report/:projectId`
  - PDF 리포트 생성 (puppeteer 또는 pdfkit)
  - 포함 내용:
    - 프로젝트 개요 (기업명, 산업군, 평가 기간)
    - 이중 중대성 매트릭스 차트 이미지
    - 상위 10개 중대 이슈 목록 및 설명
    - 각 이슈별 점수 및 근거 자료
    - 설문 응답 통계
    - 부록: 참고 표준 문서 목록

---

## Phase 4: 프론트엔드 개발

### 4.1 기술 스택 선택
- [ ] **프레임워크 선택**
  - React / Vue / Svelte 중 선택
  - TypeScript 적용 여부 결정

- [ ] **프로젝트 초기 설정**
  - 프로젝트 생성 및 폴더 구조 설계
  - Tailwind CSS / Material-UI / Ant Design 등 UI 라이브러리 선택
  - Recharts 설치 및 설정
  - API 클라이언트 설정 (axios / fetch)

### 4.2 프로젝트 관리 페이지
- [ ] **프로젝트 목록 페이지**
  - 프로젝트 카드 목록
  - 생성/수정/삭제 기능

- [ ] **프로젝트 생성 페이지**
  - 기업명, 산업군, 평가 연도 입력 폼
  - 산업군 선택 드롭다운 (1단계 API 연동)

### 4.3 1단계: 이슈풀 구축 UI
- [ ] **산업군 선택 인터페이스**
  - 산업 카테고리별 그룹핑 UI
  - 산업 검색 기능

- [ ] **이슈 추천 결과 표시**
  - 산업군 기반 추천 이슈 테이블
  - 필수/권장/선택 태그 표시
  - 이슈 설명 툴팁

- [ ] **미디어 분석 설정 및 결과**
  - 키워드 입력 폼
  - 분석 진행 상태 표시
  - 뉴스 기반 추천 이슈 테이블
  - 원문 기사 링크

- [ ] **보고서 업로드 및 결과**
  - PDF 드래그&드롭 업로드 UI
  - 추출된 이슈 목록 표시
  - 원문 위치 하이라이트

- [ ] **통합 이슈풀 확정**
  - 3가지 경로 이슈 통합 뷰
  - 체크박스로 이슈 선택
  - 중복 이슈 병합 UI
  - 최종 확정 버튼

### 4.4 2단계: 설문조사 UI
- [ ] **이해관계자 관리 페이지**
  - 그룹 추가/수정/삭제 UI
  - 이해관계자 테이블 (정렬, 필터, 검색)
  - CSV 업로드 UI

- [ ] **설문 발송 페이지**
  - 이메일 템플릿 미리보기
  - 발송 대상 선택
  - 발송 버튼

- [ ] **응답 현황 대시보드**
  - 응답률 진행 바
  - 그룹별 응답 현황 차트
  - 미응답자 목록
  - 리마인더 발송 버튼

### 4.5 3단계: 매트릭스 분석 UI
- [ ] **매트릭스 시각화 페이지**
  - Recharts 산점도 구현
  - 이슈 클릭 인터랙션
  - 줌/팬 기능 (선택사항)

- [ ] **이슈 상세 팝업**
  - 이슈 정보 (이름, 설명, 카테고리)
  - 점수 상세 (설문 평균, 객관적 지표)
  - 근거 자료 (RAG 원문, 뉴스 링크)
  - 계산 과정 표시

- [ ] **리포트 다운로드**
  - PDF 생성 버튼
  - 다운로드 진행 상태 표시

---

## Phase 5: 데이터베이스 구축 및 통합

### 5.1 ORM 설정
- [ ] **Prisma / Sequelize / Mongoose 설치**
- [ ] **스키마 정의 파일 작성**
- [ ] **마이그레이션 스크립트 작성**
- [ ] **시드 데이터 작성 (테스트용)**

### 5.2 백엔드-DB 통합
- [ ] **각 API 엔드포인트에 DB 쿼리 로직 추가**
- [ ] **트랜잭션 처리**
- [ ] **에러 핸들링**

---

## Phase 6: 테스트 및 최적화

### 6.1 단위 테스트
- [ ] **API 엔드포인트 테스트 (Jest / Mocha)**
- [ ] **점수 계산 로직 테스트**
- [ ] **RAG 검색 정확도 테스트**
- [ ] **PDF 파싱 테스트**

### 6.2 통합 테스트
- [ ] **전체 워크플로우 E2E 테스트 (Playwright / Cypress)**
- [ ] **실제 데이터 기반 테스트**

### 6.3 성능 최적화
- [ ] **API 응답 시간 측정 및 최적화**
- [ ] **Vector DB 검색 속도 최적화**
- [ ] **캐싱 전략 구현 (Redis)**
- [ ] **이미지 및 정적 파일 CDN 적용**

---

## Phase 7: 배포 및 운영

### 7.1 인프라 구축
- [ ] **서버 환경 설정 (AWS / GCP / Azure)**
- [ ] **Docker 컨테이너화**
  - Dockerfile 작성
  - docker-compose.yml 작성
- [ ] **CI/CD 파이프라인 구축 (GitHub Actions / GitLab CI)**

### 7.2 보안
- [ ] **API 인증/인가 구현 (JWT)**
- [ ] **HTTPS 설정 (SSL/TLS 인증서)**
- [ ] **API Rate Limiting**
- [ ] **입력 데이터 검증 및 sanitization**
- [ ] **환경 변수 보안 관리 (AWS Secrets Manager / Vault)**

### 7.3 모니터링 및 로깅
- [ ] **로깅 시스템 구축 (Winston / Pino)**
- [ ] **에러 트래킹 (Sentry)**
- [ ] **성능 모니터링 (New Relic / Datadog)**
- [ ] **헬스 체크 엔드포인트 구현**

---

## 📋 다음 단계 (우선순위)

**즉시 착수 가능:**
1. Phase 0.6 - 산업군별 이슈 JSON 파일 작성 (GRI 4개 섹터, SASB 77개 산업)
2. Phase 1.1 - 산업군 목록 API 구현
3. Phase 2.1 - 데이터베이스 스키마 설계 및 선택

**다음 단계 질문:**
- 프론트엔드 프레임워크: React / Vue / Svelte?
- 데이터베이스: PostgreSQL / MongoDB?
- 인증 시스템 필요 여부 및 방식?
- 이메일 발송: Nodemailer / SendGrid?

---

## 🎯 마일스톤

- **M1 (2주)**: Phase 0 완료
- **M2 (4주)**: Phase 1 완료 (이슈풀 구축 기능)
- **M3 (6주)**: Phase 2 완료 (설문조사 시스템)
- **M4 (8주)**: Phase 3 완료 (매트릭스 분석)
- **M5 (10주)**: Phase 4 완료 (프론트엔드 MVP)
- **M6 (12주)**: Phase 5-7 완료 (프로덕션 준비)

---

## 📁 현재 백엔드 구조

```
backend/
├── src/
│   ├── config/         # Pinecone, Gemini 설정 ✅
│   ├── controllers/    # API 컨트롤러 (일부 구현됨)
│   ├── routes/         # 라우팅 ✅
│   ├── services/       # 비즈니스 로직 (RAG 서비스 ✅)
│   ├── utils/          # 유틸리티 (PDF 파서 ✅)
│   └── data/           # JSON 데이터 파일 (여기에 이슈 JSON 추가 예정)
├── scripts/            # 유틸리티 스크립트 ✅
└── index.js            # 엔트리 포인트 ✅
```

**Vector DB 현황:**
- Pinecone Index: `esg-standards`
- Namespaces:
  - `gri-en`: 5,007 벡터 ✅
  - `sasb-kr`: 2,447 벡터 ✅
  - `issb-kr`: 541 벡터 ✅
  - `kssb-kr`: 278 벡터 ✅
