'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Task } from '@/lib/types';

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  // Get time entries for each task
  const tasksWithTime = await Promise.all(
    (tasks || []).map(async (task) => {
      const { data: entries } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', task.id)
        .order('start_time', { ascending: false });

      const totalSeconds = (entries || []).reduce(
        (sum, e) => sum + (e.duration_seconds || 0),
        0
      );

      const activeEntry = (entries || []).find((e) => e.end_time === null) || null;

      return {
        ...task,
        total_seconds: totalSeconds,
        active_entry: activeEntry,
      } as Task;
    })
  );

  return tasksWithTime;
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const projectId = formData.get('project_id') as string;

  if (!name?.trim()) return { error: 'Nome é obrigatório' };
  if (!projectId) return { error: 'Projeto é obrigatório' };

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    project_id: projectId,
    name: name.trim(),
    description: description?.trim() || null,
    status: 'open',
  });

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTask(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const status = formData.get('status') as string;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name) updates.name = name.trim();
  if (description !== null) updates.description = description?.trim() || null;
  if (status) updates.status = status;

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  return { success: true };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  return { success: true };
}

export async function updateTaskStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  return { success: true };
}

export async function getAllTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (
        id,
        name,
        color
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all tasks:', error.message || error);
    return [];
  }

  // Get time entries for each task
  const tasksWithTime = await Promise.all(
    (tasks || []).map(async (task) => {
      const { data: entries } = await supabase
        .from('time_entries')
        .select('id, duration_seconds, end_time, start_time')
        .eq('task_id', task.id)
        .order('start_time', { ascending: false });

      const totalSeconds = (entries || []).reduce(
        (sum, e) => sum + (e.duration_seconds || 0),
        0
      );

      const activeEntry = (entries || []).find((e) => e.end_time === null) || null;

      const project = task.projects as unknown as { id: string; name: string; color: string };

      return {
        ...task,
        project: project ? {
          id: project.id,
          name: project.name,
          color: project.color,
        } : undefined,
        total_seconds: totalSeconds,
        active_entry: activeEntry,
      } as Task;
    })
  );

  return tasksWithTime;
}
