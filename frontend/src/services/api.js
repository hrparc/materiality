/**
 * API 서비스 레이어
 *
 * 모든 백엔드 API 호출을 중앙화하여 관리
 * 나중에 인증, 에러 핸들링, 로깅 등을 쉽게 추가할 수 있음
 */

import axios from 'axios';

// API 베이스 URL (환경 변수로 관리 가능)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
});

// 요청 인터셉터 (나중에 인증 토큰 추가 등)
apiClient.interceptors.request.use(
  (config) => {
    // 나중에 여기에 인증 토큰 추가 가능
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 핸들링)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 나중에 여기에 글로벌 에러 핸들링 추가 가능
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * API 서비스 객체
 */
const api = {
  // ============================================
  // 1. 산업군 관련 API
  // ============================================

  /**
   * 산업군 목록 조회
   */
  getIndustries: async () => {
    const response = await apiClient.get('/api/industries');
    return response.data;
  },

  /**
   * 특정 산업군의 이슈 추천
   */
  getIndustryIssues: async (industry) => {
    // industry 값을 URL path parameter로 전달
    const encodedIndustry = encodeURIComponent(industry);
    const response = await apiClient.get(`/api/industries/${encodedIndustry}/issues`);
    return response.data;
  },

  // ============================================
  // 2. 미디어 분석 관련 API
  // ============================================

  /**
   * 미디어 분석 실행 (뉴스 검색 및 ESG 이슈 추출)
   */
  analyzeMedia: async (keyword, maxResults = 20) => {
    const response = await apiClient.post('/api/media/analyze', {
      keyword,
      maxResults
    });
    return response.data;
  },

  /**
   * 미디어 기반 이슈 추천 (중복 제거 및 빈도 분석 포함)
   */
  recommendMediaIssues: async (keyword, period = 'y1', topN = 10) => {
    const response = await apiClient.post('/api/media/recommend-issues', {
      keyword,
      period,
      maxResults: 100, // 내부적으로 많이 수집
      topN,
      enableDeduplication: true
    });
    return response.data;
  },

  // ============================================
  // 3. 수동 이슈 입력 관련 API
  // ============================================

  /**
   * 수동 이슈 생성
   */
  createManualIssue: async (이슈명, 이슈_정의, category, is_human_rights, issb_kssb_recommended, projectId = 'default') => {
    const response = await apiClient.post('/api/issues/manual', {
      projectId,
      이슈명,
      이슈_정의,
      category,
      is_human_rights,
      issb_kssb_recommended
    });
    return response.data;
  },

  /**
   * 프로젝트의 수동 입력 이슈 목록 조회
   */
  getManualIssues: async (projectId) => {
    const response = await apiClient.get(`/api/issues/manual/${projectId}`);
    return response.data;
  },

  /**
   * 수동 이슈 수정
   */
  updateManualIssue: async (issueId, issueData) => {
    const response = await apiClient.put(`/api/issues/manual/${issueId}`, issueData);
    return response.data;
  },

  /**
   * 수동 이슈 삭제
   */
  deleteManualIssue: async (issueId) => {
    const response = await apiClient.delete(`/api/issues/manual/${issueId}`);
    return response.data;
  },

  // ============================================
  // 4. 이슈풀 통합 관련 API
  // ============================================

  /**
   * 통합 이슈풀 조회 (산업군 + 미디어 + 수동입력)
   */
  getIssuePool: async (projectId, params = {}) => {
    const response = await apiClient.get(`/api/issues/pool/${projectId}`, {
      params
    });
    return response.data;
  },

  /**
   * 이슈풀 확정 (사용자가 선택한 이슈들 저장)
   */
  confirmIssuePool: async (projectId, projectName, industry, selectedIssues) => {
    const response = await apiClient.post('/api/issues/pool/confirm', {
      projectId,
      projectName,
      industry,
      selectedIssues
    });
    return response.data;
  },

  /**
   * 확정된 이슈풀 조회
   */
  getConfirmedIssuePool: async (projectId) => {
    const response = await apiClient.get(`/api/issues/pool/${projectId}/confirmed`);
    return response.data;
  },

  /**
   * 이슈풀 삭제 (재설정)
   */
  deleteIssuePool: async (projectId) => {
    const response = await apiClient.delete(`/api/issues/pool/${projectId}`);
    return response.data;
  },

  // ============================================
  // 5. 헬스 체크
  // ============================================

  /**
   * 서버 상태 확인
   */
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default api;
