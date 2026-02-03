import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// ES module에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SASB 산업 데이터 로드
const loadIndustryData = () => {
  const dataPath = path.join(__dirname, '../data/sasb-industry-issues.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(rawData);
};

/**
 * 전체 산업군 목록 조회 (드롭다운용)
 * GET /api/industries
 *
 * Response:
 * {
 *   success: true,
 *   totalCount: 38,
 *   industries: [
 *     { name: "[금융] 보험", category: "금융", issueCount: 5 },
 *     ...
 *   ]
 * }
 */
router.get('/', (req, res) => {
  try {
    const industryData = loadIndustryData();

    // 산업군 목록 생성 (섹터명과 이슈 개수만 반환)
    const industries = industryData.map(sector => ({
      name: sector.섹터명,
      category: sector.섹터명.match(/\[(.*?)\]/)?.[1] || '기타', // 대괄호 안의 카테고리 추출
      issueCount: sector.이슈_목록.length,
    }));

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

/**
 * 산업군별 이슈 추천 조회
 * GET /api/industries/:sectorName/issues
 *
 * Example: GET /api/industries/[금융] 보험/issues
 *
 * Response:
 * {
 *   success: true,
 *   sector: "[금융] 보험",
 *   totalIssues: 5,
 *   issues: [
 *     {
 *       이슈명: "투명한 정보 및 고객들을 위한 공정한 자문",
 *       이슈_정의: "...",
 *       공시_핵심: [...],
 *       관련_지표: [...]
 *     },
 *     ...
 *   ]
 * }
 */
router.get('/:sectorName/issues', (req, res) => {
  try {
    const { sectorName } = req.params;
    const industryData = loadIndustryData();

    // URL 디코딩 (브라우저에서 인코딩된 경우)
    const decodedSectorName = decodeURIComponent(sectorName);

    // 해당 산업군 찾기
    const sector = industryData.find(s => s.섹터명 === decodedSectorName);

    if (!sector) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `산업군을 찾을 수 없습니다: ${decodedSectorName}`,
        availableSectors: industryData.map(s => s.섹터명),
      });
    }

    res.json({
      success: true,
      sector: sector.섹터명,
      totalIssues: sector.이슈_목록.length,
      issues: sector.이슈_목록,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 산업별 이슈 조회 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
