'use client';

import { useState, useTransition, useEffect, Fragment } from 'react';
import { getReportData } from '@/app/actions/time-entries';
import { formatDuration, formatDurationHuman } from '@/lib/utils';

interface ReportData {
  entries: unknown[];
  totalSeconds: number;
  projectBreakdown: {
    id: string;
    name: string;
    color: string;
    totalSeconds: number;
    tasks: { id: string; name: string; date: string; totalSeconds: number }[];
  }[];
  dailyBreakdown: { date: string; totalSeconds: number }[];
}

export default function ReportsClient() {
  const [isPending, startTransition] = useTransition();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });

  function loadReport() {
    startTransition(async () => {
      const [sYear, sMonth, sDay] = dateRange.start.split('-').map(Number);
      const startDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);

      const [eYear, eMonth, eDay] = dateRange.end.split('-').map(Number);
      const endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

      const data = await getReportData(startDate.toISOString(), endDate.toISOString());
      setReportData(data as ReportData);
    });
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setQuickRange(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  }

  function exportCSV() {
    if (!reportData) return;

    const rows = [['Projeto', 'Tarefa', 'Data', 'Horas']];
    for (const project of reportData.projectBreakdown) {
      for (const task of project.tasks) {
        rows.push([project.name, task.name, task.date, formatDuration(task.totalSeconds)]);
      }
    }
    rows.push(['', 'TOTAL', '', formatDuration(reportData.totalSeconds)]);

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxDailySeconds = reportData
    ? Math.max(...reportData.dailyBreakdown.map((d) => d.totalSeconds), 1)
    : 1;

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <>
      <header className="main-header">
        <div className="main-header-left">
          <div>
            <h1 className="page-title">Relatórios</h1>
            <p className="page-subtitle">Análise detalhada do seu tempo</p>
          </div>
        </div>
      </header>

      <div className="page-content">
        {/* Filters */}
        <div className="report-filter-bar">
          <div className="report-date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            />
            <span style={{ color: 'var(--text-tertiary)' }}>até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button onClick={() => setQuickRange(7)} className="btn btn-secondary btn-sm">7 dias</button>
            <button onClick={() => setQuickRange(14)} className="btn btn-secondary btn-sm">14 dias</button>
            <button onClick={() => setQuickRange(30)} className="btn btn-secondary btn-sm">30 dias</button>
          </div>

          <button onClick={loadReport} className="btn btn-primary btn-sm" disabled={isPending}>
            {isPending ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Carregando...
              </>
            ) : (
              'Gerar relatório'
            )}
          </button>

          {reportData && (
            <button onClick={exportCSV} className="btn btn-secondary btn-sm report-export-btn" id="export-csv-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar CSV
            </button>
          )}
        </div>

        {reportData && (
          <div className="animate-fade-in">
            {/* Total Summary */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="glass-card stat-card stat-accent">
                <div className="stat-card-icon">⏱</div>
                <div className="stat-card-label">Total no período</div>
                <div className="stat-card-value">{formatDuration(reportData.totalSeconds)}</div>
              </div>

              <div className="glass-card stat-card stat-success">
                <div className="stat-card-icon">📊</div>
                <div className="stat-card-label">Projetos ativos</div>
                <div className="stat-card-value">{reportData.projectBreakdown.length}</div>
              </div>

              <div className="glass-card stat-card stat-warning">
                <div className="stat-card-icon">📅</div>
                <div className="stat-card-label">Média diária</div>
                <div className="stat-card-value">
                  {reportData.dailyBreakdown.length > 0
                    ? formatDurationHuman(Math.round(reportData.totalSeconds / reportData.dailyBreakdown.length))
                    : '0m'}
                </div>
              </div>
            </div>

            {/* Daily Chart */}
            {reportData.dailyBreakdown.length > 0 && (
              <div className="report-section">
                <h3 className="report-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 16V8" />
                    <path d="M11 16V11" />
                    <path d="M15 16V14" />
                    <path d="M19 16V9" />
                  </svg>
                  Horas por dia
                </h3>
                <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
                  <div className="report-bar-chart">
                    {reportData.dailyBreakdown.map((day) => {
                      const date = new Date(day.date + 'T12:00:00');
                      const height = Math.max((day.totalSeconds / maxDailySeconds) * 100, 3);
                      return (
                        <div key={day.date} className="report-bar">
                          <div className="report-bar-value">
                            {formatDurationHuman(day.totalSeconds)}
                          </div>
                          <div
                            className="report-bar-fill"
                            style={{ height: `${height}%` }}
                          />
                          <div className="report-bar-label">
                            {dayNames[date.getDay()]}
                            <br />
                            {date.getDate()}/{date.getMonth() + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Project Breakdown */}
            {reportData.projectBreakdown.length > 0 && (
              <div className="report-section">
                <h3 className="report-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-6H4a2 2 0 0 0-2 2v16Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Detalhamento por projeto
                </h3>
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Projeto / Tarefa</th>
                        <th style={{ textAlign: 'right' }}>Tempo</th>
                        <th style={{ textAlign: 'right', width: 100 }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.projectBreakdown.map((project) => (
                        <Fragment key={project.id}>
                          <tr>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
                                <strong>{project.name}</strong>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                              {formatDuration(project.totalSeconds)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
                              {reportData.totalSeconds > 0
                                ? `${Math.round((project.totalSeconds / reportData.totalSeconds) * 100)}%`
                                : '0%'}
                            </td>
                          </tr>
                          {project.tasks.map((task) => (
                            <tr key={task.id}>
                              <td style={{ paddingLeft: 'var(--space-xl)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{task.name}</span>
                                  <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: '10px', padding: '1px 6px', fontWeight: 500 }}>
                                    {task.date}
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                                {formatDuration(task.totalSeconds)}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
                                {project.totalSeconds > 0
                                  ? `${Math.round((task.totalSeconds / project.totalSeconds) * 100)}%`
                                  : '0%'}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                      <tr style={{ borderTop: '2px solid var(--border)' }}>
                        <td><strong>Total</strong></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {formatDuration(reportData.totalSeconds)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.projectBreakdown.length === 0 && reportData.dailyBreakdown.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3 className="empty-state-title">Sem dados no período</h3>
                <p className="empty-state-desc">
                  Não há registros de tempo para o período selecionado. Tente selecionar um período diferente.
                </p>
              </div>
            )}
          </div>
        )}

        {!reportData && !isPending && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3 className="empty-state-title">Gerar relatório</h3>
            <p className="empty-state-desc">
              Selecione o período desejado e clique em &quot;Gerar relatório&quot; para ver seus dados.
            </p>
          </div>
        )}

        {isPending && !reportData && (
          <div className="loading-page">
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}
      </div>
    </>
  );
}
