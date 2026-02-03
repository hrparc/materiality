# ESG 이중 중대성 평가 시스템 - 프론트엔드

React 기반 프론트엔드 애플리케이션

## 기술 스택

- **React** 18
- **React Router** 6 - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트
- **Context API** - 전역 상태 관리

## 프로젝트 구조

```
frontend/
├── src/
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── HomePage.js
│   │   ├── IndustrySelectionPage.js
│   │   ├── MediaAnalysisPage.js
│   │   ├── ManualIssuePage.js
│   │   └── IssuePoolPage.js
│   ├── components/         # 재사용 가능한 컴포넌트
│   ├── services/           # API 서비스 레이어
│   │   └── api.js
│   ├── contexts/           # Context API (상태 관리)
│   │   └── ProjectContext.js
│   ├── utils/              # 유틸리티 함수
│   ├── App.js             # 메인 App 컴포넌트
│   └── index.js           # 엔트리 포인트
├── public/
└── package.json
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일이 이미 설정되어 있습니다.

### 3. 개발 서버 실행

```bash
npm start
```

브라우저가 자동으로 열리며 http://localhost:3000에서 앱을 확인할 수 있습니다.

### 4. 백엔드 서버 실행

프론트엔드를 사용하기 전에 백엔드 서버가 실행 중이어야 합니다:

```bash
cd ../backend
npm start
```

## 주요 기능

### Phase 1: 이슈풀 구축

1. **홈 페이지** - 프로젝트 생성 및 시작
2. **산업군 선택** - SASB 산업군 이슈 추천
3. **미디어 분석** - 키워드 기반 뉴스 분석
4. **수동 이슈 입력** - 직접 이슈 추가/수정/삭제
5. **이슈풀 확정** - 통합 이슈풀에서 최종 선택

## 나중에 디자인을 입힐 때

현재는 인라인 스타일을 사용하여 기능 구현에 집중했습니다.

추천 방법:
- Tailwind CSS
- Material-UI
- styled-components
- CSS Modules

## 라이선스

MIT
