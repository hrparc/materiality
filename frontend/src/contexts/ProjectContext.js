/**
 * 프로젝트 전역 상태 관리 Context
 *
 * 프로젝트 정보, 선택한 산업군, 이슈풀 등을 전역적으로 관리
 * 나중에 Redux나 Zustand로 변경 가능
 */

import React, { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  // 프로젝트 기본 정보
  const [projectId, setProjectId] = useState('default-project-id');
  const [projectName, setProjectName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  // 1단계: 이슈 수집 상태
  const [industryIssues, setIndustryIssues] = useState([]);
  const [mediaIssues, setMediaIssues] = useState([]);
  const [manualIssues, setManualIssues] = useState([]);

  // 통합 이슈풀
  const [issuePool, setIssuePool] = useState([]);
  const [selectedIssues, setSelectedIssues] = useState([]);

  // 진행 상태
  const [currentStep, setCurrentStep] = useState(1); // 1: 이슈수집, 2: 설문조사, 3: 결과분석

  // 프로젝트 초기화
  const initializeProject = (name, industry) => {
    setProjectName(name);
    setSelectedIndustry(industry);
    setCurrentStep(1);
  };

  // 이슈 선택/해제 토글
  const toggleIssueSelection = (issueId) => {
    setIssuePool((prevPool) =>
      prevPool.map((issue) =>
        issue.id === issueId
          ? { ...issue, isSelected: !issue.isSelected }
          : issue
      )
    );
  };

  // 선택된 이슈 목록 가져오기
  const getSelectedIssues = () => {
    return issuePool.filter((issue) => issue.isSelected);
  };

  // 전체 선택/해제
  const toggleAllIssues = (selectAll) => {
    setIssuePool((prevPool) =>
      prevPool.map((issue) => ({ ...issue, isSelected: selectAll }))
    );
  };

  // Context value
  const value = {
    // 프로젝트 정보
    projectId,
    projectName,
    selectedIndustry,
    setProjectId,
    setProjectName,
    setSelectedIndustry,

    // 이슈 데이터
    industryIssues,
    mediaIssues,
    manualIssues,
    issuePool,
    selectedIssues,
    setIndustryIssues,
    setMediaIssues,
    setManualIssues,
    setIssuePool,
    setSelectedIssues,

    // 진행 상태
    currentStep,
    setCurrentStep,

    // 헬퍼 함수
    initializeProject,
    toggleIssueSelection,
    getSelectedIssues,
    toggleAllIssues,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
