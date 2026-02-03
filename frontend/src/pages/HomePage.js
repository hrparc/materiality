/**
 * 홈 페이지
 *
 * 프로젝트 시작점 - 프로젝트명 입력 및 워크플로우 안내
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { initializeProject } = useProject();
  const [projectName, setProjectName] = useState('');

  const handleStart = (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('프로젝트명을 입력해주세요');
      return;
    }
    initializeProject(projectName, '');
    navigate('/industry');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>ESG 이중 중대성 평가 시스템</h1>
        <p style={styles.subtitle}>
          중요 이슈를 식별하고 이해관계자 의견을 수렴하여
          <br />
          체계적인 ESG 중대성 평가를 수행하세요
        </p>

        <form onSubmit={handleStart} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>프로젝트명</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="예: 2024 ESG 중대성 평가"
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            시작하기
          </button>
        </form>

        <div style={styles.steps}>
          <h3 style={styles.stepsTitle}>진행 단계</h3>
          <div style={styles.stepList}>
            <div style={styles.step}>
              <span style={styles.stepNumber}>1</span>
              <div>
                <strong>산업군 선택</strong>
                <p>SASB 기반 산업별 핵심 이슈 추천</p>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>2</span>
              <div>
                <strong>미디어 분석</strong>
                <p>뉴스 기사 분석을 통한 이슈 도출</p>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>3</span>
              <div>
                <strong>수동 이슈 입력</strong>
                <p>직접 이슈 추가 및 관리</p>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>4</span>
              <div>
                <strong>이슈풀 확정</strong>
                <p>통합 이슈풀에서 최종 이슈 선택</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 기본 스타일 (나중에 CSS Modules나 styled-components로 변경 가능)
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  content: {
    maxWidth: '800px',
    width: '100%',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '40px',
    lineHeight: '1.6',
  },
  form: {
    marginBottom: '40px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  steps: {
    marginTop: '40px',
    paddingTop: '40px',
    borderTop: '1px solid #eee',
  },
  stepsTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  stepNumber: {
    display: 'inline-block',
    width: '32px',
    height: '32px',
    lineHeight: '32px',
    textAlign: 'center',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '50%',
    fontWeight: 'bold',
    flexShrink: 0,
  },
};

export default HomePage;
