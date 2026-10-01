import { cloneElement, isValidElement } from "react";
import { usePagePermissions, usePermissionsFor } from "@/hooks/usePagePermissions";


const ACTION_FLAG = {
  create: "canCreate",
  read: "canRead",
  update: "canUpdate",
  delete: "canDelete",
};

export default function Can({
  action,
  path,
  disable = false,
  fallback = null,
  children,
}) {
  const current = usePagePermissions();
  const other = usePermissionsFor(path);
  const permissions = path ? other : current;

  const flag = ACTION_FLAG[action];
  // An unknown action name is treated as denied rather than allowed -
  // a typo shouldn't silently open something up.
  const allowed = flag ? permissions[flag] : false;

  if (allowed) return children;

  if (disable && isValidElement(children)) {
    return cloneElement(children, { disabled: true });
  }

  return fallback;
}
