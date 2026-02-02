# ESG 이중 중대성 평가 서비스 개발 로드맵

## 프로젝트 현황

### ✅ 완료된 작업

1. **백엔드 기본 구조 구축**
   - Express.js 서버 설정 완료
   - API 라우팅 구조 설계 (issue-routes, media-routes, industry-routes)
   - 환경 변수 설정 (.env.example)

2. **RAG 시스템 구축**
   - Pinecone Vector DB 설정 완료
   - Gemini AI 클라이언트 연동
   - PDF 파싱 및 청킹 시스템 구현
   - 전체 ESG 표준 문서 벡터화 완료
     - GRI: 5,007개 벡터
     - SASB: 2,447개 벡터
     - ISSB: 541개 벡터
     - KSSB: 278개 벡터

3. **유틸리티 스크립트**
   - PDF 업로드 스크립트 (upload-documents.js)
   - Pinecone 통계 확인 스크립트 (check-pinecone-stats.js)
   - GRI 지표 추출 스크립트 (extract-indicators.js) - 참고용

4. **문서화**
   - PRD.md (제품 요구사항 문서)
   - backend/README.md (백엔드 설명서)
   - backend/API.md (API 명세서)

---

## 🚀 개발 우선순위 및 단계

### Phase 0: 사전 준비 (진행 중)

#### 0.1 산업군별 이슈 데이터 정리
- [ ] **GRI 산업별 이슈 JSON 작성**
  - 파일 위치: `backend/src/data/gri-industry-issues.json`
  - 구조:
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
  - GRI 11, 12, 13, 14 섹터별 작성

- [ ] **SASB 산업별 이슈 JSON 작성**
  - 파일 위치: `backend/src/data/sasb-industry-issues.json`
  - 구조:
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
  - SASB 77개 산업 전체 작성

- [ ] **산업군 코드 매핑 테이블 작성**
  - 파일 위치: `backend/src/data/industry-mapping.json`
  - SASB 산업코드 ↔ GRI 섹터 ↔ 한글명 ↔ 영문명 매핑

---

### Phase 1: 1단계 기능 구현 (이슈풀 구축)

#### 1.1 산업군 기반 추천 API
- [ ] **산업군 목록 조회 API**
  - `GET /api/industries`
  - SASB 77개 산업 + GRI 4개 섹터 통합 목록 반환
  - 카테고리별 그룹핑 (금융, 헬스케어, 인프라 등)

- [ ] **산업군별 이슈 추천 API**
  - `GET /api/issues/recommend/industry/:industryCode`
  - JSON 파일에서 해당 산업 이슈 로드
  - 응답 형식:
    ```json
    {
      "industry": "석유 및 가스",
      "recommendedIssues": [
        {
          "id": "issue_001",
          "name": "온실가스 배출",
          "description": "...",
          "category": "E",
          "source": "GRI 11, SASB EM-EP-110a.1",
          "priority": "필수"
        }
      ]
    }
    ```

#### 1.2 미디어 분석 기능
- [ ] **뉴스 스크래핑 API 개선**
  - `POST /api/media/analyze`
  - 현재 news-scraper.js 개선
  - 요청 파라미터: `keyword`, `period` (기본 1년)
  - Puppeteer로 네이버/구글 뉴스 크롤링

- [ ] **뉴스 ESG 분류 로직**
  - Gemini AI로 뉴스 기사 ESG 카테고리 분류
  - 긍정/부정/중립 감정 분석
  - 빈도수 집계 및 점수 산출

- [ ] **미디어 기반 이슈 추천**
  - 뉴스 분석 결과 → 이슈 후보 매칭
  - 원문 기사 링크 및 헤드라인 저장

#### 1.3 보고서 AI 분석
- [ ] **PDF 업로드 API**
  - `POST /api/reports/upload`
  - PDF 파일 수신 및 임시 저장
  - 파일 크기 제한: 10MB

- [ ] **보고서 파싱 및 이슈 추출**
  - PDF에서 "중대성 평가", "중대 이슈" 섹션 찾기
  - Gemini AI로 이슈 목록 추출
  - 페이지 번호 및 텍스트 위치 저장

- [ ] **추출된 이슈 반환 API**
  - `GET /api/reports/:reportId/issues`
  - PDF 내 위치 정보와 함께 이슈 반환

#### 1.4 이슈풀 통합 및 확정
- [ ] **통합 이슈풀 조회 API**
  - `GET /api/issues/pool`
  - 3가지 경로(산업군, 미디어, 보고서)의 이슈 통합
  - 중복 제거 로직

