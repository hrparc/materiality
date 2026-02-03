import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for manual issues (will be replaced with DB later)
const manualIssuesStore = new Map();

/**
 * POST /api/issues/manual
 * Create a new manual issue
 *
 * Request Body:
 * {
 *   "projectId": "abc123",
 *   "이슈명": "협력사 ESG 평가",
 *   "이슈_정의": "공급망 내 협력사의 ESG 리스크 관리",
 *   "category": "S",  // E, S, G
 *   "is_human_rights": true,  // optional, default false
 *   "issb_kssb_recommended": false  // optional, default false
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      projectId,
      이슈명,
      이슈_정의,
      category,
      is_human_rights = false,
      issb_kssb_recommended = false
    } = req.body;

    // Validation
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required'
      });
    }

    if (!이슈명 || !이슈_정의) {
      return res.status(400).json({
        success: false,
        error: '이슈명 and 이슈_정의 are required'
      });
    }

    if (!['E', 'S', 'G'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'category must be E, S, or G'
      });
    }

    // Create issue
    const issueId = uuidv4();
    const newIssue = {
      id: issueId,
      projectId,
      이슈명,
      이슈_정의,
      category,
      is_human_rights: Boolean(is_human_rights),
      issb_kssb_recommended: Boolean(issb_kssb_recommended),
      source: '직접 입력',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory
    if (!manualIssuesStore.has(projectId)) {
      manualIssuesStore.set(projectId, []);
    }
    manualIssuesStore.get(projectId).push(newIssue);

    res.status(201).json({
      success: true,
      message: 'Manual issue created successfully',
      issue: newIssue
    });

  } catch (error) {
    console.error('Create manual issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create manual issue',
      details: error.message
    });
  }
});

/**
 * GET /api/issues/manual/:projectId
 * Get all manual issues for a project
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const issues = manualIssuesStore.get(projectId) || [];

    res.json({
      success: true,
      projectId,
      totalIssues: issues.length,
      issues
    });

  } catch (error) {
    console.error('Get manual issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve manual issues',
      details: error.message
    });
  }
});

/**
 * PUT /api/issues/manual/:issueId
 * Update a manual issue
 */
router.put('/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const {
      이슈명,
      이슈_정의,
      category,
      is_human_rights,
      issb_kssb_recommended
    } = req.body;

    // Find issue across all projects
    let foundIssue = null;
    let projectId = null;

    for (const [pid, issues] of manualIssuesStore.entries()) {
      const issue = issues.find(i => i.id === issueId);
      if (issue) {
        foundIssue = issue;
        projectId = pid;
        break;
      }
    }

    if (!foundIssue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    // Validate category if provided
    if (category && !['E', 'S', 'G'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'category must be E, S, or G'
      });
    }

    // Update fields
    if (이슈명 !== undefined) foundIssue.이슈명 = 이슈명;
    if (이슈_정의 !== undefined) foundIssue.이슈_정의 = 이슈_정의;
    if (category !== undefined) foundIssue.category = category;
    if (is_human_rights !== undefined) foundIssue.is_human_rights = Boolean(is_human_rights);
    if (issb_kssb_recommended !== undefined) foundIssue.issb_kssb_recommended = Boolean(issb_kssb_recommended);
    foundIssue.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Manual issue updated successfully',
      issue: foundIssue
    });

  } catch (error) {
    console.error('Update manual issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update manual issue',
      details: error.message
    });
  }
});

/**
 * DELETE /api/issues/manual/:issueId
 * Delete a manual issue
 */
router.delete('/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;

    // Find and delete issue
    let deleted = false;
    let projectId = null;

    for (const [pid, issues] of manualIssuesStore.entries()) {
      const index = issues.findIndex(i => i.id === issueId);
      if (index !== -1) {
        issues.splice(index, 1);
        deleted = true;
        projectId = pid;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Manual issue deleted successfully',
      issueId,
      projectId
    });

  } catch (error) {
    console.error('Delete manual issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete manual issue',
      details: error.message
    });
  }
});

export default router;
