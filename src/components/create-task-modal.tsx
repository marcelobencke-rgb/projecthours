'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { createTask } from '@/app/actions/tasks';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projects?: { id: string; name: string }[];
}

export default function CreateTaskModal({ isOpen, onClose, projectId, projects }: CreateTaskModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedProjectId('');
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(formData: FormData) {
    if (projectId) {
      formData.set('project_id', projectId);
    } else if (!formData.get('project_id')) {
      setError('Por favor, selecione um projeto.');
      return;
    }
    
    setError(null);

    startTransition(async () => {
      const result = await createTask(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale-in">
        <div className="modal-header">
          <h2 className="modal-title">Nova Tarefa</h2>
          <button type="button" onClick={onClose} className="btn btn-icon-sm btn-ghost">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={handleSubmit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}

            {!projectId && projects && (
              <div className="input-group" ref={dropdownRef}>
                <label className="input-label">Projeto</label>
                <input type="hidden" name="project_id" value={selectedProjectId} />
                
                <div style={{ position: 'relative' }}>
                  <button 
                    type="button" 
                    className="input" 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                  >
                    {selectedProjectId 
                      ? projects.find(p => p.id === selectedProjectId)?.name 
                      : <span style={{ color: 'var(--text-tertiary)' }}>Selecione um projeto</span>}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  {isDropdownOpen && (
                    <div 
                      className="animate-fade-in" 
                      style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        marginTop: '8px', 
                        zIndex: 50, 
                        maxHeight: '200px', 
                        overflowY: 'auto',
                        padding: 'var(--space-xs)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      {projects.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setSelectedProjectId(p.id); setIsDropdownOpen(false); setError(null); }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-sm)',
                            background: selectedProjectId === p.id ? 'var(--glass-bg-hover)' : 'transparent',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = selectedProjectId === p.id ? 'var(--glass-bg-hover)' : 'transparent'}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="task-name" className="input-label">Nome da tarefa</label>
              <input
                id="task-name"
                name="name"
                type="text"
                className="input"
                placeholder="Ex: Implementar tela de login"
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="task-desc" className="input-label">Descrição (opcional)</label>
              <textarea
                id="task-desc"
                name="description"
                className="input"
                placeholder="Descreva o que precisa ser feito..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Criando...
                </>
              ) : (
                'Criar tarefa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
