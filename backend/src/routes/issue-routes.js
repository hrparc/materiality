import express from 'express';
import {
  recommendByIndustry,
  matchStandards,
  calculateScores,
} from '../controllers/issue-controller.js';

const router = express.Router();

/**
 * 산업군 기반 이슈 추천
 * POST /api/issues/recommend-by-industry
 *
 * Request Body:
 * {
 *   "industry": "의료장비",
 *   "topK": 10
 * }
 */
router.post('/recommend-by-industry', recommendByIndustry);

/**
 * 특정 이슈에 대한 표준 매칭
 * POST /api/issues/match-standards
 *
 * Request Body:
 * {
 *   "issue": "온실가스 배출",
 *   "topK": 5
 * }
 */
router.post('/match-standards', matchStandards);

/**
 * 여러 이슈에 대한 일괄 점수 계산
 * POST /api/issues/calculate-scores
 *
 * Request Body:
 * {
 *   "issues": [
 *     { "name": "온실가스 배출" },
 *     { "name": "산업안전보건" }
 *   ]
 * }
 */
router.post('/calculate-scores', calculateScores);

export default router;
