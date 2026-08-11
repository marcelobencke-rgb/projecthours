'use client';

import { useState, useTransition } from 'react';
import { createProject } from '@/app/actions/projects';
import { PROJECT_COLORS } from '@/lib/utils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  if (!isOpen) return null;

  function handleSubmit(formData: FormData) {
    formData.set('color', selectedColor);
    setError(null);

    startTransition(async () => {
      const result = await createProject(formData);
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
          <h2 className="modal-title">Novo Projeto</h2>
          <button onClick={onClose} className="btn btn-icon-sm btn-ghost">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={handleSubmit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}

            <div className="input-group">
              <label htmlFor="project-name" className="input-label">Nome do projeto</label>
              <input
                id="project-name"
                name="name"
                type="text"
                className="input"
                placeholder="Ex: Redesign do App"
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="project-desc" className="input-label">Descrição (opcional)</label>
              <textarea
                id="project-desc"
                name="description"
                className="input"
                placeholder="Descreva brevemente o projeto..."
                rows={3}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Cor do projeto</label>
              <div className="color-picker">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color, color }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
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
                'Criar projeto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
