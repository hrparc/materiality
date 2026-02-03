/**
 * 수동 이슈 입력 페이지
 *
 * 사용자가 직접 이슈를 추가/수정/삭제
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import api from '../services/api';

const ManualIssuePage = () => {
  const navigate = useNavigate();
  const { projectId, projectName, setManualIssues } = useProject();

  const [issues, setIssues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 폼 데이터
  const [formData, setFormData] = useState({
    이슈명: '',
    이슈_정의: '',
    category: 'S',
    is_human_rights: false,
    issb_kssb_recommended: false,
  });

  // 기존 이슈 로드
  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const data = await api.getManualIssues(projectId);
      setIssues(data.issues || []);
    } catch (err) {
      console.error('이슈 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 이슈 추가/수정
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.이슈명.trim() || !formData.이슈_정의.trim()) {
      alert('이슈명과 설명을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (editingIssue) {
        // 수정
        await api.updateManualIssue(editingIssue.id, formData);
      } else {
        // 추가
        await api.createManualIssue(projectId, formData);
      }

      // 목록 새로고침
      await fetchIssues();

      // 폼 초기화
      setFormData({
        이슈명: '',
        이슈_정의: '',
        category: 'S',
        is_human_rights: false,
        issb_kssb_recommended: false,
      });
      setShowForm(false);
      setEditingIssue(null);
    } catch (err) {
      setError('이슈 저장에 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 이슈 수정 버튼
  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setFormData({
      이슈명: issue.이슈명,
      이슈_정의: issue.이슈_정의,
      category: issue.category,
      is_human_rights: issue.is_human_rights,
      issb_kssb_recommended: issue.issb_kssb_recommended,
    });
    setShowForm(true);
  };

  // 이슈 삭제
  const handleDelete = async (issueId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      await api.deleteManualIssue(issueId);
      await fetchIssues();
    } catch (err) {
      alert('삭제에 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 폼 취소
  const handleCancel = () => {
    setShowForm(false);
    setEditingIssue(null);
    setFormData({
      이슈명: '',
      이슈_정의: '',
      category: 'S',
      is_human_rights: false,
      issb_kssb_recommended: false,
    });
  };

  // 다음 단계로
  const handleNext = () => {
    setManualIssues(issues);
    navigate('/issue-pool');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>3단계: 수동 이슈 입력</h1>
        <p style={styles.subtitle}>프로젝트: {projectName || '이름 없음'}</p>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}

        {/* 이슈 추가 버튼 */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={styles.buttonPrimary}
            disabled={loading}
          >
            + 이슈 추가
          </button>
        )}

        {/* 이슈 입력 폼 */}
        {showForm && (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>
              {editingIssue ? '이슈 수정' : '새 이슈 추가'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>이슈명 *</label>
                <input
                  type="text"
                  name="이슈명"
                  value={formData.이슈명}
                  onChange={handleInputChange}
                  placeholder="예: 협력사 ESG 평가"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>이슈 정의 *</label>
                <textarea
                  name="이슈_정의"
                  value={formData.이슈_정의}
                  onChange={handleInputChange}
                  placeholder="이슈에 대한 설명을 입력하세요"
                  style={styles.textarea}
                  rows="4"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>카테고리</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="E">환경 (E)</option>
                  <option value="S">사회 (S)</option>
                  <option value="G">거버넌스 (G)</option>
                </select>
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_human_rights"
                    checked={formData.is_human_rights}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <span>인권 관련 이슈</span>
                </label>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="issb_kssb_recommended"
                    checked={formData.issb_kssb_recommended}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <span>기후/환경 이슈 (ISSB/KSSB)</span>
                </label>
              </div>

              <div style={styles.formButtons}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={styles.buttonSecondary}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 이슈 목록 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            입력한 이슈 ({issues.length}개)
          </h3>

          {loading && !showForm && (
            <div style={styles.loading}>로딩 중...</div>
          )}

          {!loading && issues.length === 0 && (
            <div style={styles.noData}>
              아직 입력한 이슈가 없습니다. 위의 버튼을 눌러 이슈를 추가하세요.
            </div>
          )}

          {issues.length > 0 && (
            <div style={styles.issueList}>
              {issues.map((issue) => (
                <div key={issue.id} style={styles.issueCard}>
                  <div style={styles.issueHeader}>
                    <strong style={styles.issueName}>{issue.이슈명}</strong>
                    <span style={styles.issueCategory}>{issue.category}</span>
                  </div>
                  <p style={styles.issueDescription}>{issue.이슈_정의}</p>
                  <div style={styles.issueTags}>
                    {issue.is_human_rights && (
                      <span style={styles.tag}>인권 이슈</span>
                    )}
                    {issue.issb_kssb_recommended && (
                      <span style={styles.tag}>기후/환경 이슈</span>
                    )}
                    <span style={styles.sourceTag}>직접 입력</span>
                  </div>
                  <div style={styles.issueActions}>
                    <button
                      onClick={() => handleEdit(issue)}
                      style={styles.actionButton}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(issue.id)}
                      style={{ ...styles.actionButton, color: '#dc3545' }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <div style={styles.navigation}>
          <button onClick={() => navigate('/media')} style={styles.buttonSecondary}>
            이전
          </button>
          <button onClick={handleNext} style={styles.buttonPrimary}>
            다음: 이슈풀 확정
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
  section: {
    marginTop: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  formBox: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginBottom: '30px',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
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
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  issueList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
  },
  issueCard: {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fafafa',
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
  issueTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  tag: {
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '4px',
  },
  sourceTag: {
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: '4px',
  },
  issueActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
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

export default ManualIssuePage;
