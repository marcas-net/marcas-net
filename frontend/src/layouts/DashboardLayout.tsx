import { Outlet } from 'react-router-dom';
import { TopNavbar } from '../components/TopNavbar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <TopNavbar />

      {/* Main content — below top navbar, above mobile bottom nav */}
      <main className="pt-[52px] pb-16 md:pb-0">
        <div className="max-w-[1128px] mx-auto px-3 sm:px-4 py-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
