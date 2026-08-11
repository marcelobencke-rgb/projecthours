'use client';

import { useState, useTransition } from 'react';
import type { Task } from '@/lib/types';
import Link from 'next/link';
import { formatDurationHuman, parseDate, formatDate, formatTime } from '@/lib/utils';
import { getTaskWithEntries } from '@/app/actions/tasks';

interface TaskDetailClientProps {
  initialTask: Task;
}

export default function TaskDetailClient({ initialTask }: TaskDetailClientProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [isPending, startTransition] = useTransition();

  const handleFilter = () => {
    startTransition(async () => {
      const start = startDate ? `${startDate}T00:00:00.000Z` : undefined;
      const end = endDate ? `${endDate}T23:59:59.999Z` : undefined;
      
      const updatedTask = await getTaskWithEntries(task.id, start, end);
      if (updatedTask) {
        setTask(updatedTask);
        setVisibleCount(50); // Reset pagination on filter
      }
    });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    startTransition(async () => {
      const updatedTask = await getTaskWithEntries(task.id);
      if (updatedTask) {
        setTask(updatedTask);
        setVisibleCount(50);
      }
    });
  };

  const visibleEntries = task.entries?.slice(0, visibleCount) || [];
  const hasMore = (task.entries?.length || 0) > visibleCount;

  return (
    <>
      <header className="main-header">
        <div className="main-header-left">
          <Link href="/tasks" className="btn btn-icon btn-ghost" style={{ marginRight: 'var(--space-sm)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className="page-title">{task.name}</h1>
              <div className={`task-row-status ${task.status}`} style={{ position: 'relative', left: 0, transform: 'none' }} />
            </div>
            <p className="page-subtitle">
              Projeto: {task.project?.name || 'Sem projeto'}
            </p>
          </div>
        </div>
        <div className="main-header-right">
          <div className="badge badge-neutral" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            Total: {formatDurationHuman(task.total_seconds || 0)}
          </div>
        </div>
      </header>

      <div className="page-content">
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Filtros</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
              <label className="label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Data Inicial</label>
              <input 
                type="date" 
                className="input" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
              <label className="label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Data Final</label>
              <input 
                type="date" 
                className="input" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '2px' }}>
              <button onClick={handleFilter} disabled={isPending} className="btn btn-primary" style={{ whiteSpace: 'nowrap', height: '42px' }}>
                {isPending ? 'Filtrando...' : 'Aplicar Filtros'}
              </button>
              {(startDate || endDate) && (
                <button onClick={handleClearFilters} disabled={isPending} className="btn btn-ghost" style={{ whiteSpace: 'nowrap', height: '42px' }}>
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Histórico Completo de Lançamentos</h2>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              {task.entries?.length || 0} registro(s) encontrado(s)
            </span>
          </div>

          {(!task.entries || task.entries.length === 0) ? (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <div className="empty-state-icon">⏳</div>
              <h3 className="empty-state-title">Nenhum lançamento</h3>
              <p className="empty-state-desc">
                Nenhum tempo foi registrado para esta tarefa no período selecionado.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Data</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Início</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Fim</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'right' }}>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.map((entry: any) => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{formatDate(entry.start_time)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{formatTime(entry.start_time)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {entry.end_time ? formatTime(entry.end_time) : (
                          <span style={{ color: 'var(--warning)', fontSize: '0.75rem', fontWeight: '500' }}>Em andamento</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {formatDurationHuman(entry.duration_seconds || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', paddingBottom: '0.5rem' }}>
                  <button onClick={() => setVisibleCount(prev => prev + 50)} className="btn btn-outline">
                    Carregar mais registros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