- [ ] **이슈풀 확정 API**
  - `POST /api/issues/pool/confirm`
  - 사용자가 선택한 이슈 저장
  - 프로젝트 ID와 연결

---

### Phase 2: 2단계 기능 구현 (설문조사)

#### 2.1 이해관계자 관리
- [ ] **데이터베이스 스키마 설계**
  - Projects 테이블
  - Stakeholders 테이블
  - StakeholderGroups 테이블
  - 관계 설정

- [ ] **이해관계자 그룹 CRUD API**
  - `POST /api/stakeholders/groups` - 그룹 생성
  - `GET /api/stakeholders/groups` - 그룹 목록
  - `PUT /api/stakeholders/groups/:id` - 그룹 수정
  - `DELETE /api/stakeholders/groups/:id` - 그룹 삭제

- [ ] **이해관계자 개별 관리 API**
  - `POST /api/stakeholders` - 이해관계자 추가
  - `GET /api/stakeholders` - 목록 조회
  - `PUT /api/stakeholders/:id` - 수정
  - `DELETE /api/stakeholders/:id` - 삭제
  - CSV 일괄 업로드 기능

#### 2.2 설문 시스템
- [ ] **설문 생성 및 발송**
  - `POST /api/surveys/create` - 설문 생성
  - 이슈풀 자동 E/S/G 분류
  - 이메일 발송 로직 (Nodemailer)
  - 설문 링크 생성 (토큰 기반)

- [ ] **설문 응답 페이지**
  - 프론트엔드 설문 페이지 개발
  - 5점 리커트 척도 UI
  - 영향 중대성 / 재무 중대성 질문
  - 응답 저장 API: `POST /api/surveys/responses`

- [ ] **응답 현황 대시보드**
  - `GET /api/surveys/:id/status` - 응답률 조회
  - 그룹별 응답 현황
  - 미응답자 목록
  - 리마인더 발송 기능

#### 2.3 가중치 시스템
- [ ] **그룹별 가중치 설정**
  - 내부/외부 그룹 분류
  - 기본 가중치: 내부 7 / 외부 3
  - 커스텀 가중치 설정 API

---

### Phase 3: 3단계 기능 구현 (매트릭스 분석)

#### 3.1 점수 산출 로직
- [ ] **설문 데이터 집계**
  - 그룹별 평균 점수 계산
  - S_ext, S_int 산출
  - 가중치 적용

- [ ] **객관적 지표 계산**
  - **미디어 점수**: 1단계 뉴스 분석 결과 활용
  - **GRI 지표 부합도**: RAG로 Topic Standards disclosures 검색
  - **SASB 중요도**: JSON 파일의 priority 필드 활용
  - **ISSB/KSSB 적합성**: RAG로 핵심/필수 요구사항 검색
  - 1~5점 정규화

- [ ] **최종 좌표 계산 API**
  - `POST /api/analysis/calculate`
  - PRD 2.3의 수식 구현
  - 영향 중대성(X) 및 재무 중대성(Y) 산출
  - 각 이슈별 좌표 반환

#### 3.2 매트릭스 시각화
- [ ] **매트릭스 데이터 API**
  - `GET /api/analysis/matrix/:projectId`
  - 이슈별 좌표 및 메타데이터
  - 상위 10개 중대 이슈 식별

- [ ] **프론트엔드 차트 구현**
  - Recharts로 산점도 구현
  - 이슈 클릭 시 상세 팝업
  - 축 레이블 및 그리드
  - 상위 10개 강조 표시

#### 3.3 근거 제공
- [ ] **이슈별 근거 API**
  - `GET /api/analysis/evidence/:issueId`
  - 설문 결과 요약
  - 객관적 지표 상세
  - RAG 검색 결과 (원문 인용)
  - 계산 과정 투명화

- [ ] **출처 추적 시스템**
  - Vector DB 검색 결과 저장
  - 페이지 번호 및 조항 번호 저장
  - PDF 하이라이트 기능 (선택사항)

#### 3.4 리포트 생성
- [ ] **최종 리포트 API**
  - `GET /api/analysis/report/:projectId`
  - PDF 리포트 생성 (puppeteer-pdf)
  - 매트릭스 차트 이미지
  - 중대 이슈 목록 및 설명
  - 근거 자료 첨부

---

### Phase 4: 프론트엔드 개발

#### 4.1 프로젝트 관리
- [ ] **프로젝트 생성 페이지**
  - 기업명, 산업군, 평가 연도 입력
  - 프로젝트 목록 및 대시보드

