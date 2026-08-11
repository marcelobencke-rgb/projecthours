'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { signOut } from '@/app/actions/auth';
import { startTimer, stopTimer } from '@/app/actions/time-entries';
import { getUserProfile } from '@/app/actions/profiles';
import { formatDuration, getElapsedSeconds } from '@/lib/utils';
import type { SidebarTimerState, Profile } from '@/lib/types';
import SettingsModal from './settings-modal';

interface SidebarProps {
  userEmail: string;
  initialTimerState: SidebarTimerState | null;
}

function calculateWorkSeconds(startTime: Date, endTime: Date, workHours: any[]): number {
  if (!workHours || workHours.length === 0) {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }
  let totalSeconds = 0;
  const current = new Date(startTime);
  current.setHours(0, 0, 0, 0);
  const endDay = new Date(endTime);
  endDay.setHours(0, 0, 0, 0);

  while (current <= endDay) {
    const isStartDay = current.getTime() === new Date(startTime).setHours(0,0,0,0);
    const isEndDay = current.getTime() === new Date(endTime).setHours(0,0,0,0);
    
    for (const wh of workHours) {
      const [startH, startM] = wh.start.split(':').map(Number);
      const [endH, endM] = wh.end.split(':').map(Number);
      
      const whStart = new Date(current);
      whStart.setHours(startH, startM, 0, 0);
      const whEnd = new Date(current);
      whEnd.setHours(endH, endM, 0, 0);
      
      const actualStart = (isStartDay && startTime > whStart) ? startTime : whStart;
      const actualEnd = (isEndDay && endTime < whEnd) ? endTime : whEnd;
      
      if (actualStart < actualEnd) {
        totalSeconds += Math.floor((actualEnd.getTime() - actualStart.getTime()) / 1000);
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return totalSeconds;
}

export default function Sidebar({ userEmail, initialTimerState }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timerState, setTimerState] = useState<SidebarTimerState | null>(initialTimerState);
  const [elapsed, setElapsed] = useState(initialTimerState?.elapsed_seconds || 0);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

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

  useEffect(() => {
    getUserProfile().then(p => {
      if (p) setProfile(p);
    });
  }, []);

  function handleToggleTimer() {
    if (!timerState) return;
    
    startTransition(async () => {
      if (timerState.isActive) {
        let excludeNonWorkTime = false;
        
        if (profile && profile.work_hours && profile.work_hours.length > 0) {
          const start = new Date(timerState.start_time!);
          const end = new Date();
          const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
          const workSeconds = calculateWorkSeconds(start, end, profile.work_hours);
          
          if (workSeconds < totalSeconds - 60) {
            const confirm = window.confirm('Este período inclui horas fora do seu horário de trabalho. Deseja contabilizar essas horas extras no projeto? (Clique Cancelar para descartar as horas extras)');
            excludeNonWorkTime = !confirm;
          }
        }

        await stopTimer(timerState.entry_id, { excludeNonWorkTime });
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

  const userInitial = profile?.name ? profile.name.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase();

  return (
    <>
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
          <div className="sidebar-user" onClick={() => setIsSettingsOpen(true)} style={{ cursor: 'pointer' }} title="Configurações">
            <div className="sidebar-user-avatar" style={profile?.avatar_url ? { background: 'transparent' } : {}}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                userInitial
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.name || userEmail.split('@')[0]}</div>
              <div className="sidebar-user-email">{userEmail}</div>
            </div>
            <form action={signOut} onClick={(e) => e.stopPropagation()}>
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

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        userEmail={userEmail} 
      />
    </>
  );
}
