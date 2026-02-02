import express from 'express';
import { getAllIndustries } from '../config/industry-mapping.js';

const router = express.Router();

/**
 * 전체 산업 목록 조회 (드롭다운용)
 * GET /api/industries
 */
router.get('/', (req, res) => {
  try {
    const industries = getAllIndustries();

    res.json({
      success: true,
      totalCount: industries.length,
      industries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 산업 목록 조회 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
