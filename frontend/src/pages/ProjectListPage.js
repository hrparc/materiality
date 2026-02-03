/**
 * 프로젝트 관리 페이지 (첫 화면)
 *
 * - 프로젝트 목록 조회
 * - 새 프로젝트 생성 (산업군 선택 포함)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import api from '../services/api';

const ProjectListPage = () => {
  const navigate = useNavigate();
  const { setProjectId, setProjectName, setSelectedIndustry } = useProject();

  // 프로젝트 목록 (localStorage에서 로드)
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('esg_projects');
    return saved ? JSON.parse(saved) : [];
  });

  // 새 프로젝트 생성 폼
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '', // 상위 섹터 (예: 헬스케어)
    industry: '', // 하위 섹터 (예: [헬스케어] 의료장비 및 용품)
  });
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);

  // 산업군 목록 로드
  React.useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const data = await api.getIndustries();
        // API 응답: { industries: [{name, category, issueCount}, ...] }
        setIndustries(data.industries || []);
      } catch (err) {
        console.error('산업군 목록 로딩 실패:', err);
      }
    };
    fetchIndustries();
  }, []);

  // 상위 섹터 목록 (중복 제거)
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(industries.map((ind) => ind.category))];
    return uniqueCategories.sort();
  }, [industries]);

  // 선택된 상위 섹터에 속하는 하위 섹터 목록
  const subIndustries = React.useMemo(() => {
    if (!formData.category) return [];
    return industries.filter((ind) => ind.category === formData.category);
  }, [industries, formData.category]);

  // 상위 섹터 변경 시 하위 섹터 초기화
  const handleCategoryChange = (e) => {
    setFormData({
      ...formData,
      category: e.target.value,
      industry: '', // 하위 섹터 초기화
    });
  };

  // 프로젝트 생성
  const handleCreateProject = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.industry) {
      alert('프로젝트명과 산업군을 입력해주세요');
      return;
    }

    // 프로젝트 생성 (나중에 API 연동)
    const newProject = {
      id: `project-${Date.now()}`,
      name: formData.name,
      industry: formData.industry,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    localStorage.setItem('esg_projects', JSON.stringify(updatedProjects));
    setShowCreateForm(false);
    setFormData({ name: '', category: '', industry: '' });

    // Context에 프로젝트 정보 저장
    setProjectId(newProject.id);
    setProjectName(newProject.name);
    setSelectedIndustry(newProject.industry);

    // 프로젝트로 이동
    navigate(`/project/${newProject.id}/issues`);
  };

  // 프로젝트 클릭
  const handleProjectClick = (project) => {
    // Context에 프로젝트 정보 저장
    setProjectId(project.id);
    setProjectName(project.name);
    setSelectedIndustry(project.industry);

    navigate(`/project/${project.id}/issues`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ESG 이중 중대성 평가 시스템</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          style={styles.buttonPrimary}
        >
          + 새 프로젝트
        </button>
      </div>

      <div style={styles.content}>
        {/* 프로젝트 생성 폼 */}
        {showCreateForm && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>새 프로젝트 생성</h2>
              <form onSubmit={handleCreateProject}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>프로젝트명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 2024 ESG 중대성 평가"
                    style={styles.input}
                    autoFocus
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>산업군 선택 *</label>
                  <div style={styles.selectRow}>
                    <select
                      value={formData.category}
                      onChange={handleCategoryChange}
                      style={styles.selectHalf}
                    >
                      <option value="">-- 상위 섹터 --</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.industry}
                      onChange={(e) =>
                        setFormData({ ...formData, industry: e.target.value })
                      }
                      style={styles.selectHalf}
                      disabled={!formData.category}
                    >
                      <option value="">
                        {formData.category
                          ? '-- 세부 산업군 --'
                          : '-- 상위 섹터를 먼저 선택하세요 --'}
                      </option>
                      {subIndustries.map((industry, index) => {
                        // 대괄호 제거: "[헬스케어] 의료장비" -> "의료장비"
                        const displayName = industry.name.replace(/^\[.*?\]\s*/, '');
                        return (
                          <option key={index} value={industry.name}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <p style={styles.hint}>
                    선택한 산업군의 SASB 기준 이슈가 기본으로 추가됩니다
                  </p>
                </div>

                <div style={styles.modalButtons}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ name: '', category: '', industry: '' });
                    }}
                    style={styles.buttonSecondary}
                  >
                    취소
                  </button>
                  <button type="submit" style={styles.buttonPrimary}>
                    프로젝트 생성
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 프로젝트 목록 */}
        <div style={styles.projectList}>
          {projects.length === 0 ? (
            <div style={styles.emptyState}>
              <h3 style={styles.emptyTitle}>프로젝트가 없습니다</h3>
              <p style={styles.emptyText}>
                새 프로젝트를 생성하여 ESG 중대성 평가를 시작하세요
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                style={styles.buttonPrimary}
              >
                + 첫 프로젝트 만들기
              </button>
            </div>
          ) : (
            <div style={styles.projectGrid}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={styles.projectCard}
                  onClick={() => handleProjectClick(project)}
                >
                  <h3 style={styles.projectName}>{project.name}</h3>
                  <p style={styles.projectIndustry}>{project.industry}</p>
                  <p style={styles.projectDate}>생성일: {project.createdAt}</p>
                </div>
              ))}
            </div>
          )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  projectList: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    minHeight: '400px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  projectCard: {
    padding: '24px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fafafa',
  },
  projectName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  projectIndustry: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  projectDate: {
    fontSize: '12px',
    color: '#999',
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
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
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
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  selectRow: {
    display: 'flex',
    gap: '12px',
  },
  selectHalf: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
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

export default ProjectListPage;
