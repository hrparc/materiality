# ESG 이중 중대성 평가 서비스 API 문서

## 🚀 기본 정보

- **Base URL**: `http://localhost:3001`
- **Content-Type**: `application/json`

---

## 📋 엔드포인트 목록

### 1. 헬스 체크

서버 상태 확인

**GET** `/health`

**응답 예시:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T10:30:00.000Z",
  "ragServiceInitialized": true
}
```

---

## 🎯 이슈 관리 API (`/api/issues`)

### 1.1. 산업군 기반 이슈 추천

RAG를 사용하여 특정 산업군에 적합한 ESG 이슈를 추천합니다.

**POST** `/api/issues/recommend-by-industry`

**요청 Body:**
```json
{
  "industry": "의료장비",
  "topK": 10
}
```

**응답 예시:**
```json
{
  "success": true,
  "industry": "의료장비",
  "totalResults": 10,
  "recommendations": [
    {
      "rank": 1,
      "score": 0.892,
      "source": "GRI",
      "namespace": "gri-en",
      "issue": {
        "text": "...",
        "fileName": "GRI 11_ Oil and Gas Sector 2021.pdf",
        "page": 15,
        "chunkIndex": 23
      },
      "citation": {
        "source": "GRI 11_ Oil and Gas Sector 2021.pdf",
        "page": 15,
        "excerpt": "..."
      }
    }
  ],
  "timestamp": "2026-02-02T10:30:00.000Z"
}
```

### 1.2. 이슈별 표준 매칭

특정 이슈에 대한 GRI/SASB/ISSB/KSSB 표준 매칭

**POST** `/api/issues/match-standards`

**요청 Body:**
```json
{
  "issue": "온실가스 배출",
  "topK": 5
}
```

**응답 예시:**
```json
{
  "success": true,
  "issue": "온실가스 배출",
  "matches": {
    "gri-en": [
      {
        "rank": 1,
        "score": 0.945,
        "text": "...",
        "citation": {
          "source": "GRI 11_ Oil and Gas Sector 2021.pdf",
          "page": 42,
          "excerpt": "..."
        }
      }
    ],
    "sasb-kr": [...],
    "issb-kr": [...],
    "kssb-kr": [...]
  },
  "timestamp": "2026-02-02T10:30:00.000Z"
}
```

### 1.3. 여러 이슈 점수 일괄 계산

여러 이슈에 대한 객관적 지표 점수 계산 (PRD 5.4항 기준)

**POST** `/api/issues/calculate-scores`

**요청 Body:**
```json
{
  "issues": [
    { "name": "온실가스 배출" },
    { "name": "산업안전보건" },
    { "name": "에너지 효율" }
  ]
}
```

**응답 예시:**
```json
{
  "success": true,
  "totalIssues": 3,
  "results": [
    {
      "issue": "온실가스 배출",
      "scores": {
        "gri": 4.5,
        "sasb": 4.2,
        "issb": 4.8
      },
      "matches": {...}
    }
  ],
  "timestamp": "2026-02-02T10:30:00.000Z"
}
```

---

## 📰 미디어 분석 API (`/api/media`)

### 2.1. 뉴스 분석

키워드 기반 뉴스 수집 및 AI 분석

**POST** `/api/media/analyze-news`

**요청 Body:**
```json
{
  "keyword": "삼성전자 ESG",
  "maxResults": 50,
  "analyzeWithAI": true
}
```

**응답 예시:**
```json
{
  "success": true,
  "keyword": "삼성전자 ESG",
  "stats": {
    "totalNews": 50,
    "esgRelatedNews": 38,
    "byCategory": {
      "E": 15,
      "S": 12,
      "G": 11
    },
    "bySentiment": {
      "positive": 20,
      "negative": 10,
      "neutral": 8
    }
  },
  "news": [
    {
      "title": "...",
      "snippet": "...",
      "link": "https://...",
      "publishDate": "2025-12-15T00:00:00.000Z",
      "analysis": {
        "isESGRelated": true,
        "esgCategories": ["E", "G"],
        "issues": ["온실가스 배출", "이사회 다양성"],
        "sentiment": "positive",
        "relevanceScore": 4
      }
    }
  ],
  "timestamp": "2026-02-02T10:30:00.000Z"
}
```

### 2.2. 미디어 점수 계산

여러 이슈에 대한 미디어 점수 계산 (PRD 5.4항 기준)

**POST** `/api/media/calculate-media-scores`

**요청 Body:**
```json
{
  "keyword": "삼성전자",
  "issues": [
    {
      "name": "온실가스 배출",
      "keywords": ["온실가스", "탄소배출", "기후변화"]
    },
    {
      "name": "산업안전보건",
      "keywords": ["산업재해", "안전사고", "근로환경"]
    }
  ]
}
```

**응답 예시:**
```json
{
  "success": true,
  "keyword": "삼성전자",
  "totalNews": 100,
  "scores": {
    "온실가스 배출": {
      "score": 5,
      "exposureRate": "15.50",
      "relatedNewsCount": 15,
      "negativeRate": "73.33",
      "details": {
        "totalNews": 100,
        "relatedNews": 15,
        "negativeNews": 11
      }
    },
    "산업안전보건": {
      "score": 3,
      "exposureRate": "8.00",
      "relatedNewsCount": 8,
      "negativeRate": "37.50",
      "details": {
        "totalNews": 100,
        "relatedNews": 8,
        "negativeNews": 3
      }
    }
  },
  "timestamp": "2026-02-02T10:30:00.000Z"
}
```

### 2.3. 이슈 관련 뉴스 검색

특정 이슈에 대한 관련 뉴스만 검색

**POST** `/api/media/search-issue-news`

**요청 Body:**
```json
{
  "companyName": "삼성전자",
  "issueName": "온실가스 배출",
  "maxResults": 20
}
```

**응답 예시:**
```json
{
  "success": true,
  "companyName": "삼성전자",
  "issueName": "온실가스 배출",
  "totalResults": 15,
  "news": [
    {
      "title": "삼성전자, 2030년 탄소중립 목표 발표",
      "snippet": "...",
      "link": "https://...",
      "publishDate": "2025-11-20T00:00:00.000Z",
      "analysis": {
        "isESGRelated": true,
        "esgCategories": ["E"],
        "issues": ["온실가스 배출"],
        "sentiment": "positive",
        "relevanceScore": 5
      }
    }
  ],
  "timestamp": "2026-02-02T10:30:00.000Z"
}
```

---

## 🔐 환경 변수 설정

`.env` 파일에 다음 설정이 필요합니다:

```bash
# Pinecone 설정
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=esg-standards

# Google Gemini API 설정
GEMINI_API_KEY=your_gemini_api_key

# Google Search API 설정 (선택 사항)
# GOOGLE_SEARCH_API_KEY=your_google_search_api_key
# GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# 서버 설정
PORT=3001
```

---

## 📊 미디어 점수 계산 기준 (PRD 5.4항)

| 점수 | 조건 |
|-----|------|
| **5점** | 노출 빈도 상위 10% 이내 및 부정적 맥락 70% 이상 |
| **3점** | 노출 빈도 10%~50% 범위, 긍정·부정 편차 20% 이내 |
| **1점** | 노출 빈도 하위 50% 이하 또는 긍정 맥락 50% 이상 |

---

## 🧪 테스트

서버 실행 후 테스트:

```bash
# 서버 시작
npm start

# API 테스트 (별도 터미널)
npm run test-api
```
