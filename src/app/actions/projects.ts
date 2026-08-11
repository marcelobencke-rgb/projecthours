'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Project } from '@/lib/types';

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  // Get task counts and total time for each project
  const projectsWithStats = await Promise.all(
    (data || []).map(async (project) => {
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);

      const { data: entries } = await supabase
        .from('time_entries')
        .select('duration_seconds, task_id, end_time')
        .in(
          'task_id',
          (
            await supabase
              .from('tasks')
              .select('id')
              .eq('project_id', project.id)
          ).data?.map((t) => t.id) || []
        );

      const totalSeconds = (entries || []).reduce(
        (sum, e) => sum + (e.duration_seconds || 0),
        0
      );

      const hasActiveTimer = (entries || []).some((e) => e.end_time === null);

      return {
        ...project,
        task_count: taskCount || 0,
        total_seconds: totalSeconds,
        active_timer: hasActiveTimer,
      } as Project;
    })
  );

  return projectsWithStats;
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data as Project;
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const color = (formData.get('color') as string) || '#6366f1';

  if (!name?.trim()) return { error: 'Nome é obrigatório' };

  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    name: name.trim(),
    description: description?.trim() || null,
    color,
  });

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  return { success: true };
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const color = (formData.get('color') as string) || '#6366f1';

  const { error } = await supabase
    .from('projects')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/projects');
  return { success: true };
}
