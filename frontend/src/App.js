/**
 * 메인 App 컴포넌트
 *
 * 라우팅 및 전역 상태 관리 설정
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';

// Pages
import HomePage from './pages/HomePage';
import IndustrySelectionPage from './pages/IndustrySelectionPage';
import MediaAnalysisPage from './pages/MediaAnalysisPage';
import ManualIssuePage from './pages/ManualIssuePage';
import IssuePoolPage from './pages/IssuePoolPage';

// 기본 스타일 (나중에 CSS 파일로 분리 가능)
import './App.css';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* 홈 페이지 */}
            <Route path="/" element={<HomePage />} />

            {/* Phase 1: 이슈풀 구축 */}
            <Route path="/industry" element={<IndustrySelectionPage />} />
            <Route path="/media" element={<MediaAnalysisPage />} />
            <Route path="/manual" element={<ManualIssuePage />} />
            <Route path="/issue-pool" element={<IssuePoolPage />} />

            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ProjectProvider>
  );
}

export default App;
