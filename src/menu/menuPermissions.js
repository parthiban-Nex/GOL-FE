
export function isMenuItemActive(item, currentPath) {
  if (item.path && currentPath.startsWith(item.path)) return true;
  return item.children?.some((child) => isMenuItemActive(child, currentPath)) ?? false;
}
