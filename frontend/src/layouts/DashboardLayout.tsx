import { Outlet } from 'react-router-dom';
import { TopNavbar } from '../components/TopNavbar';
import { LeftSidebar } from '../components/feed/LeftSidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <TopNavbar />

      {/* Main content — below top navbar, above mobile bottom nav */}
      <main className="pt-[52px] pb-16 md:pb-0">
        <div className="max-w-[1128px] mx-auto px-3 sm:px-4 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
            {/* ─── Left Sidebar (desktop only) ─── */}
            <div className="hidden lg:block">
              <div className="sticky top-[68px]">
                <LeftSidebar />
              </div>
            </div>

            {/* ─── Page Content ─── */}
            <div className="min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
