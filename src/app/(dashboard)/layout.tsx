import { redirect } from 'next/navigation';
import { getUser } from '@/app/actions/auth';
import { getSidebarTimerState } from '@/app/actions/time-entries';
import Sidebar from '@/components/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  const timerState = await getSidebarTimerState();

  return (
    <div className="dashboard-layout">
      <Sidebar
        userEmail={user.email || ''}
        initialTimerState={timerState}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
