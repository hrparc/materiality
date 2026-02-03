/**
 * 미디어 분석 페이지
 *
 * 키워드 기반 뉴스 분석 및 ESG 이슈 추출
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import api from '../services/api';

const MediaAnalysisPage = () => {
  const navigate = useNavigate();
  const { projectName, setMediaIssues } = useProject();

  const [keyword, setKeyword] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // 미디어 분석 실행
  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      alert('키워드를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setAnalysisComplete(false);

      const data = await api.analyzeMedia(keyword, maxResults);
      setIssues(data.extractedIssues || []);
      setAnalysisComplete(true);
    } catch (err) {
      setError('미디어 분석에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로
  const handleNext = () => {
    setMediaIssues(issues);
    navigate('/manual');
  };

  // 건너뛰기
  const handleSkip = () => {
    setMediaIssues([]);
    navigate('/manual');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>2단계: 미디어 분석 기반 이슈 추천</h1>
        <p style={styles.subtitle}>프로젝트: {projectName || '이름 없음'}</p>
      </div>

      <div style={styles.content}>
        {/* 키워드 입력 폼 */}
        <div style={styles.section}>
          <form onSubmit={handleAnalyze}>
            <div style={styles.formGroup}>
              <label style={styles.label}>검색 키워드</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 회사명, 업종명, 산업명 등"
                style={styles.input}
                disabled={loading}
              />
              <p style={styles.hint}>
                최근 1년간 뉴스를 분석하여 ESG 관련 이슈를 추출합니다
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>분석할 기사 수</label>
              <input
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                min="10"
                max="100"
                style={styles.input}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              style={styles.buttonPrimary}
              disabled={loading || !keyword.trim()}
            >
              {loading ? '분석 중...' : '분석 시작'}
            </button>
          </form>
        </div>

        {/* 에러 메시지 */}
        {error && <div style={styles.error}>{error}</div>}

        {/* 로딩 상태 */}
        {loading && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>뉴스 기사를 분석하고 있습니다...</p>
            <p style={styles.loadingSubtext}>
              최대 1-2분 정도 소요될 수 있습니다
            </p>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisComplete && issues.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              추출된 이슈 ({issues.length}개)
            </h3>
            <div style={styles.issueList}>
              {issues.map((issue, index) => (
                <div key={index} style={styles.issueCard}>
                  <div style={styles.issueHeader}>
                    <strong style={styles.issueName}>{issue.issue}</strong>
                    <span style={styles.issueCategory}>{issue.category}</span>
                  </div>
                  <p style={styles.issueDescription}>{issue.description}</p>
                  <div style={styles.issueMetadata}>
                    <span style={styles.metadata}>
                      관련도: {issue.relevance_score}%
                    </span>
                    <span style={styles.metadata}>
                      감정: {issue.sentiment}
                    </span>
                    <span style={styles.metadata}>
                      빈도: {issue.frequency}회
                    </span>
                  </div>
                  {issue.related_articles && issue.related_articles.length > 0 && (
                    <div style={styles.articles}>
                      <p style={styles.articlesTitle}>관련 기사:</p>
                      {issue.related_articles.slice(0, 2).map((article, idx) => (
                        <a
                          key={idx}
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.articleLink}
                        >
                          {article.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisComplete && issues.length === 0 && (
          <div style={styles.noResults}>
            해당 키워드로 ESG 이슈를 찾을 수 없습니다. 다른 키워드로 시도해보세요.
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div style={styles.navigation}>
          <button onClick={() => navigate('/industry')} style={styles.buttonSecondary}>
            이전
          </button>
          <div style={styles.buttonGroup}>
            <button onClick={handleSkip} style={styles.buttonSecondary}>
              건너뛰기
            </button>
            <button
              onClick={handleNext}
              style={styles.buttonPrimary}
              disabled={!analysisComplete}
            >
              다음: 수동 이슈 입력
            </button>
          </div>
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
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
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
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '12px',
  },
  issueDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  issueMetadata: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  metadata: {
    fontSize: '12px',
    color: '#666',
    padding: '4px 8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
  },
  articles: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #ddd',
  },
  articlesTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  articleLink: {
    display: 'block',
    fontSize: '12px',
    color: '#007bff',
    textDecoration: 'none',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loadingText: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  loadingSubtext: {
    fontSize: '14px',
    color: '#666',
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666',
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
  buttonGroup: {
    display: 'flex',
    gap: '12px',
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

export default MediaAnalysisPage;
