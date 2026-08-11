export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields (from joins)
  total_seconds?: number;
  task_count?: number;
  active_timer?: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'done';
  created_at: string;
  updated_at: string;
  // Computed fields
  total_seconds?: number;
  active_entry?: TimeEntry | null;
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  created_at: string;
  // Joined fields
  task?: Task;
  project?: Project;
}

export interface DailyReport {
  date: string;
  total_seconds: number;
  entries: TimeEntry[];
  projects: {
    project: Project;
    total_seconds: number;
    tasks: {
      task: Task;
      total_seconds: number;
      entries: TimeEntry[];
    }[];
  }[];
}

export interface WeeklyReport {
  start_date: string;
  end_date: string;
  total_seconds: number;
  daily_totals: { date: string; total_seconds: number }[];
  project_totals: { project: Project; total_seconds: number }[];
}

export type TimerState = 'idle' | 'running' | 'paused';

export interface SidebarTimerState {
  isActive: boolean;
  entry_id: string;
  task_id: string;
  task_name: string;
  project_name: string;
  project_color: string;
  start_time: string;
  elapsed_seconds: number;
}
