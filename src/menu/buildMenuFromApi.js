import { resolveIcon } from "@/menu/iconMap";
import { decodeButtons } from "@/menu/buttonOperations";

export function normalizeApiMenu(apiMenu = []) {
  return apiMenu.map(normalizeNode).filter(Boolean);
}

function normalizeNode(item) {
  const children = (item.submenu ?? []).map(normalizeNode).filter(Boolean);


  if (!item.path && !children.length) return null;

  return {
    key: `api-menu-${item.id ?? item.path ?? item.title}`,
    label: item.title,
    path: item.path || undefined,
    icon: resolveIcon(item.icon),
    children: children.length ? children : undefined,
  };
}


export function getMenuTabs(apiMenu = [], title) {
  for (const item of apiMenu) {
    if (item?.title === title && item.menuTab?.length) return item.menuTab;
    for (const sub of item?.submenu ?? []) {
      if (sub?.title === title && sub.menuTab?.length) return sub.menuTab;
    }
  }
  return [];
}

/** Button codes granted on one tab, e.g. to hide its Save button. */
export function getTabButtons(menuTab, tabName) {
  const tab = (menuTab ?? []).find((t) => t.tab_name === tabName);
  return decodeButtons(tab?.buttons);
}
