/**
 * 이슈풀 확정 페이지
 *
 * 3가지 출처(산업군, 미디어, 수동입력)의 이슈를 통합하여 표시하고
 * 사용자가 최종 이슈를 선택하여 확정
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import api from '../services/api';

const IssuePoolPage = () => {
  const navigate = useNavigate();
  const {
    projectId,
    projectName,
    selectedIndustry,
  } = useProject();

  const [issuePool, setIssuePool] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');

  // 통합 이슈풀 조회
  useEffect(() => {
    fetchIssuePool();
  }, []);

  const fetchIssuePool = async () => {
    try {
      setLoading(true);
      const data = await api.getIssuePool(projectId, {
        industry: selectedIndustry,
      });
      setIssuePool(data.allIssues || []);
    } catch (err) {
      setError('이슈풀을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 이슈 선택/해제 토글
  const toggleIssue = (issueId) => {
    setIssuePool((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? { ...issue, isSelected: !issue.isSelected }
          : issue
      )
    );
  };

  // 전체 선택/해제
  const toggleAll = () => {
    const allSelected = issuePool.every((issue) => issue.isSelected);
    setIssuePool((prev) =>
      prev.map((issue) => ({ ...issue, isSelected: !allSelected }))
    );
  };

  // 이슈풀 확정
  const handleConfirm = async () => {
    const selectedIssues = issuePool.filter((issue) => issue.isSelected);

    if (selectedIssues.length === 0) {
      alert('최소 1개 이상의 이슈를 선택해주세요');
      return;
    }

    if (!window.confirm(`${selectedIssues.length}개의 이슈를 확정하시겠습니까?`)) {
      return;
    }

    try {
      setConfirming(true);
      await api.confirmIssuePool(
        projectId,
        projectName,
        selectedIndustry,
        selectedIssues
      );
      alert('이슈풀이 확정되었습니다!');
      // 나중에 설문조사 페이지로 이동
      navigate('/');
    } catch (err) {
      alert('이슈풀 확정에 실패했습니다');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  // 카테고리 필터링
  const filteredIssues =
    filterCategory === 'ALL'
      ? issuePool
      : issuePool.filter((issue) => issue.category === filterCategory);

  // 통계 계산
  const stats = {
    total: issuePool.length,
    selected: issuePool.filter((i) => i.isSelected).length,
    byCategory: {
      E: issuePool.filter((i) => i.category === 'E').length,
      S: issuePool.filter((i) => i.category === 'S').length,
      G: issuePool.filter((i) => i.category === 'G').length,
    },
    bySource: {
      industry: issuePool.filter((i) =>
        i.sources?.some((s) => s.type === 'industry')
      ).length,
      media: issuePool.filter((i) =>
        i.sources?.some((s) => s.type === 'media')
      ).length,
      manual: issuePool.filter((i) =>
        i.sources?.some((s) => s.type === 'manual')
      ).length,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>4단계: 통합 이슈풀 확정</h1>
        <p style={styles.subtitle}>프로젝트: {projectName || '이름 없음'}</p>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}

        {/* 통계 */}
        <div style={styles.statsBox}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>전체 이슈</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: '#007bff' }}>
              {stats.selected}
            </div>
            <div style={styles.statLabel}>선택된 이슈</div>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.byCategory.E}</div>
            <div style={styles.statLabel}>환경 (E)</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.byCategory.S}</div>
            <div style={styles.statLabel}>사회 (S)</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.byCategory.G}</div>
            <div style={styles.statLabel}>거버넌스 (G)</div>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.bySource.industry}</div>
            <div style={styles.statLabel}>산업군</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.bySource.media}</div>
            <div style={styles.statLabel}>미디어</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.bySource.manual}</div>
            <div style={styles.statLabel}>직접입력</div>
          </div>
        </div>

        {/* 필터 및 전체 선택 */}
        <div style={styles.toolbar}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>카테고리:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">전체</option>
              <option value="E">환경 (E)</option>
              <option value="S">사회 (S)</option>
              <option value="G">거버넌스 (G)</option>
            </select>
          </div>
          <button onClick={toggleAll} style={styles.buttonSecondary}>
            {issuePool.every((i) => i.isSelected) ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        {/* 로딩 */}
        {loading && <div style={styles.loading}>로딩 중...</div>}

        {/* 이슈 목록 */}
        {!loading && filteredIssues.length === 0 && (
          <div style={styles.noData}>
            {filterCategory === 'ALL'
              ? '이슈가 없습니다. 이전 단계에서 이슈를 추가해주세요.'
              : '해당 카테고리의 이슈가 없습니다.'}
          </div>
        )}

        {!loading && filteredIssues.length > 0 && (
          <div style={styles.issueList}>
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  ...styles.issueCard,
                  ...(issue.isSelected && styles.issueCardSelected),
                }}
                onClick={() => toggleIssue(issue.id)}
              >
                <div style={styles.issueCheckbox}>
                  <input
                    type="checkbox"
                    checked={issue.isSelected}
                    onChange={() => {}}
                    style={styles.checkbox}
                  />
                </div>
                <div style={styles.issueContent}>
                  <div style={styles.issueHeader}>
                    <strong style={styles.issueName}>{issue.이슈명}</strong>
                    <span style={styles.issueCategory}>{issue.category}</span>
                  </div>
                  <p style={styles.issueDescription}>{issue.이슈_정의}</p>

                  {/* 출처 태그 (칩) */}
                  <div style={styles.sourceTags}>
                    {issue.sources?.map((source, idx) => (
                      <span key={idx} style={styles.sourceChip}>
                        {source.label}
                      </span>
                    ))}
                  </div>

                  {/* 특수 태그 */}
                  <div style={styles.specialTags}>
                    {issue.is_human_rights && (
                      <span style={styles.specialTag}>🏷️ 인권 이슈</span>
                    )}
                    {issue.issb_kssb_recommended && (
                      <span style={styles.specialTag}>🏷️ 기후/환경 이슈</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 네비게이션 */}
        <div style={styles.navigation}>
          <button onClick={() => navigate('/manual')} style={styles.buttonSecondary}>
            이전
          </button>
          <button
            onClick={handleConfirm}
            style={styles.buttonPrimary}
            disabled={confirming || stats.selected === 0}
          >
            {confirming ? '확정 중...' : `이슈풀 확정 (${stats.selected}개 선택)`}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statsBox: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  statDivider: {
    width: '1px',
    backgroundColor: '#ddd',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  filterSelect: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  issueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  issueCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fafafa',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  issueCardSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
  },
  issueCheckbox: {
    paddingTop: '2px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  issueContent: {
    flex: 1,
  },
  issueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  issueName: {
    fontSize: '16px',
    flex: 1,
  },
  issueCategory: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '12px',
  },
  issueDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  sourceTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  sourceChip: {
    fontSize: '12px',
    padding: '4px 10px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  specialTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  specialTag: {
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '4px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#999',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginTop: '30px',
    paddingTop: '30px',
    borderTop: '1px solid #eee',
  },
  buttonPrimary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default IssuePoolPage;
