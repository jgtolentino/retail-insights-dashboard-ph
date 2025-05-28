import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';

export function AppShell() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}