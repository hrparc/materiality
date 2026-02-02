import express from 'express';
import {
  analyzeNews,
  calculateMediaScores,
  searchIssueNews,
} from '../controllers/media-controller.js';

const router = express.Router();

/**
 * 키워드 기반 뉴스 분석
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

export default router;
