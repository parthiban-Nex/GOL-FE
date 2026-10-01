import { axiosClient } from "@/services";

/**
 * Menu / submenu / role-permission endpoints (reference: dms_pv_frontend
 * "Menu Settings" module). These drive:
 *  - the per-user tree fetched right after login (getMenuList)
 *  - the Super Admin "Menu Settings" screens under Self-Configuration
 *    (everything else below)
 *
 * The `*ListKey` constants record which envelope each grid response
 * arrives in, so pages don't have to guess - see utils/apiResponse.js.
 */
export const menuApi = {
  menuListKey: "data",
  subMenuListKey: "data",
  /** getSubmenuData's rows come back under `submenudData` (backend spelling). */
  roleSubMenuListKey: "submenudData",
  roleMenuListKey: "menuList",
  tabListKey: "data",

  /** Per-user resolved menu tree, fetched once right after login. */
  getMenuList({ employeeCode, roleId }) {
    return axiosClient.post("/users/menuList", { employeeCode, roleId });
  },

  // --- Menu master (top-level items) -------------------------------
  listMenus(body) {
    return axiosClient.post("/menuSettings/getMenuListGrid", body);
  },
  createMenu(payload) {
    return axiosClient.post("/menuSettings/createMenu", payload);
  },
  updateMenu(payload) {
    return axiosClient.post("/menuSettings/updateMenu", payload);
  },
  /** Every menu record, unpaged - the left column of Role Menu Setting.
   * Accepts an optional roleId, which Role Menu Tab Setting passes. */
  getAllMenus(body = {}) {
    return axiosClient.post("/menuSettings/getMenuList", body);
  },

  // --- SubMenu master -------------------------------------------------
  listSubMenus(body) {
    return axiosClient.post("/menuSettings/getSubMenuListGrid", body);
  },
  createSubMenu(payload) {
    return axiosClient.post("/menuSettings/createSubMenu", payload);
  },
  updateSubMenu(payload) {
    return axiosClient.post("/menuSettings/updateSubMenu", payload);
  },
  /** Every submenu record, unpaged - the grid of Role SubMenu Setting. */
  getAllSubMenus(body = {}) {
    return axiosClient.post("/menuSettings/getSubMenuList", body);
  },

  getAllSubMenusForRole(roleId) {
    return axiosClient.post("/menuSettings/getSubmenuData", { roleId });
  },

  // --- Role -> Menu / SubMenu / Button permission assignment ----------
  getMenuListByRole(roleId) {
    return axiosClient.post("/menuSettings/getMenuListByRole", { roleId });
  },
  submitRoleMenuSetting(payload) {
    return axiosClient.post("/menuSettings/createRoleMenu", payload);
  },
  submitRoleSubMenuSetting(payload) {
    return axiosClient.post("/menuSettings/createRoleSubMenu", payload);
  },

  // --- Role -> Menu Tab permission (tabs inside a settings page) ------
  getRoleMenuTabs(body) {
    return axiosClient.post("/menuSettings/getRoleMenuTabs", body);
  },
  addRoleMenuTab(payload) {
    return axiosClient.post("/menuSettings/addRoleMenuTab", payload);
  },
  updateRoleMenuTab(payload) {
    return axiosClient.post("/menuSettings/updateRoleMenuTab", payload);
  },
};
