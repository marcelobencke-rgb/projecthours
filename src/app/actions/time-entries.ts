'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { TimeEntry } from '@/lib/types';

export async function startTimer(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // Check if there's already an active timer for this user
  const { data: activeEntries } = await supabase
    .from('time_entries')
    .select('id, task_id')
    .eq('user_id', user.id)
    .is('end_time', null);

  if (activeEntries && activeEntries.length > 0) {
    // Stop the currently active timer first
    const now = new Date().toISOString();
    for (const entry of activeEntries) {
      const startTime = (
        await supabase
          .from('time_entries')
          .select('start_time')
          .eq('id', entry.id)
          .single()
      ).data?.start_time;

      if (startTime) {
        const duration = Math.floor(
          (new Date(now).getTime() - new Date(startTime).getTime()) / 1000
        );
        await supabase
          .from('time_entries')
          .update({
            end_time: now,
            duration_seconds: duration,
          })
          .eq('id', entry.id);
      }
    }
  }

  // Update task status to in_progress
  await supabase
    .from('tasks')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', taskId);

  // Create new time entry
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      task_id: taskId,
      user_id: user.id,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  return { success: true, entry: data };
}

import { getUserProfile } from './profiles';

function calculateWorkSeconds(startTime: Date, endTime: Date, workHours: {start: string, end: string}[]): number {
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

export async function stopTimer(entryId: string, options?: { excludeNonWorkTime?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // Get the entry
  const { data: entry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single();

  if (!entry) return { error: 'Entrada não encontrada' };

  const now = new Date().toISOString();
  let duration = Math.floor(
    (new Date(now).getTime() - new Date(entry.start_time).getTime()) / 1000
  );

  if (options?.excludeNonWorkTime) {
    const profile = await getUserProfile();
    if (profile && profile.work_hours) {
      duration = calculateWorkSeconds(new Date(entry.start_time), new Date(now), profile.work_hours);
    }
  }

  const { error } = await supabase
    .from('time_entries')
    .update({
      end_time: now,
      duration_seconds: duration,
    })
    .eq('id', entryId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  return { success: true, duration };
}

export async function getSidebarTimerState(): Promise<{
  isActive: boolean;
  entry_id: string;
  task_id: string;
  task_name: string;
  project_name: string;
  project_color: string;
  start_time: string;
  elapsed_seconds: number;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: entry } = await supabase
    .from('time_entries')
    .select(`
      id,
      task_id,
      start_time,
      end_time,
      tasks (
        name,
        project_id,
        projects (
          name,
          color
        )
      )
    `)
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  if (!entry) return null;

  const task = entry.tasks as unknown as { name: string; project_id: string; projects: { name: string; color: string } };
  const isActive = entry.end_time === null;

  return {
    isActive,
    entry_id: entry.id,
    task_id: entry.task_id,
    task_name: task?.name || 'Tarefa',
    project_name: task?.projects?.name || 'Projeto',
    project_color: task?.projects?.color || '#6366f1',
    start_time: entry.start_time,
    elapsed_seconds: isActive ? Math.floor(
      (Date.now() - new Date(entry.start_time).getTime()) / 1000
    ) : 0,
  };
}

export async function getTodayEntries(): Promise<TimeEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      tasks (
        name,
        project_id,
        projects (
          name,
          color
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('start_time', startOfDay.toISOString())
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching today entries:', error.message || error);
    return [];
  }

  return (data || []).map((entry) => {
    const task = entry.tasks as unknown as { name: string; project_id: string; projects: { name: string; color: string } };
    return {
      ...entry,
      task: {
        id: entry.task_id,
        name: task?.name || 'Tarefa',
        project_id: task?.project_id || '',
      },
      project: {
        name: task?.projects?.name || 'Projeto',
        color: task?.projects?.color || '#6366f1',
      },
    } as unknown as TimeEntry;
  });
}

export async function getReportData(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { entries: [], totalSeconds: 0, projectBreakdown: [], dailyBreakdown: [] };

  const { data: entries, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      tasks (
        id,
        name,
        project_id,
        projects (
          id,
          name,
          color
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching report data:', error.message || error);
    return { entries: [], totalSeconds: 0, projectBreakdown: [], dailyBreakdown: [] };
  }

  const totalSeconds = (entries || []).reduce(
    (sum, e) => sum + (e.duration_seconds || 0),
    0
  );

  // Group by project
  const projectMap = new Map<string, { name: string; color: string; totalSeconds: number; tasks: Map<string, { name: string; date: string; totalSeconds: number }> }>();
  
  for (const entry of entries || []) {
    const task = entry.tasks as unknown as { id: string; name: string; project_id: string; projects: { id: string; name: string; color: string } };
    const projectId = task?.projects?.id || 'unknown';
    const projectName = task?.projects?.name || 'Sem projeto';
    const projectColor = task?.projects?.color || '#6366f1';
    const taskId = task?.id || 'unknown';
    const taskName = task?.name || 'Sem tarefa';
    const dateStr = new Date(entry.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, { name: projectName, color: projectColor, totalSeconds: 0, tasks: new Map() });
    }

    const project = projectMap.get(projectId)!;
    project.totalSeconds += entry.duration_seconds || 0;

    const taskDateKey = `${taskId}_${dateStr}`;
    if (!project.tasks.has(taskDateKey)) {
      project.tasks.set(taskDateKey, { name: taskName, date: dateStr, totalSeconds: 0 });
    }
    project.tasks.get(taskDateKey)!.totalSeconds += entry.duration_seconds || 0;
  }

  const projectBreakdown = Array.from(projectMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    color: data.color,
    totalSeconds: data.totalSeconds,
    tasks: Array.from(data.tasks.entries()).map(([taskDateKey, taskData]) => ({
      id: taskDateKey,
      name: taskData.name,
      date: taskData.date,
      totalSeconds: taskData.totalSeconds,
    })),
  }));

  // Group by day
  const dayMap = new Map<string, number>();
  for (const entry of entries || []) {
    const day = new Date(entry.start_time).toISOString().split('T')[0];
    dayMap.set(day, (dayMap.get(day) || 0) + (entry.duration_seconds || 0));
  }

  const dailyBreakdown = Array.from(dayMap.entries())
    .map(([date, seconds]) => ({ date, totalSeconds: seconds }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { entries, totalSeconds, projectBreakdown, dailyBreakdown };
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { todaySeconds: 0, weekSeconds: 0, activeProjects: 0, totalTasks: 0 };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Today's time
  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds')
    .eq('user_id', user.id)
    .gte('start_time', startOfDay.toISOString())
    .not('end_time', 'is', null);

  const todaySeconds = (todayEntries || []).reduce(
    (sum, e) => sum + (e.duration_seconds || 0),
    0
  );

  // Week's time
  const { data: weekEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds')
    .eq('user_id', user.id)
    .gte('start_time', startOfWeek.toISOString())
    .not('end_time', 'is', null);

  const weekSeconds = (weekEntries || []).reduce(
    (sum, e) => sum + (e.duration_seconds || 0),
    0
  );

  // Active projects count
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_archived', false);

  // Total tasks count
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return {
    todaySeconds,
    weekSeconds,
    activeProjects: activeProjects || 0,
    totalTasks: totalTasks || 0,
  };
}
