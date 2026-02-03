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

  // 이슈풀 후보 (왼쪽)
  const [candidateIssues, setCandidateIssues] = useState([]);

  // 선택된 이슈풀 (오른쪽)
  const [selectedIssues, setSelectedIssues] = useState([]);

  // UI 상태
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');

  // 산업군 이슈 추가
  const handleAddIndustryIssues = async () => {
    if (!selectedIndustry) {
      alert('프로젝트 생성 시 산업군을 선택해야 합니다');
      return;
    }

    try {
      const data = await api.getIndustryIssues(selectedIndustry);
      const newIssues = data.issues.map((issue) => ({
        ...issue,
        id: `industry_${Date.now()}_${Math.random()}`,
        source: 'industry',
        isCandidate: true,
      }));
      setCandidateIssues([...candidateIssues, ...newIssues]);
      setShowIndustryModal(false);
      setShowAddMenu(false);
    } catch (err) {
      alert('산업군 이슈를 불러오는데 실패했습니다');
      console.error(err);
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
                        setShowIndustryModal(true);
                        setShowAddMenu(false);
                      }}
                      style={styles.addMenuItem}
                    >
                      🏭 온실가스 배출 (산업군 기반)
                    </button>
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
      {showIndustryModal && (
        <div style={styles.modal} onClick={() => setShowIndustryModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>산업군 기반 이슈 추가</h3>
            <p>선택한 산업군: {selectedIndustry || '없음'}</p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowIndustryModal(false)}
                style={styles.buttonSecondary}
              >
                취소
              </button>
              <button
                onClick={handleAddIndustryIssues}
                style={styles.buttonPrimary}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {showMediaModal && (
        <div style={styles.modal} onClick={() => setShowMediaModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>미디어 조사 (준비중)</h3>
            <p>미디어 분석 기능은 곧 추가될 예정입니다</p>
            <button
              onClick={() => setShowMediaModal(false)}
              style={styles.buttonSecondary}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showManualModal && (
        <div style={styles.modal} onClick={() => setShowManualModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>직접 추가 (준비중)</h3>
            <p>수동 이슈 입력 기능은 곧 추가될 예정입니다</p>
            <button
              onClick={() => setShowManualModal(false)}
              style={styles.buttonSecondary}
            >
              닫기
            </button>
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
};

export default IssuePoolBuilderPage;
