import { getAllTasks } from '@/app/actions/tasks';
import { getProjects } from '@/app/actions/projects';
import TasksClient from './tasks-client';

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    getAllTasks(),
    getProjects()
  ]);

  return <TasksClient tasks={tasks} projects={projects} />;
}
