'use client';

import { useState } from 'react';
import { formatDurationHuman } from '@/lib/utils';
import type { Project } from '@/lib/types';
import CreateProjectModal from '@/components/create-project-modal';
import Link from 'next/link';

interface ProjectsClientProps {
  projects: Project[];
}

export default function ProjectsClient({ projects }: ProjectsClientProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="main-header">
        <div className="main-header-left">
          <div>
            <h1 className="page-title">Projetos</h1>
            <p className="page-subtitle">{projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="main-header-right">
          <button onClick={() => setShowModal(true)} className="btn btn-primary" id="create-project-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo projeto
          </button>
        </div>
      </header>

      <div className="page-content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-state-title">Nenhum projeto ainda</h3>
            <p className="empty-state-desc">
              Crie seu primeiro projeto para começar a rastrear o tempo das suas tarefas.
            </p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Criar projeto
            </button>
          </div>
        ) : (
          <div className="projects-grid stagger-children">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="glass-card project-card"
                style={{ '--project-color': project.color } as React.CSSProperties}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: project.color,
                }} />

                <div className="project-card-header">
                  <div
                    className="project-card-icon"
                    style={{ background: project.color }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  {project.active_timer && (
                    <span className="badge badge-success">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      Timer ativo
                    </span>
                  )}
                </div>

                <div className="project-card-name">{project.name}</div>
                {project.description && (
                  <div className="project-card-desc">{project.description}</div>
                )}

                <div className="project-card-stats">
                  <div className="project-card-stat">
                    <span className="project-card-stat-label">Tarefas</span>
                    <span className="project-card-stat-value">{project.task_count || 0}</span>
                  </div>
                  <div className="project-card-stat">
                    <span className="project-card-stat-label">Tempo total</span>
                    <span className="project-card-stat-value">
                      {formatDurationHuman(project.total_seconds || 0)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
