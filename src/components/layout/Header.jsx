import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, Settings, LogOut, UserCircle } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/utils/formatters";
import { ROUTES } from "@/constants/routes";
// import QuickLinksPanel from "@/components/quicklinks/QuickLinksPanel";
import { BotAvatar } from "@/components/quicklinks/ChatPieces";
import { useLayout } from "@/context/LayoutContext";

/** Top bar: menu toggle, global search, notifications, and account menu. */
export default function Header({ onToggleSidebar, notificationCount = 3 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleQuickLinks, isQuickLinksOpen } = useLayout();

  async function handleLogout() {
    await logout({ message: "You've been signed out." });
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-100 bg-white px-4 sm:px-6">
      <button
        onClick={onToggleSidebar}
        className="p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Input
          type="search"
          placeholder="Search"
          icon={Search}
          className="h-10"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={toggleQuickLinks}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          aria-label="Open Quick Links"
        >
          <BotAvatar size={24} />
          <span className="hidden sm:inline">Quick Links</span>
        </button>

        <button
          className="relative rounded-md  p-2 text-ink-500 hover:bg-ink-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <button
          className="rounded-md p-2 text-ink-500 hover:bg-ink-100"
          aria-label="Settings"
          onClick={() => navigate("/self-configuration")}
        >
          <Settings className="h-5 w-5" />
        </button>

        <Dropdown
          trigger={
            <button className="flex h-9 w-9  cursor-pointer items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {initials(user?.name) || "U"}
            </button>
          }
        >
          <div className="border-b border-ink-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-ink-800">
              {user?.name}
            </p>
            <p className="truncate text-xs text-ink-500">{user?.roleLabel}</p>
          </div>
          <Dropdown.Item
            icon={UserCircle}
            onClick={() => navigate("/dashboard")}
            className=" text-ink-500 cursor-pointer"
          >
            My Profile
          </Dropdown.Item>
          <Dropdown.Item
            icon={LogOut}
            onClick={handleLogout}
            className="text-danger-500 cursor-pointer"
          >
            Log out
          </Dropdown.Item>
        </Dropdown>
      </div>

      {/* <QuickLinksPanel
        isOpen={isQuickLinksOpen}
        onClose={() => setQuickLinksOpen(false)}
      /> */}
    </header>
  );
}
