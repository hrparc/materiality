/**
 * 프로젝트 레이아웃
 *
 * 3단계 네비게이션 + 콘텐츠 영역
 * - 1단계: 이슈풀 생성
 * - 2단계: 설문조사
 * - 3단계: 중요이슈 선정
 */

import React from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';

const ProjectLayout = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();
  const { projectName } = useProject();

  // 현재 활성 탭 확인
  const currentPath = location.pathname.split('/').pop();

  const handleBack = () => {
    navigate('/');
  };

  const tabs = [
    { key: 'issues', label: '1. 이슈풀 생성', path: `/project/${projectId}/issues` },
    {
      key: 'survey',
      label: '2. 설문조사',
      path: `/project/${projectId}/survey`,
      disabled: true,
    },
    {
      key: 'results',
      label: '3. 중요이슈 선정',
      path: `/project/${projectId}/results`,
      disabled: true,
    },
  ];

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={handleBack} style={styles.backButton}>
            ← 프로젝트 목록
          </button>
          <div style={styles.projectInfo}>
            <h1 style={styles.projectName}>
              {projectName || '프로젝트'}
            </h1>
            <p style={styles.projectId}>ID: {projectId}</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 탭 */}
      <div style={styles.navigation}>
        <div style={styles.navContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && navigate(tab.path)}
              style={{
                ...styles.navTab,
                ...(currentPath === tab.key && styles.navTabActive),
                ...(tab.disabled && styles.navTabDisabled),
              }}
              disabled={tab.disabled}
            >
              {tab.label}
              {tab.disabled && <span style={styles.comingSoon}> (준비중)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div style={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
    padding: '16px 24px',
  },
  headerLeft: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#666',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  projectId: {
    fontSize: '12px',
    color: '#999',
  },
  navigation: {
    backgroundColor: 'white',
    borderBottom: '2px solid #e0e0e0',
    padding: '0 24px',
  },
  navContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    gap: '8px',
  },
  navTab: {
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navTabActive: {
    color: '#007bff',
    borderBottomColor: '#007bff',
  },
  navTabDisabled: {
    color: '#ccc',
    cursor: 'not-allowed',
  },
  comingSoon: {
    fontSize: '12px',
    fontWeight: 'normal',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
  },
};

export default ProjectLayout;
