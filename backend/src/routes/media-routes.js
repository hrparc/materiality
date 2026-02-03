import express from 'express';
import {
  analyzeNews,
  calculateMediaScores,
  searchIssueNews,
  recommendIssues,
} from '../controllers/media-controller.js';

const router = express.Router();

/**
 * 키워드 기반 뉴스 분석 (ROADMAP Phase 1.2 요구사항)
 * POST /api/media/analyze
 *
 * Request Body:
 * {
 *   "keyword": "삼성전자" (기업명 또는 업종명),
 *   "period": "y1" (기본값: 1년, 옵션: y1, m6, m3),
 *   "maxResults": 50
 * }
 */
router.post('/analyze', analyzeNews);

/**
 * 키워드 기반 뉴스 분석 (레거시 엔드포인트)
 * POST /api/media/analyze-news
 *
 * Request Body:
 * {
 *   "keyword": "삼성전자 ESG",
 *   "maxResults": 50,
 *   "analyzeWithAI": true
 * }
 */
router.post('/analyze-news', analyzeNews);

/**
 * 여러 이슈에 대한 미디어 점수 계산
 * POST /api/media/calculate-media-scores
 *
 * Request Body:
 * {
 *   "keyword": "삼성전자",
 *   "issues": [
 *     { "name": "온실가스 배출", "keywords": ["온실가스", "탄소배출", "기후변화"] },
 *     { "name": "산업안전보건", "keywords": ["산업재해", "안전사고", "근로환경"] }
 *   ]
 * }
 */
router.post('/calculate-media-scores', calculateMediaScores);

/**
 * 특정 이슈의 관련 뉴스 검색
 * POST /api/media/search-issue-news
 *
 * Request Body:
 * {
 *   "companyName": "삼성전자",
 *   "issueName": "온실가스 배출",
 *   "maxResults": 20
 * }
 */
router.post('/search-issue-news', searchIssueNews);

/**
 * 미디어 기반 이슈 추천 (Phase 1.2 완성)
 * POST /api/media/recommend-issues
 *
 * Request Body:
 * {
 *   "keyword": "삼성전자",
 *   "maxResults": 50,
 *   "topN": 10
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "keyword": "삼성전자",
 *   "recommendedIssues": [
 *     {
 *       "이슈명": "AI 에너지 소비",
 *       "언급횟수": 15,
 *       "부정_비율": "60.0",
 *       "긍정_비율": "20.0",
 *       "ESG_카테고리": ["E"],
 *       "관련_뉴스": [...]
 *     }
 *   ]
 * }
 */
router.post('/recommend-issues', recommendIssues);

export default router;
