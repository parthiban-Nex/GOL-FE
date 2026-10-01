import { useMemo } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { protectedRoutes } from "@/routes/routeConfig";
import {
  indexMenuByPath,
  resolvePermissions,
  resolveTabPermissions,
  grantedTabNames,
  NO_PERMISSIONS,
} from "@/menu/permissionResolver";


function useMenuIndex() {
  const { user } = useAuth();
  return useMemo(() => indexMenuByPath(user?.menu ?? []), [user?.menu]);
}


function candidatePathsFor(pathname) {
  const match = protectedRoutes.find((route) =>
    matchPath({ path: route.path, end: true }, pathname),
  );

  if (!match) return [pathname];
  return [pathname, match.path, ...(match.aliases ?? [])];
}

export function usePagePermissions() {
  const { pathname } = useLocation();
  const menuIndex = useMenuIndex();

  return useMemo(
    () => resolvePermissions(menuIndex, candidatePathsFor(pathname)),
    [menuIndex, pathname],
  );
}


export function usePermissionsFor(path) {
  const menuIndex = useMenuIndex();

  return useMemo(
    () => (path ? resolvePermissions(menuIndex, candidatePathsFor(path)) : NO_PERMISSIONS),
    [menuIndex, path],
  );
}


export function useTabPermissions(tabName) {
  const page = usePagePermissions();

  return useMemo(() => resolveTabPermissions(page, tabName), [page, tabName]);
}


export function useGrantedTabNames() {
  const page = usePagePermissions();

  return useMemo(() => grantedTabNames(page), [page]);
}
