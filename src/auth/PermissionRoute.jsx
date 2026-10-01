import { Navigate, Outlet } from "react-router-dom";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { ROUTES } from "@/constants/routes";

export default function PermissionRoute({ requireAction, alwaysAllowed = false }) {
  const permissions = usePagePermissions();

  if (alwaysAllowed) return <Outlet />;

  const actionFlag = {
    create: "canCreate",
    read: "canRead",
    update: "canUpdate",
    delete: "canDelete",
  }[requireAction];

  const allowed =
    permissions.isGranted && (!actionFlag || permissions[actionFlag]);

  if (!allowed) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}
