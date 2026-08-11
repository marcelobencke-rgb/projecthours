import { notFound } from 'next/navigation';
import { getProject } from '@/app/actions/projects';
import { getTasksByProject } from '@/app/actions/tasks';
import ProjectDetailClient from './project-detail-client';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  const tasks = await getTasksByProject(id);

  const totalSeconds = tasks.reduce(
    (sum, task) => sum + (task.total_seconds || 0),
    0
  );

  return (
    <ProjectDetailClient
      project={project}
      tasks={tasks}
      totalSeconds={totalSeconds}
    />
  );
}
