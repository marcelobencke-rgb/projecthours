'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, Project } from '@/lib/types';
import TimerButton from '@/components/timer-button';
import CreateTaskModal from '@/components/create-task-modal';
import { deleteTask, updateTaskStatus } from '@/app/actions/tasks';
import { deleteProject } from '@/app/actions/projects';
import { formatDurationHuman, parseDate } from '@/lib/utils';
import Link from 'next/link';

interface ProjectDetailClientProps {
  project: Project;
  tasks: Task[];
  totalSeconds: number;
}

export default function ProjectDetailClient({ project, tasks, totalSeconds }: ProjectDetailClientProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'done'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const router = useRouter();

  function toggleExpandTask(taskId: string) {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  const filteredTasks = activeTab === 'all'
    ? tasks
    : tasks.filter((t) => t.status === activeTab);

  const taskCounts = {
    all: tasks.length,
    open: tasks.filter((t) => t.status === 'open').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  function handleDeleteTask(taskId: string) {
    setTaskToDelete(taskId);
  }

  function confirmDeleteTask() {
    if (!taskToDelete) return;
    startTransition(async () => {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
      router.refresh();
    });
  }

  function handleDeleteProject() {
    startTransition(async () => {
      await deleteProject(project.id);
      router.push('/projects');
    });
  }

  function handleStatusChange(taskId: string, newStatus: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus);
      router.refresh();
    });
  }

  return (
    <>
      <header className="main-header">
        <div className="main-header-left">
          <Link href="/projects" className="btn btn-icon btn-ghost" style={{ marginRight: 'var(--space-sm)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: project.color,
              flexShrink: 0,
            }}
          />
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && (
              <p className="page-subtitle">{project.description}</p>
            )}
          </div>
        </div>
        <div className="main-header-right">
          <span className="badge badge-neutral" style={{ fontSize: 'var(--font-sm)', padding: '4px 12px' }}>
            {formatDurationHuman(totalSeconds)} total
          </span>
          <button onClick={() => setShowTaskModal(true)} className="btn btn-primary" id="create-task-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova tarefa
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-icon btn-ghost"
            title="Excluir projeto"
            style={{ color: 'var(--danger)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Tabs */}
        <div className="tabs">
          {(['all', 'open', 'in_progress', 'done'] as const).map((tab) => {
            const labels = { all: 'Todas', open: 'Abertas', in_progress: 'Em andamento', done: 'Concluídas' };
            return (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {labels[tab]} ({taskCounts[tab]})
              </button>
            );
          })}
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3 className="empty-state-title">
              {activeTab === 'all' ? 'Nenhuma tarefa ainda' : 'Nenhuma tarefa nesta categoria'}
            </h3>
            <p className="empty-state-desc">
              {activeTab === 'all'
                ? 'Crie sua primeira tarefa para começar a rastrear o tempo.'
                : 'Mova tarefas para esta categoria ou crie uma nova.'}
            </p>
            {activeTab === 'all' && (
              <button onClick={() => setShowTaskModal(true)} className="btn btn-primary btn-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Criar tarefa
              </button>
            )}
          </div>
        ) : (
          <div className="glass-card task-list stagger-children" style={{ overflow: 'hidden' }}>
            {filteredTasks.map((task) => {
              const isExpanded = !!expandedTasks[task.id];
              return (
                <div key={task.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="task-row" style={{ borderBottom: 'none' }}>
                    <div className={`task-row-status ${task.status}`} />
                    <div className="task-row-info">
                      <div className="task-row-name">{task.name}</div>
                      {task.description && (
                        <div className="task-row-meta">{task.description}</div>
                      )}
                    </div>

                    <select
                      className="input"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      style={{
                        width: 'auto',
                        padding: '4px 28px 4px 8px',
                        fontSize: 'var(--font-xs)',
                        background: 'var(--bg-tertiary)',
                      }}
                    >
                      <option value="open">Aberta</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="done">Concluída</option>
                    </select>

                    <TimerButton
                      taskId={task.id}
                      activeEntryId={task.active_entry?.id || null}
                      activeStartTime={task.active_entry?.start_time || null}
                      totalSeconds={task.total_seconds || 0}
                      onTimerChange={() => router.refresh()}
                    />

                    <button
                      onClick={() => toggleExpandTask(task.id)}
                      className="btn btn-icon-sm btn-ghost"
                      title={isExpanded ? "Ocultar lançamentos" : "Ver lançamentos"}
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {isExpanded ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn btn-icon-sm btn-ghost"
                      title="Excluir tarefa"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '1rem', paddingLeft: '3rem', background: 'var(--bg-tertiary)', fontSize: '0.85rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Histórico de Lançamentos</h4>
                      {(!task.entries || task.entries.length === 0) ? (
                        <p style={{ color: 'var(--text-tertiary)' }}>Nenhum lançamento de tempo registrado para esta tarefa.</p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                                <th style={{ padding: '0.5rem', fontWeight: '500' }}>Data</th>
                                <th style={{ padding: '0.5rem', fontWeight: '500' }}>Início</th>
                                <th style={{ padding: '0.5rem', fontWeight: '500' }}>Fim</th>
                                <th style={{ padding: '0.5rem', fontWeight: '500', textAlign: 'right' }}>Duração</th>
                              </tr>
                            </thead>
                            <tbody>
                              {task.entries.slice(0, 5).map((entry: any) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                  <td style={{ padding: '0.5rem' }}>{parseDate(entry.start_time).toLocaleDateString('pt-BR')}</td>
                                  <td style={{ padding: '0.5rem' }}>{parseDate(entry.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                                  <td style={{ padding: '0.5rem' }}>
                                    {entry.end_time ? parseDate(entry.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (
                                      <span style={{ color: 'var(--warning)', fontSize: '0.75rem', fontWeight: '500' }}>Em andamento</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                    {formatDurationHuman(entry.duration_seconds || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                            <Link href={`/tasks/${task.id}`} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                              Ver histórico completo {task.entries.length > 5 ? `(${task.entries.length})` : ''}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          router.refresh();
        }}
        projectId={project.id}
      />

      {/* Delete task confirmation */}
      {taskToDelete && (
        <div className="modal-overlay" onClick={() => setTaskToDelete(null)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Excluir tarefa</h2>
            </div>
            <div className="modal-body">
              <p className="confirm-dialog-message">
                Tem certeza que deseja excluir esta tarefa? Todos os registros de tempo serão perdidos. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setTaskToDelete(null)} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={confirmDeleteTask} className="btn btn-danger" disabled={isPending}>
                {isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete project confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Excluir projeto</h2>
            </div>
            <div className="modal-body">
              <p className="confirm-dialog-message">
                Tem certeza que deseja excluir o projeto <strong>{project.name}</strong>? Todas as tarefas e registros de tempo serão perdidos. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={handleDeleteProject} className="btn btn-danger" disabled={isPending}>
                {isPending ? 'Excluindo...' : 'Excluir projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
