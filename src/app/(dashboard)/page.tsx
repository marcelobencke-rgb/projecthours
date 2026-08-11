import { getDashboardStats, getTodayEntries } from '@/app/actions/time-entries';
import { getProjects } from '@/app/actions/projects';
import { formatDuration, formatDurationHuman, formatTime } from '@/lib/utils';
import Link from 'next/link';

export default async function DashboardPage() {
  const [stats, todayEntries, projects] = await Promise.all([
    getDashboardStats(),
    getTodayEntries(),
    getProjects(),
  ]);

  const recentProjects = projects.slice(0, 4);

  return (
    <>
      <header className="main-header">
        <div className="main-header-left">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral do seu dia</p>
          </div>
        </div>
      </header>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid stagger-children" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="glass-card stat-card stat-accent">
            <div className="stat-card-icon">⏱</div>
            <div className="stat-card-label">Horas hoje</div>
            <div className="stat-card-value">{formatDuration(stats.todaySeconds)}</div>
          </div>

          <div className="glass-card stat-card stat-success">
            <div className="stat-card-icon">📊</div>
            <div className="stat-card-label">Horas na semana</div>
            <div className="stat-card-value">{formatDurationHuman(stats.weekSeconds)}</div>
          </div>

          <div className="glass-card stat-card stat-warning">
            <div className="stat-card-icon">📁</div>
            <div className="stat-card-label">Projetos ativos</div>
            <div className="stat-card-value">{stats.activeProjects}</div>
          </div>

          <div className="glass-card stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="stat-card-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>✓</div>
            <div className="stat-card-label">Total de tarefas</div>
            <div className="stat-card-value">{stats.totalTasks}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
          {/* Recent Projects */}
          <div>
            <div className="section-header">
              <h2 className="section-title">Projetos recentes</h2>
              <Link href="/projects" className="btn btn-ghost btn-sm">
                Ver todos →
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-2xl)', marginBottom: 'var(--space-sm)' }}>📁</div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>
                  Nenhum projeto ainda. Crie seu primeiro projeto!
                </p>
                <Link href="/projects" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }}>
                  Criar projeto
                </Link>
              </div>
            ) : (
              <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="glass-card"
                    style={{ padding: 'var(--space-md) var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: project.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 'var(--font-sm)' }}>{project.name}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                        {project.task_count} tarefa{project.task_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                      {formatDurationHuman(project.total_seconds || 0)}
                    </div>
                    {project.active_timer && (
                      <span className="badge badge-success">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        Ativo
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Today's Activity */}
          <div>
            <div className="section-header">
              <h2 className="section-title">Atividade de hoje</h2>
              <span className="badge badge-neutral">{todayEntries.length} entradas</span>
            </div>

            {todayEntries.length === 0 ? (
              <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-2xl)', marginBottom: 'var(--space-sm)' }}>🕐</div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>
                  Nenhum registro hoje. Inicie um timer!
                </p>
              </div>
            ) : (
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div className="timeline" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                  {todayEntries.slice(0, 8).map((entry) => {
                    const task = entry.task as unknown as { name: string };
                    const project = entry.project as unknown as { name: string; color: string };
                    return (
                      <div key={entry.id} className="timeline-item">
                        <div
                          className="timeline-dot"
                          style={{ backgroundColor: project?.color || 'var(--accent)' }}
                        />
                        <div className="timeline-content">
                          <div className="timeline-content-header">
                            <span>{task?.name || 'Tarefa'}</span>
                            {!entry.end_time && (
                              <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                Em andamento
                              </span>
                            )}
                          </div>
                          <div className="timeline-content-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                            {project?.name && (
                              <span
                                className="badge"
                                style={{
                                  background: `${project.color}22`,
                                  color: project.color,
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  lineHeight: '1'
                                }}
                              >
                                {project.name}
                              </span>
                            )}
                            <span style={{ color: 'var(--text-tertiary)' }}>
                              {formatTime(entry.start_time)}
                              {entry.end_time && ` – ${formatTime(entry.end_time)}`}
                              {entry.duration_seconds > 0 && ` · ${formatDurationHuman(entry.duration_seconds)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
