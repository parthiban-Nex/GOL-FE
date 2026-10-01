import { Navigate, useLocation } from "react-router-dom";
import ModulePlaceholder from "@/components/common/ModulePlaceholder";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";

function findMenuItemByPath(menu = [], path) {
  for (const item of menu) {
    if (item.path === path) return item;
    const match = findMenuItemByPath(item.submenu ?? [], path);
    if (match) return match;
  }
  return null;
}

export default function DynamicModulePage() {
  const { user } = useAuth();
  const location = useLocation();

  const matched = findMenuItemByPath(user?.menu ?? [], location.pathname);

  if (!matched) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return (
    <ModulePlaceholder
      title={matched.title}
      description="This module isn't built in GarageOne Lite yet, but your role already has access to it."
    />
  );
}
