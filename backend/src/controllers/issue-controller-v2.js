import { getApplicableStandards } from '../config/industry-mapping.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 이슈 관련 API 컨트롤러 (JSON 기반)
 * PRD 수정: GRI/SASB에서 명시적으로 제시한 필수/권장/선택 지표만 추천
 * JSON 파일에서 직접 읽어 빠르고 정확하게 추천
 */

// JSON 데이터 로드
let griData = null;
let sasbData = null;

function loadIndicatorData() {
  if (!griData) {
    const griPath = join(__dirname, '../data/gri-indicators.json');
    griData = JSON.parse(readFileSync(griPath, 'utf-8'));
  }
  if (!sasbData) {
    const sasbPath = join(__dirname, '../data/sasb-indicators.json');
    sasbData = JSON.parse(readFileSync(sasbPath, 'utf-8'));
  }
}

/**
 * 산업군 기반 이슈 추천 (1단계) - JSON 기반 로직
 * POST /api/issues/recommend-by-industry
 */
export const recommendByIndustry = async (req, res) => {
  try {
    const { industryId } = req.body;

    // 입력 검증
    if (!industryId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '산업 ID(industryId) 정보가 필요합니다.',
      });
    }

    console.log(`\n🔍 산업군 기반 이슈 추천 요청: "${industryId}"`);

    // 1. 해당 산업에 적용 가능한 표준 확인
    const standards = getApplicableStandards(industryId);
    console.log(`   적용 가능한 표준: GRI ${standards.gri ? 'O' : 'X'}, SASB ${standards.sasb ? 'O' : 'X'}`);

    if (!standards.gri && !standards.sasb) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 산업에 적용 가능한 GRI/SASB 표준을 찾을 수 없습니다.',
      });
    }

    // 2. JSON 데이터 로드
    loadIndicatorData();

    const allIndicators = [];

    // 3. GRI 표준에서 지표 가져오기
    if (standards.gri) {
      const griStandard = standards.gri.standard; // "GRI 11"
      console.log(`\n📘 GRI ${griStandard} 지표 조회 중...`);

      if (griData[griStandard]) {
        const griIndicators = griData[griStandard].indicators.map(indicator => ({
          ...indicator,
          standard: 'GRI',
          sector: griData[griStandard].name,
        }));
        allIndicators.push(...griIndicators);
        console.log(`   ✅ ${griIndicators.length}개 GRI 지표 추가`);
      }
    }

    // 4. SASB 표준에서 지표 가져오기
    if (standards.sasb) {
      const sasbId = standards.sasb.id; // "insurance"
      console.log(`\n📗 SASB [${standards.sasb.category}] ${standards.sasb.name} 지표 조회 중...`);

      if (sasbData[sasbId]) {
        const sasbTopics = sasbData[sasbId].topics.map(topic => ({
          topic: topic.topic,
          topicEn: topic.topicEn,
          category: topic.category,
          type: topic.type,
          metrics: topic.metrics,
          standard: 'SASB',
          industry: sasbData[sasbId].name,
        }));
        allIndicators.push(...sasbTopics);
        console.log(`   ✅ ${sasbTopics.length}개 SASB 주제 추가`);
      }
    }

    // 5. 카테고리별 정렬 (E -> S -> G)
    const sortOrder = { E: 1, S: 2, G: 3 };
    allIndicators.sort((a, b) => sortOrder[a.category] - sortOrder[b.category]);

    console.log(`✅ 최종 ${allIndicators.length}개 지표 추천 완료\n`);

    res.json({
      success: true,
      industryId,
      appliedStandards: {
        gri: standards.gri ? standards.gri.standard : null,
        sasb: standards.sasb ? `[${standards.sasb.category}] ${standards.sasb.name}` : null,
      },
      totalResults: allIndicators.length,
      indicators: allIndicators,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 산업군 기반 추천 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * 특정 이슈에 대한 표준 매칭 (3단계)
 * POST /api/issues/match-standards
 */
export const matchStandards = async (req, res) => {
  try {
    const { issue, topK = 5 } = req.body;

    if (!issue) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '이슈(issue) 정보가 필요합니다.',
      });
    }

    console.log(`\n🎯 이슈 표준 매칭 요청: "${issue}"`);

    const ragService = req.ragService;
    if (!ragService) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'RAG 서비스가 초기화되지 않았습니다.',
      });
    }

    const matched = await ragService.matchIssueToStandards(issue, null, topK);

    const standardMatches = {};

    for (const [namespace, results] of Object.entries(matched)) {
      standardMatches[namespace] = results.map((result, index) => ({
        rank: index + 1,
        score: result.score,
        text: result.metadata?.text || '',
        citation: {
          source: result.metadata?.fileName,
          page: result.metadata?.estimatedPage,
          excerpt: result.metadata?.text?.substring(0, 200) + '...',
        },
      }));
    }

    console.log(`✅ 표준 매칭 완료\n`);

    res.json({
      success: true,
      issue: issue,
      matches: standardMatches,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 표준 매칭 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * 여러 이슈에 대한 일괄 점수 계산 (3단계)
 * POST /api/issues/calculate-scores
 */
export const calculateScores = async (req, res) => {
  try {
    const { issues } = req.body;

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '이슈 배열(issues)이 필요합니다.',
      });
    }

    console.log(`\n📊 ${issues.length}개 이슈 점수 계산 요청`);

    const ragService = req.ragService;
    if (!ragService) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'RAG 서비스가 초기화되지 않았습니다.',
      });
    }

    const results = [];

    for (const issue of issues) {
      const matched = await ragService.matchIssueToStandards(issue.name, null, 3);
      const scores = calculateObjectiveScores(matched);

      results.push({
        issue: issue.name,
        scores: scores,
        matches: matched,
      });
    }

    console.log(`✅ 점수 계산 완료\n`);

    res.json({
      success: true,
      totalIssues: issues.length,
      results: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 점수 계산 실패:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * 객관적 지표 점수 계산 (PRD 5.4항 기준)
 * @private
 */
const calculateObjectiveScores = (matched) => {
  const scores = {
    gri: 1,
    sasb: 1,
    issb: 1,
  };

  if (matched['gri-en'] && matched['gri-en'].length > 0) {
    const avgScore = matched['gri-en'].reduce((sum, m) => sum + m.score, 0) / matched['gri-en'].length;
    scores.gri = 1 + (avgScore * 4);
  }

  if (matched['sasb-kr'] && matched['sasb-kr'].length > 0) {
    const avgScore = matched['sasb-kr'].reduce((sum, m) => sum + m.score, 0) / matched['sasb-kr'].length;
    scores.sasb = 1 + (avgScore * 4);
  }

  const issbMatches = matched['issb-kr'] || [];
  const kssbMatches = matched['kssb-kr'] || [];
  const allMatches = [...issbMatches, ...kssbMatches];

  if (allMatches.length > 0) {
    const avgScore = allMatches.reduce((sum, m) => sum + m.score, 0) / allMatches.length;
    scores.issb = 1 + (avgScore * 4);
  }

  scores.gri = Math.min(5, Math.max(1, Math.round(scores.gri * 10) / 10));
  scores.sasb = Math.min(5, Math.max(1, Math.round(scores.sasb * 10) / 10));
  scores.issb = Math.min(5, Math.max(1, Math.round(scores.issb * 10) / 10));

  return scores;
};
