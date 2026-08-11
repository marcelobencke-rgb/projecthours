'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { signOut } from '@/app/actions/auth';
import { startTimer, stopTimer } from '@/app/actions/time-entries';
import { formatDuration, getElapsedSeconds } from '@/lib/utils';
import type { SidebarTimerState } from '@/lib/types';

interface SidebarProps {
  userEmail: string;
  initialTimerState: SidebarTimerState | null;
}

export default function Sidebar({ userEmail, initialTimerState }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timerState, setTimerState] = useState<SidebarTimerState | null>(initialTimerState);
  const [elapsed, setElapsed] = useState(initialTimerState?.elapsed_seconds || 0);

  useEffect(() => {
    setTimerState(initialTimerState);
    if (initialTimerState) {
      if (initialTimerState.isActive && initialTimerState.start_time) {
        setElapsed(getElapsedSeconds(initialTimerState.start_time));
      } else {
        setElapsed(initialTimerState.elapsed_seconds || 0);
      }
    }
  }, [initialTimerState]);

  useEffect(() => {
    if (!timerState?.isActive || !timerState.start_time) return;

    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(timerState.start_time!));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState]);

  function handleToggleTimer() {
    if (!timerState) return;
    
    startTransition(async () => {
      if (timerState.isActive) {
        await stopTimer(timerState.entry_id);
      } else {
        await startTimer(timerState.task_id);
      }
      router.refresh();
    });
  }

  const navLinks = [
    {
      href: '/',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      href: '/projects',
      label: 'Projetos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16Z" />
          <path d="M14 2v6h6" />
        </svg>
      ),
    },
    {
      href: '/tasks',
      label: 'Tarefas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      href: '/reports',
      label: 'Relatórios',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
    },
  ];

  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⏱</div>
          <span className="sidebar-logo-text">Project Hours</span>
        </div>
      </div>

      {timerState && (
        <div 
          className={`sidebar-active-timer ${!timerState.isActive ? 'inactive' : ''}`} 
          style={!timerState.isActive ? { borderColor: 'var(--border)' } : undefined}
          title={timerState.project_name ? `Projeto: ${timerState.project_name}` : ''}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span 
                className="sidebar-active-timer-dot" 
                style={!timerState.isActive ? { background: 'var(--text-tertiary)', animation: 'none' } : {}} 
              />
              <span className="sidebar-active-timer-label" style={!timerState.isActive ? { color: 'var(--text-tertiary)' } : undefined}>
                {timerState.isActive ? 'Timer ativo' : 'Última tarefa'}
              </span>
            </div>
            <button
              onClick={handleToggleTimer}
              disabled={isPending}
              className="btn btn-icon-sm btn-ghost"
              style={{ 
                color: timerState.isActive ? 'var(--warning)' : 'var(--success)',
                opacity: isPending ? 0.5 : 1
              }}
              title={timerState.isActive ? 'Pausar timer' : 'Iniciar timer'}
            >
              {timerState.isActive ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
          </div>
          <div className="sidebar-active-timer-task" style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-xs)',
            ...(!timerState.isActive ? { color: 'var(--text-secondary)' } : {})
          }}>
            <span>{timerState.task_name}</span>
            {timerState.project_name && (
              <span
                className="badge"
                style={{
                  background: `${timerState.project_color}22`,
                  color: timerState.project_color,
                  fontSize: '11px',
                  padding: '2px 6px',
                  lineHeight: '1'
                }}
              >
                {timerState.project_name}
              </span>
            )}
          </div>
          {timerState.isActive && (
            <div className="sidebar-active-timer-time">{formatDuration(elapsed)}</div>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menu</div>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userEmail.split('@')[0]}</div>
            <div className="sidebar-user-email">{userEmail}</div>
          </div>
          <form action={signOut}>
            <button type="submit" className="btn btn-icon-sm btn-ghost" title="Sair">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
