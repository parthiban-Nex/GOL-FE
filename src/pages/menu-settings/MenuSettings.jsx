import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import MenuListTab from "@/pages/menu-settings/MenuListTab";
import SubMenuListTab from "@/pages/menu-settings/SubMenuListTab";
import RoleMenuSettingTab from "@/pages/menu-settings/RoleMenuSettingTab";
import RoleSubMenuSettingTab from "@/pages/menu-settings/RoleSubMenuSettingTab";
import RoleMenuTabSettingTab from "@/pages/menu-settings/RoleMenuTabSettingTab";
import { useGrantedTabNames } from "@/hooks/usePagePermissions";

/**
 * Super Admin workflow for the dynamic menu/permission system: define
 * the Menu and SubMenu master records, then assign menu, submenu, and
 * Create/Read/Update/Delete button access per role. Whatever a role is
 * granted here is exactly what auth/authService.js +
 * menu/buildMenuFromApi.js turn into that role's sidebar and route
 * access at login.
 *
 * The tab strip itself is dynamic: the backend's menu tree carries a
 * `menuTab` array for this page (configured on the Role Menu Tab
 * Setting tab), so a role can be given a subset of these five. Tab
 * names are matched against TAB_COMPONENTS by the same labels the
 * reference app uses. When a role has no tab records configured, all
 * five show - an unconfigured backend shouldn't render an empty page.
 *
 * Same ?tab= URL pattern as pages/attendance/Attendance.jsx.
 */
const TAB_COMPONENTS = {
  "Menu List": { key: "menus", component: MenuListTab },
  "SubMenu List": { key: "submenus", component: SubMenuListTab },
  "Role Menu Setting": { key: "role-menu", component: RoleMenuSettingTab },
  "Role SubMenu Setting": { key: "role-submenu", component: RoleSubMenuSettingTab },
  "Role Menu Tab Setting": { key: "role-menu-tab", component: RoleMenuTabSettingTab },
};

const ALL_TABS = Object.entries(TAB_COMPONENTS).map(([label, tab]) => ({
  label,
  ...tab,
}));

export default function MenuSettings() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab names the backend granted this role on this page
  // (role_menu_tab_settings), resolved by the current route.
  const grantedTabNames = useGrantedTabNames();

  const tabs = useMemo(() => {
    const configured = grantedTabNames
      .map((name) => {
        const match = TAB_COMPONENTS[name];
        return match ? { label: name, ...match } : null;
      })
      .filter(Boolean);

    return configured.length ? configured : ALL_TABS;
  }, [grantedTabNames]);

  const requestedTab = searchParams.get("tab");
  const activeTab = tabs.some((t) => t.key === requestedTab)
    ? requestedTab
    : tabs[0]?.key;

  function switchTab(next) {
    setSearchParams(next === tabs[0]?.key ? {} : { tab: next }, { replace: false });
  }

  const ActiveComponent = tabs.find((t) => t.key === activeTab)?.component;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink-800">Menu Settings</h1>
        {/* <p className="text-sm text-ink-500">
          Configure menus, submenus, and per-role button access. This
          drives the sidebar and page access every user sees after login.
        </p> */}
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={clsx(
              "cursor-pointer rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              activeTab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-ink-300 text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}