#### 4.2 1단계 UI
- [ ] **산업군 선택 인터페이스**
- [ ] **이슈 추천 결과 표시**
- [ ] **미디어 분석 설정**
- [ ] **보고서 업로드 및 결과**
- [ ] **통합 이슈풀 확정**

#### 4.3 2단계 UI
- [ ] **이해관계자 관리 페이지**
- [ ] **설문 발송 및 관리**
- [ ] **응답 현황 대시보드**

#### 4.4 3단계 UI
- [ ] **매트릭스 시각화**
- [ ] **이슈 상세 팝업**
- [ ] **리포트 다운로드**

---

### Phase 5: 데이터베이스 설계 및 구축

#### 5.1 스키마 설계
- [ ] **Projects 테이블**
  ```sql
  - id, name, industry_code, created_at, status
  ```

- [ ] **Issues 테이블**
  ```sql
  - id, project_id, name, description, category, source
  ```

- [ ] **Stakeholders 테이블**
  ```sql
  - id, project_id, group_id, name, email, organization
  ```

- [ ] **SurveyResponses 테이블**
  ```sql
  - id, survey_id, stakeholder_id, issue_id,
    impact_score, financial_score, created_at
  ```

- [ ] **AnalysisResults 테이블**
  ```sql
  - id, project_id, issue_id, x_score, y_score,
    evidence_data, created_at
  ```

#### 5.2 데이터베이스 선택
- [ ] PostgreSQL 또는 MongoDB 선택
- [ ] 연결 설정 및 ORM 구성 (Prisma/Sequelize)
- [ ] 마이그레이션 스크립트 작성

---

### Phase 6: 테스트 및 최적화

#### 6.1 단위 테스트
- [ ] API 엔드포인트 테스트
- [ ] 점수 계산 로직 테스트
- [ ] RAG 검색 정확도 테스트

#### 6.2 통합 테스트
- [ ] 전체 워크플로우 테스트
- [ ] 실제 데이터 기반 테스트

#### 6.3 성능 최적화
- [ ] API 응답 시간 최적화
- [ ] Vector DB 검색 최적화
- [ ] 캐싱 전략 구현

---

### Phase 7: 배포 및 운영

#### 7.1 인프라 구축
- [ ] 서버 환경 설정 (AWS/GCP)
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인

#### 7.2 보안
- [ ] API 인증/인가 (JWT)
- [ ] HTTPS 설정
- [ ] API Rate Limiting
- [ ] 입력 데이터 검증

#### 7.3 모니터링
- [ ] 로깅 시스템
- [ ] 에러 트래킹
- [ ] 성능 모니터링

---

## 📋 즉시 착수 가능한 작업 (우선순위 높음)

1. **산업군별 이슈 JSON 파일 작성** (Phase 0.1)
   - 이 작업이 완료되어야 1단계 API 개발 가능

2. **데이터베이스 스키마 설계** (Phase 5.1)
   - 전체 시스템 아키텍처의 기반

3. **산업군 목록 API 구현** (Phase 1.1)
   - 가장 기본적인 기능

4. **프론트엔드 프로젝트 구조 설정** (Phase 4)
   - React/Vue/Svelte 선택 및 초기 설정

---

## 🎯 마일스톤

- **M1 (2주)**: Phase 0 완료 + Phase 1.1 완료
- **M2 (4주)**: Phase 1 전체 완료
- **M3 (6주)**: Phase 2 전체 완료
- **M4 (8주)**: Phase 3 전체 완료
- **M5 (10주)**: Phase 4 전체 완료 (MVP)
- **M6 (12주)**: Phase 5-7 완료 (프로덕션 준비)

---

## 📝 참고 사항

- **현재 백엔드 파일 구조**:
  ```
  backend/
  ├── src/
  │   ├── config/         # Pinecone, Gemini 설정
  │   ├── controllers/    # API 컨트롤러
  │   ├── routes/         # 라우팅
  │   ├── services/       # 비즈니스 로직
  │   ├── utils/          # 유틸리티
  │   └── data/           # JSON 데이터 파일 (여기에 이슈 JSON 추가)
  ├── scripts/            # 유틸리티 스크립트
  └── index.js            # 엔트리 포인트
  ```

- **다음 단계 질문**:
  - 프론트엔드 프레임워크 선택?
  - 데이터베이스 선택 (PostgreSQL vs MongoDB)?
  - 인증 시스템 필요 여부?
  - 설문 이메일 발송 방식 (Nodemailer vs SendGrid)?
