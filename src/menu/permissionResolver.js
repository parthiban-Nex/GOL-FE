import { decodeButtons } from "@/menu/buttonOperations";

/**
 * Resolves what the logged-in user may DO on a given page, straight from
 * the menu tree the backend returns at login. There is no local
 * permission vocabulary any more - the backend is the only source of
 * truth.
 *
 * Backend contract (dms_pv_backend, user/service.js -> getMenulist):
 *
 *   menuList: [{
 *     id, title, icon, activeIcon, path,
 *     buttons: "1,2,3,4",            // role_menu_settings.menu_operation
 *     menuTab: [{ id, tab_name, buttons }],
 *     submenu: [{
 *       id, title, path,
 *       buttons: "1,2,3" | null,     // role_submenu_settings.button_operation
 *       menuTab: [{ id, tab_name, buttons }]
 *     }]
 *   }]
 *
 * Two rules follow from how the backend builds that tree:
 *
 *  1. PRESENCE grants reachability. A menu or submenu only appears at
 *     all when role_menu_settings has an Active row for the role, so a
 *     path that isn't in the tree is a page the role cannot open.
 *
 *  2. `buttons` grants the ACTIONS. It's a comma-separated list of the
 *     four button ids (1=Create, 2=Read, 3=Update, 4=Delete). It can be
 *     null - getMenulist sets `buttons: null` whenever no
 *     role_submenu_settings row exists - and null means NO actions, not
 *     "all actions". Anything not listed is denied.
 *
 * Nothing here assumes a role name. An Admin with no button ids gets no
 * buttons, exactly like anyone else.
 */

/** A page the user cannot reach at all. */
const DENIED = Object.freeze({
  isGranted: false,
  buttons: Object.freeze(new Set()),
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
  menuTab: Object.freeze([]),
  node: null,
});

export const NO_PERMISSIONS = DENIED;

function toPermissions(node) {
  const buttons = decodeButtons(node?.buttons);
  return {
    isGranted: true,
    buttons,
    canCreate: buttons.has(1),
    canRead: buttons.has(2),
    canUpdate: buttons.has(3),
    canDelete: buttons.has(4),
    menuTab: node?.menuTab ?? [],
    node: node ?? null,
  };
}

/**
 * Flattens the tree into `path -> node`. Submenu entries are indexed
 * after their parent so that when a submenu shares a path with its menu,
 * the submenu's own (more specific) buttons win - which matches how the
 * reference frontend resolved permissions for a route.
 */
export function indexMenuByPath(menu = []) {
  const byPath = new Map();

  for (const item of menu) {
    if (item?.path) byPath.set(normalizePath(item.path), item);
  }
  for (const item of menu) {
    for (const sub of item?.submenu ?? []) {
      if (sub?.path) byPath.set(normalizePath(sub.path), sub);
    }
  }

  return byPath;
}

export function resolvePermissions(menu, candidatePaths = []) {
  const byPath = menu instanceof Map ? menu : indexMenuByPath(menu);

  const candidates = candidatePaths.filter(Boolean).map(normalizePath);

  for (const path of candidates) {
    const node = byPath.get(path);
    if (node) return toPermissions(node);
  }

  // Fall back to the nearest granted ancestor, longest first.
  //
  // This exists so a detail or wizard route inherits the page it belongs
  // to - "/service/estimate/42" from "/service/estimate", "/users/create"
  // from "/users". It must NOT let a page inherit from a GROUPING menu:
  // "/masters" is granted as a container whose children are each granted
  // individually, so allowing "/masters/technicians" to inherit it would
  // hand full CRUD on a submenu this role was never given. A node with
  // its own submenu entries is such a container, so it's skipped.
  const ancestors = candidates
    .flatMap(ancestorPaths)
    .sort((a, b) => b.length - a.length);

  for (const path of ancestors) {
    const node = byPath.get(path);
    if (node && !isGroupNode(node)) return toPermissions(node);
  }

  return DENIED;
}

/** A menu that exists to contain submenus, rather than to be opened. */
function isGroupNode(node) {
  return Array.isArray(node?.submenu) && node.submenu.length > 0;
}

/**
 * Permissions for one tab inside a page, from the `menuTab` array the
 * backend attaches to that menu/submenu (role_menu_tab_settings). A tab
 * the role has no record for is denied, same rule as everything else.
 */
export function resolveTabPermissions(pagePermissions, tabName) {
  const tab = (pagePermissions?.menuTab ?? []).find((t) => t?.tab_name === tabName);
  if (!tab) return DENIED;
  return toPermissions(tab);
}

/** Tab names the role may see on this page, in backend order. */
export function grantedTabNames(pagePermissions) {
  return (pagePermissions?.menuTab ?? [])
    .map((t) => t?.tab_name)
    .filter(Boolean);
}

/** "/Masters/Employees/" -> "/masters/employees". The backend's stored
 * paths and this app's routes don't always agree on case or trailing
 * slash, and neither difference should cost someone their access. */
function normalizePath(path) {
  const trimmed = String(path ?? "").trim().toLowerCase();
  if (!trimmed) return "";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}

/** "/a/b/c" -> ["/a/b", "/a"] (excludes the path itself and "/"). */
function ancestorPaths(path) {
  const segments = path.split("/").filter(Boolean);
  const result = [];
  for (let i = segments.length - 1; i > 0; i--) {
    result.push(`/${segments.slice(0, i).join("/")}`);
  }
  return result;
}
