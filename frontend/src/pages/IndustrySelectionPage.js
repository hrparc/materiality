/**
 * 산업군 선택 페이지
 *
 * SASB 산업군 선택 및 해당 산업의 핵심 이슈 조회
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import api from '../services/api';

const IndustrySelectionPage = () => {
  const navigate = useNavigate();
  const { setSelectedIndustry, setIndustryIssues, projectName } = useProject();

  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustryLocal] = useState('');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 산업군 목록 로드
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoading(true);
        const data = await api.getIndustries();
        setIndustries(data.sectors || []);
      } catch (err) {
        setError('산업군 목록을 불러오는데 실패했습니다');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  // 산업군 선택 시 이슈 조회
  const handleIndustryChange = async (e) => {
    const industry = e.target.value;
    setSelectedIndustryLocal(industry);
    setIssues([]);
    setError('');

    if (!industry) return;

    try {
      setLoading(true);
      const data = await api.getIndustryIssues(industry);
      setIssues(data.issues || []);
    } catch (err) {
      setError('이슈 목록을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로
  const handleNext = () => {
    if (!selectedIndustry) {
      alert('산업군을 선택해주세요');
      return;
    }
    setSelectedIndustry(selectedIndustry);
    setIndustryIssues(issues);
    navigate('/media');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>1단계: 산업군 기반 이슈 추천</h1>
        <p style={styles.subtitle}>프로젝트: {projectName || '이름 없음'}</p>
      </div>

      <div style={styles.content}>
        {/* 산업군 선택 */}
        <div style={styles.section}>
          <label style={styles.label}>산업군 선택</label>
          <select
            value={selectedIndustry}
            onChange={handleIndustryChange}
            style={styles.select}
            disabled={loading}
          >
            <option value="">-- 산업군을 선택하세요 --</option>
            {industries.map((industry, index) => (
              <option key={index} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* 에러 메시지 */}
        {error && <div style={styles.error}>{error}</div>}

        {/* 로딩 */}
        {loading && <div style={styles.loading}>로딩 중...</div>}

        {/* 이슈 목록 */}
        {issues.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              추천 이슈 ({issues.length}개)
            </h3>
            <div style={styles.issueList}>
              {issues.map((issue, index) => (
                <div key={index} style={styles.issueCard}>
                  <div style={styles.issueHeader}>
                    <strong style={styles.issueName}>{issue.이슈명}</strong>
                    <span style={styles.issueCategory}>
                      {issue.category || 'S'}
                    </span>
                  </div>
                  <p style={styles.issueDescription}>
                    {issue.이슈_정의 || issue.description}
                  </p>
                  <div style={styles.issueTags}>
                    {issue.is_human_rights && (
                      <span style={styles.tag}>인권 이슈</span>
                    )}
                    {issue.issb_kssb_recommended && (
                      <span style={styles.tag}>기후/환경 이슈</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div style={styles.navigation}>
          <button onClick={() => navigate('/')} style={styles.buttonSecondary}>
            이전
          </button>
          <button
            onClick={handleNext}
            style={styles.buttonPrimary}
            disabled={!selectedIndustry || issues.length === 0}
          >
            다음: 미디어 분석
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
    marginBottom: '30px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '16px',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  issueList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  issueTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tag: {
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

export default IndustrySelectionPage;
