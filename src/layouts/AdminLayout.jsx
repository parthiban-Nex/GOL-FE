import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageLoader from "@/components/common/PageLoader";
import { appConfig } from "@/config/appConfig";
import { storage } from "@/utils/storage";
import { QuickLinksDrawer } from "@/components/quicklinks/QuicklinkDrawer";

export default function AdminLayout({ onNavigate }) {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    storage.get(appConfig.sidebarStorageKey, true),
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function toggleSidebar() {
    if (window.innerWidth < 1024) {
      setIsMobileOpen((v) => !v);
    } else {
      setIsCollapsed((v) => {
        storage.set(appConfig.sidebarStorageKey, !v);
        return !v;
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 sm:p-6">
          {/* <Breadcrumbs /> */}
          <Suspense fallback={<PageLoader label="Loading page…" />}>
            <Outlet />
          </Suspense>
        </main>
        <QuickLinksDrawer onNavigate={onNavigate} />
      </div>
    </div>
  );
}
