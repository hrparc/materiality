/**
 * 메인 App 컴포넌트
 *
 * 새로운 구조:
 * / - 프로젝트 관리 페이지
 * /project/:projectId - 프로젝트 내부 (3단계 네비게이션)
 *   ├─ /project/:projectId/issues - 1단계: 이슈풀 생성
 *   ├─ /project/:projectId/survey - 2단계: 설문조사 (나중에)
 *   └─ /project/:projectId/results - 3단계: 중요이슈 선정 (나중에)
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';

// Pages
import ProjectListPage from './pages/ProjectListPage';
import ProjectLayout from './components/ProjectLayout';
import IssuePoolBuilderPage from './pages/IssuePoolBuilderPage';

// 기본 스타일
import './App.css';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* 프로젝트 관리 페이지 */}
            <Route path="/" element={<ProjectListPage />} />

            {/* 프로젝트 내부 - 레이아웃 + 3단계 네비게이션 */}
            <Route path="/project/:projectId" element={<ProjectLayout />}>
              {/* 1단계: 이슈풀 생성 */}
              <Route path="issues" element={<IssuePoolBuilderPage />} />

              {/* 2단계: 설문조사 (나중에 구현) */}
              <Route path="survey" element={<div>설문조사 (준비중)</div>} />

              {/* 3단계: 중요이슈 선정 (나중에 구현) */}
              <Route path="results" element={<div>중요이슈 선정 (준비중)</div>} />

              {/* 프로젝트 진입 시 기본 페이지 */}
              <Route index element={<Navigate to="issues" replace />} />
            </Route>

            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ProjectProvider>
  );
}

export default App;
