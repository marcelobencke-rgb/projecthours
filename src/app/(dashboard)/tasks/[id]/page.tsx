import { notFound } from 'next/navigation';
import { getTaskWithEntries } from '@/app/actions/tasks';
import TaskDetailClient from './task-detail-client';

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  
  // No server side fetch sem filtros (pegamos todos, ou apenas os do mês)
  // Como o client vai poder filtrar, passamos os dados iniciais.
  const task = await getTaskWithEntries(id);

  if (!task) notFound();

  return (
    <TaskDetailClient initialTask={task} />
  );
}
