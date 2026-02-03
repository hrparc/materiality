import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// In-memory storage (임시 - DB 연동 전까지)
// Note: 실제로는 manual-issue-routes.js의 manualIssuesStore를 import해서 사용해야 하지만
// 현재는 단순화를 위해 mock 데이터 사용
const confirmedPoolsStore = new Map();

/**
 * GET /api/issues/pool/:projectId
 * 프로젝트의 통합 이슈풀 조회
 *
 * 3가지 출처 통합:
 * 1. 산업군 기반 추천 (SASB)
 * 2. 미디어 분석 추천
 * 3. 수동 입력 이슈
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { industry, keyword } = req.query;

    const issuePool = {
      projectId,
      generatedAt: new Date().toISOString(),
      sources: {
        industry: null,
        media: null,
        manual: null
      },
      allIssues: [],
      summary: {
        totalIssues: 0,
        bySource: {
          industry: 0,
          media: 0,
          manual: 0
        },
        byCategory: {
          E: 0,
          S: 0,
          G: 0
        }
      }
    };

    // 1. 산업군 기반 이슈 가져오기 (industry 파라미터가 있는 경우)
    if (industry) {
      try {
        const dataPath = path.join(__dirname, '../data/sasb-industry-issues.json');
        const jsonData = await fs.readFile(dataPath, 'utf-8');
        const allSectors = JSON.parse(jsonData);

        const sector = allSectors.find(s => s.섹터명 === industry);
        if (sector) {
          const industryIssues = sector.이슈_목록.map(issue => ({
            ...issue,
            source: 'industry',
            sourceDetail: `SASB - ${sector.섹터명}`
          }));

          issuePool.sources.industry = {
            sector: sector.섹터명,
            issueCount: industryIssues.length,
            issues: industryIssues
          };
          issuePool.allIssues.push(...industryIssues);
          issuePool.summary.bySource.industry = industryIssues.length;
        }
      } catch (error) {
        console.error('산업군 이슈 로딩 실패:', error);
      }
    }

    // 2. 미디어 분석 이슈 가져오기 (keyword 파라미터가 있는 경우)
    // Note: 실제로는 미디어 분석 결과를 저장소에서 가져와야 함
    // 현재는 mock 데이터 사용
    if (keyword) {
      issuePool.sources.media = {
        keyword,
        issueCount: 0,
        issues: [],
        note: 'Media analysis integration will be implemented with database'
      };
    }

    // 3. 수동 입력 이슈 가져오기
    // Note: 실제로는 manual-issue-routes의 store를 import해서 사용
    // 현재는 빈 배열로 처리
    issuePool.sources.manual = {
      issueCount: 0,
      issues: [],
      note: 'Manual issues will be fetched from database/store'
    };

    // 4. 카테고리별 통계 계산
    issuePool.allIssues.forEach(issue => {
      const category = issue.category || (issue.이슈명 ? 'S' : 'E'); // fallback
      if (category && ['E', 'S', 'G'].includes(category)) {
        issuePool.summary.byCategory[category]++;
      }
    });

    // 5. 중복 통합 및 출처 태그 병합
    const issueMap = new Map();

    for (const issue of issuePool.allIssues) {
      const name = issue.이슈명 || issue.issue_name || '';
      if (!name) continue;

      if (issueMap.has(name)) {
        // 중복 이슈 발견 - 출처 태그 추가
        const existing = issueMap.get(name);

        // sources 배열에 새로운 출처 추가
        const newSourceTag = {
          type: issue.source, // 'industry', 'media', 'manual'
          label: issue.source === 'industry' ? 'SASB 산업군' :
                 issue.source === 'media' ? '미디어 분석' : '직접 입력',
          detail: issue.sourceDetail || issue.source
        };

        // 중복 체크 후 추가
        const isDuplicate = existing.sources.some(s =>
          s.type === newSourceTag.type && s.detail === newSourceTag.detail
        );
        if (!isDuplicate) {
          existing.sources.push(newSourceTag);
        }
      } else {
        // 새로운 이슈 - 초기 구조 생성
        issueMap.set(name, {
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          이슈명: issue.이슈명,
          이슈_정의: issue.이슈_정의 || issue.description || '',
          category: issue.category || 'S',
          is_human_rights: issue.is_human_rights || false,
          issb_kssb_recommended: issue.issb_kssb_recommended || false,
          sources: [{
            type: issue.source,
            label: issue.source === 'industry' ? 'SASB 산업군' :
                   issue.source === 'media' ? '미디어 분석' : '직접 입력',
            detail: issue.sourceDetail || issue.source
          }],
          isSelected: false, // 프론트엔드에서 선택 상태 관리용
          공시_핵심: issue.공시_핵심 || [],
          관련_지표: issue.관련_지표 || []
        });
      }
    }

    issuePool.allIssues = Array.from(issueMap.values());
    issuePool.summary.totalIssues = issuePool.allIssues.length;

    res.json({
      success: true,
      ...issuePool
    });

  } catch (error) {
    console.error('이슈풀 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve issue pool',
      details: error.message
    });
  }
});

/**
 * POST /api/issues/pool/confirm
 * 이슈풀 확정
 *
 * 사용자가 선택한 이슈들을 프로젝트와 연결하여 저장
 * 다음 단계(설문조사)로 진행 가능 상태로 변경
 */
