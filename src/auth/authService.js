import { appConfig } from "@/config/appConfig";
import { storage } from "@/utils/storage";
import { authApi } from "@/services";
import { menuApi } from "@/services";
function toPublicUser(loginPayload, menu) {
  return {
    id: loginPayload.employeeCode,
    employeeId: loginPayload.employeeCode,
    name: loginPayload.employeeName ?? loginPayload.employeeCode,
    email: loginPayload.email ?? "",
    roleId: loginPayload.roleId,
    roleLabel: loginPayload.roleName ?? "",
    outlet: loginPayload.outlet ?? null,
    menu,
  };
}

export const authService = {
  async login({ employeeId, password }) {
    const response = await authApi.login({ employeeId, password });

    if (response?.resultText !== "Success") {
      const error = new Error(
        response?.message || "Invalid employee ID or password.",
      );
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    return { employeeId };
  },

  async verifyPin({ employeeId, pin }) {
    const response = await authApi.verifyPin({ employeeId, pin });

    if (response?.resultText !== "Success") {
      const error = new Error(response?.message || "Incorrect PIN.");
      error.code = "INVALID_PIN";
      throw error;
    }
    storage.set(appConfig.tokenStorageKey, response.token);

    const menuResponse = await menuApi.getMenuList({
      employeeCode: response.employeeCode,
      roleId: response.roleId,
    });
    const menu = menuResponse?.menuList ?? [];

    const user = toPublicUser(response, menu);

    storage.set(appConfig.userStorageKey, user);
    storage.set(appConfig.menuStorageKey, menu);

    return user;
  },

  /** Removes the saved token, user and menu - after this a page refresh
   *  shows the login screen instead of restoring the session. */
  clearSession() {
    storage.remove(appConfig.tokenStorageKey);
    storage.remove(appConfig.userStorageKey);
    storage.remove(appConfig.menuStorageKey);
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      this.clearSession();
    }
  },
  async restoreSession() {
    const token = storage.get(appConfig.tokenStorageKey);
    const user = storage.get(appConfig.userStorageKey);
    if (!token || !user) return null;
    return user;
  },
};
