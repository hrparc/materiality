/**
 * 이슈풀 생성 페이지 (통합)
 *
 * 좌측: 이슈풀 후보 (토글로 추가/제거)
 * 우측: 선택된 이슈풀 (설문에 사용할 이슈)
 *
 * [+ 이슈 추가] 버튼 → 3가지 방법 선택:
 * 1. 산업군 기반 (온실가스 배출 등)
 * 2. 미디어 조사
 * 3. 직접 추가
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import api from '../services/api';

const IssuePoolBuilderPage = () => {
  const { projectId } = useParams();
  const { projectName, selectedIndustry } = useProject();

  console.log('IssuePoolBuilderPage 렌더:', { projectId, projectName, selectedIndustry });

  // 이슈풀 후보 (왼쪽)
  const [candidateIssues, setCandidateIssues] = useState([]);

  // 선택된 이슈풀 (오른쪽)
  const [selectedIssues, setSelectedIssues] = useState([]);

  // UI 상태
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // 미디어 조사 폼
  const [mediaForm, setMediaForm] = useState({
    keyword: '',
    period: 'y1',
    topN: 10,
  });

  // 수동 입력 폼
  const [manualForm, setManualForm] = useState({
    이슈명: '',
    이슈_정의: '',
    category: 'E',
    is_human_rights: false,
    issb_kssb_recommended: false,
  });

  // 컴포넌트 마운트 시 산업군 이슈 자동 로드
  useEffect(() => {
    console.log('useEffect 실행:', { selectedIndustry, candidateIssuesLength: candidateIssues.length });
    if (selectedIndustry && candidateIssues.length === 0) {
      console.log('산업군 이슈 로딩 시작:', selectedIndustry);
      loadIndustryIssues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndustry]);

  // 산업군 이슈 로드
  const loadIndustryIssues = async () => {
    if (!selectedIndustry) return;

    setLoading(true);
    try {
      const data = await api.getIndustryIssues(selectedIndustry);
      const newIssues = data.issues.map((issue) => ({
        ...issue,
        id: `industry_${Date.now()}_${Math.random()}`,
        source: 'industry',
        isCandidate: true,
      }));
      setCandidateIssues(newIssues);
    } catch (err) {
      console.error('산업군 이슈 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 이슈를 후보 → 선택 이동
  const moveToSelected = (issue) => {
    setCandidateIssues(candidateIssues.filter((i) => i.id !== issue.id));
    setSelectedIssues([...selectedIssues, { ...issue, isCandidate: false }]);
  };

  // 이슈를 선택 → 후보 이동
  const moveToCandidate = (issue) => {
    setSelectedIssues(selectedIssues.filter((i) => i.id !== issue.id));
    setCandidateIssues([...candidateIssues, { ...issue, isCandidate: true }]);
  };

  // 카테고리별 필터링
  const filteredCandidates =
    filterCategory === 'ALL'
      ? candidateIssues
      : candidateIssues.filter((i) => i.category === filterCategory);

  // 카테고리별 그룹화 (선택된 이슈)
  const groupedSelected = {
    E: selectedIssues.filter((i) => i.category === 'E'),
    S: selectedIssues.filter((i) => i.category === 'S'),
    G: selectedIssues.filter((i) => i.category === 'G'),
  };

  // 이슈풀 저장
  const handleSave = async () => {
    if (selectedIssues.length === 0) {
      alert('최소 1개 이상의 이슈를 선택해주세요');
      return;
    }

    try {
      await api.confirmIssuePool(
        projectId,
        projectName,
        selectedIndustry,
        selectedIssues
      );
      alert('이슈풀이 저장되었습니다!');
    } catch (err) {
      alert('저장에 실패했습니다');
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      {/* 상단 액션 바 */}
      <div style={styles.actionBar}>
        <div>
          <h2 style={styles.pageTitle}>이슈풀 생성</h2>
          <p style={styles.pageSubtitle}>
            이슈 후보를 추가하고 설문에 사용할 이슈를 선택하세요
          </p>
        </div>
        <button onClick={handleSave} style={styles.buttonPrimary}>
          💾 저장
        </button>
      </div>

      {/* 메인 레이아웃: 좌우 분할 */}
      <div style={styles.mainLayout}>
        {/* 왼쪽: 이슈풀 후보 */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>이슈풀 후보</h3>
            <div style={styles.panelHeaderActions}>
              {/* 이슈 추가 버튼 */}
              <div style={styles.addMenuContainer}>
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  style={styles.buttonPrimary}
                >
                  + 이슈 추가
                </button>
                {showAddMenu && (
                  <div style={styles.addMenu}>
                    <button
                      onClick={() => {
                        setShowMediaModal(true);
                        setShowAddMenu(false);
                      }}
                      style={styles.addMenuItem}
                    >
                      📰 미디어 조사
                    </button>
                    <button
                      onClick={() => {
                        setShowManualModal(true);
                        setShowAddMenu(false);
                      }}
                      style={styles.addMenuItem}
                    >
                      ✏️ 직접 추가
                    </button>
                  </div>
                )}
              </div>

              {/* 카테고리 필터 */}
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
          </div>

          {/* 후보 이슈 목록 */}
          <div style={styles.issueList}>
            {filteredCandidates.length === 0 ? (
              <div style={styles.emptyState}>
                <p>이슈 후보가 없습니다</p>
                <p style={styles.emptyHint}>
                  위의 [+ 이슈 추가] 버튼을 눌러 이슈를 추가하세요
                </p>
              </div>
            ) : (
              filteredCandidates.map((issue) => (
                <div
                  key={issue.id}
                  style={styles.issueCard}
                  onClick={() => moveToSelected(issue)}
                >
                  <div style={styles.issueHeader}>
                    <strong style={styles.issueName}>{issue.이슈명}</strong>
                    <span style={styles.categoryBadge}>{issue.category}</span>
                  </div>
                  <p style={styles.issueDescription}>
                    {issue.이슈_정의 || issue.description}
                  </p>
                  <div style={styles.issueTags}>
                    {issue.is_human_rights && (
                      <span style={styles.tag}>인권 이슈</span>
                    )}
                    {issue.issb_kssb_recommended && (
                      <span style={styles.tag}>기후/환경</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 선택된 이슈풀 */}
        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>
              이슈풀 ({selectedIssues.length}개)
            </h3>
          </div>

          {/* 카테고리별 섹션 */}
          <div style={styles.selectedSections}>
            {['E', 'S', 'G'].map((category) => (
              <div key={category} style={styles.categorySection}>
                <h4 style={styles.categoryTitle}>
                  {category === 'E' ? '환경(E)' : category === 'S' ? '사회(S)' : '거버넌스(G)'}
                  <span style={styles.categoryCount}>
                    {groupedSelected[category].length}개
                  </span>
                </h4>
                {groupedSelected[category].length === 0 ? (
                  <p style={styles.emptyCategory}>선택된 이슈 없음</p>
                ) : (
                  groupedSelected[category].map((issue) => (
                    <div
                      key={issue.id}
                      style={styles.selectedIssueCard}
                      onClick={() => moveToCandidate(issue)}
                    >
                      <strong style={styles.selectedIssueName}>
                        {issue.이슈명}
                      </strong>
                      <button style={styles.removeButton}>−</button>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showMediaModal && (
        <div style={styles.modal} onClick={() => setShowMediaModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>미디어 조사</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!mediaForm.keyword.trim()) {
                  alert('키워드를 입력해주세요');
                  return;
                }

                setLoading(true);
                try {
                  const data = await api.recommendMediaIssues(
                    mediaForm.keyword,
                    mediaForm.period,
                    mediaForm.topN
                  );
                  const newIssues = data.recommendedIssues.map((issue) => ({
                    ...issue,
                    id: `media_${Date.now()}_${Math.random()}`,
                    source: 'media',
                    isCandidate: true,
                    // 이슈 데이터 매핑
                    이슈명: issue.이슈명,
                    이슈_정의: `언급 ${issue.실제_기사수}회 (부정 ${issue.부정_비율}%, 긍정 ${issue.긍정_비율}%)`,
                    category: issue.ESG_카테고리?.[0] || 'E',
                  }));
                  setCandidateIssues([...candidateIssues, ...newIssues]);
                  setShowMediaModal(false);
                  setMediaForm({ keyword: '', period: 'y1', topN: 10 });
                  alert(`${newIssues.length}개의 이슈가 추가되었습니다`);
                } catch (err) {
                  alert('미디어 분석에 실패했습니다');
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div style={styles.formGroup}>
                <label style={styles.label}>검색 키워드 *</label>
                <input
                  type="text"
                  value={mediaForm.keyword}
                  onChange={(e) =>
                    setMediaForm({ ...mediaForm, keyword: e.target.value })
                  }
                  placeholder="예: 삼성전자"
                  style={styles.input}
                  autoFocus
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>분석 기간</label>
                <select
                  value={mediaForm.period}
                  onChange={(e) =>
                    setMediaForm({ ...mediaForm, period: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="y1">최근 1년</option>
                  <option value="m6">최근 6개월</option>
                  <option value="m3">최근 3개월</option>
                  <option value="m1">최근 1개월</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>추천할 이슈 개수</label>
                <input
                  type="number"
                  value={mediaForm.topN}
                  onChange={(e) =>
                    setMediaForm({
                      ...mediaForm,
                      topN: parseInt(e.target.value) || 10,
                    })
                  }
                  min="1"
                  max="20"
                  style={styles.input}
                />
              </div>
              <div style={styles.modalButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaModal(false);
                    setMediaForm({ keyword: '', period: 'y1', topN: 10 });
                  }}
                  style={styles.buttonSecondary}
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={loading}
                >
                  {loading ? '분석 중...' : '분석 시작'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManualModal && (
        <div style={styles.modal} onClick={() => setShowManualModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>직접 추가</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!manualForm.이슈명.trim() || !manualForm.이슈_정의.trim()) {
                  alert('이슈명과 이슈 정의를 입력해주세요');
                  return;
                }

                setLoading(true);
                try {
                  const data = await api.createManualIssue(
                    manualForm.이슈명,
                    manualForm.이슈_정의,
                    manualForm.category,
                    manualForm.is_human_rights,
                    manualForm.issb_kssb_recommended,
                    projectId
                  );
                  const newIssue = {
                    ...data.issue,
                    id: `manual_${Date.now()}_${Math.random()}`,
                    source: 'manual',
                    isCandidate: true,
                  };
                  setCandidateIssues([...candidateIssues, newIssue]);
                  setShowManualModal(false);
                  setManualForm({
                    이슈명: '',
                    이슈_정의: '',
                    category: 'E',
                    is_human_rights: false,
                    issb_kssb_recommended: false,
                  });
                  alert('이슈가 추가되었습니다');
                } catch (err) {
                  alert('이슈 추가에 실패했습니다');
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div style={styles.formGroup}>
                <label style={styles.label}>이슈명 *</label>
                <input
                  type="text"
                  value={manualForm.이슈명}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, 이슈명: e.target.value })
                  }
                  placeholder="예: 제품 품질 관리"
                  style={styles.input}
                  autoFocus
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>이슈 정의 *</label>
                <textarea
                  value={manualForm.이슈_정의}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, 이슈_정의: e.target.value })
                  }
                  placeholder="이슈에 대한 설명을 입력하세요"
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>카테고리 *</label>
                <select
                  value={manualForm.category}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, category: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="E">환경 (E)</option>
                  <option value="S">사회 (S)</option>
                  <option value="G">거버넌스 (G)</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={manualForm.is_human_rights}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        is_human_rights: e.target.checked,
                      })
                    }
                    style={{ marginRight: '8px' }}
                  />
                  인권 이슈
                </label>
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={manualForm.issb_kssb_recommended}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        issb_kssb_recommended: e.target.checked,
                      })
                    }
                    style={{ marginRight: '8px' }}
                  />
                  기후/환경 관련 이슈 (ISSB/KSSB 권장)
                </label>
              </div>
              <div style={styles.modalButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualModal(false);
                    setManualForm({
                      이슈명: '',
                      이슈_정의: '',
                      category: 'E',
                      is_human_rights: false,
                      issb_kssb_recommended: false,
                    });
                  }}
                  style={styles.buttonSecondary}
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={loading}
                >
                  {loading ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#f5f5f5',
    minHeight: 'calc(100vh - 160px)',
  },
  actionBar: {
    backgroundColor: 'white',
    padding: '20px 24px',
    marginBottom: '20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#666',
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    height: 'calc(100vh - 300px)',
  },
  leftPanel: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  rightPanel: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  panelHeaderActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  addMenuContainer: {
    position: 'relative',
  },
  addMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    zIndex: 100,
    minWidth: '250px',
  },
  addMenuItem: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    textAlign: 'left',
    color: '#333',
    backgroundColor: 'white',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
  },
  filterSelect: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  issueList: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  issueCard: {
    padding: '16px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fafafa',
  },
  issueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  issueName: {
    fontSize: '15px',
    flex: 1,
  },
  categoryBadge: {
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '12px',
  },
  issueDescription: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  issueTags: {
    display: 'flex',
    gap: '6px',
  },
  tag: {
    fontSize: '11px',
    padding: '3px 8px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '4px',
  },
  selectedSections: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  categorySection: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  categoryTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  categoryCount: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#666',
  },
  emptyCategory: {
    fontSize: '13px',
    color: '#999',
    textAlign: 'center',
    padding: '20px',
  },
  selectedIssueCard: {
    padding: '12px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  selectedIssueName: {
    fontSize: '14px',
    flex: 1,
  },
  removeButton: {
    padding: '4px 10px',
    fontSize: '18px',
    color: '#dc3545',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
  },
  emptyHint: {
    fontSize: '12px',
    marginTop: '8px',
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
};

export default IssuePoolBuilderPage;
