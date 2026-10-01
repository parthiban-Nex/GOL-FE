import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Breadcrumbs from the backend's own menu tree, so the trail always
 * reflects the titles and nesting the role was actually granted. Falls
 * back to rendering nothing for a path that isn't in the tree (wizard
 * steps, error screens).
 */
function findTrail(menu = [], pathname) {
  for (const item of menu) {
    if (item?.path === pathname) return [item];
    for (const sub of item?.submenu ?? []) {
      if (sub?.path === pathname) return [item, sub];
    }
  }
  return null;
}

export default function Breadcrumbs() {
  const { user } = useAuth();
  const location = useLocation();

  const trail = useMemo(
    () => findTrail(user?.menu, location.pathname),
    [user?.menu, location.pathname],
  );

  if (!trail?.length) return null;

  // "Home" points at the first granted menu entry rather than a fixed
  // /dashboard, which a role may not have.
  const homePath = user?.menu?.find((item) => item?.path)?.path ?? "/";

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-500">
      <Link to={homePath} className="hover:text-brand-600">
        Home
      </Link>
      {trail.map((crumb, i) => (
        <span key={crumb.id ?? crumb.path ?? crumb.title} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
          {i === trail.length - 1 ? (
            <span className="font-medium text-ink-700">{crumb.title}</span>
          ) : (
            <span>{crumb.title}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