router.post('/confirm', async (req, res) => {
  try {
    const { projectId, selectedIssues, projectName, industry } = req.body;

    // Validation
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required'
      });
    }

    if (!selectedIssues || !Array.isArray(selectedIssues) || selectedIssues.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'selectedIssues array is required and must not be empty'
      });
    }

    // 확정된 이슈풀 저장
    const confirmedPool = {
      projectId,
      projectName: projectName || `Project ${projectId}`,
      industry: industry || null,
      confirmedAt: new Date().toISOString(),
      status: 'confirmed',
      selectedIssues: selectedIssues.map(issue => ({
        ...issue,
        selectedAt: new Date().toISOString()
      })),
      issueCount: selectedIssues.length,
      nextStep: 'stakeholder_survey'
    };

    confirmedPoolsStore.set(projectId, confirmedPool);

    // 통계 계산
    const stats = {
      totalIssues: selectedIssues.length,
      bySource: {
        industry: selectedIssues.filter(i => i.source === 'industry').length,
        media: selectedIssues.filter(i => i.source === 'media').length,
        manual: selectedIssues.filter(i => i.source === 'manual').length
      },
      byCategory: {
        E: selectedIssues.filter(i => i.category === 'E').length,
        S: selectedIssues.filter(i => i.category === 'S').length,
        G: selectedIssues.filter(i => i.category === 'G').length
      },
      humanRightsIssues: selectedIssues.filter(i => i.is_human_rights).length,
      climateIssues: selectedIssues.filter(i => i.issb_kssb_recommended).length
    };

    res.json({
      success: true,
      message: 'Issue pool confirmed successfully',
      projectId,
      confirmedAt: confirmedPool.confirmedAt,
      stats,
      nextStep: {
        action: 'stakeholder_survey',
        description: 'Proceed to stakeholder management and survey setup'
      }
    });

  } catch (error) {
    console.error('이슈풀 확정 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm issue pool',
      details: error.message
    });
  }
});

/**
 * GET /api/issues/pool/:projectId/confirmed
 * 확정된 이슈풀 조회
 */
router.get('/:projectId/confirmed', async (req, res) => {
  try {
    const { projectId } = req.params;

    const confirmedPool = confirmedPoolsStore.get(projectId);

    if (!confirmedPool) {
      return res.status(404).json({
        success: false,
        error: 'No confirmed issue pool found for this project'
      });
    }

    res.json({
      success: true,
      ...confirmedPool
    });

  } catch (error) {
    console.error('확정 이슈풀 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve confirmed issue pool',
      details: error.message
    });
  }
});

/**
 * DELETE /api/issues/pool/:projectId
 * 확정된 이슈풀 삭제 (재설정 시)
 */
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!confirmedPoolsStore.has(projectId)) {
      return res.status(404).json({
        success: false,
        error: 'No confirmed issue pool found for this project'
      });
    }

    confirmedPoolsStore.delete(projectId);

    res.json({
      success: true,
      message: 'Confirmed issue pool deleted successfully',
      projectId
    });

  } catch (error) {
    console.error('이슈풀 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete issue pool',
      details: error.message
    });
  }
});

export default router;
