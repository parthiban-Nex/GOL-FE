import { env } from "@/config/env";


export const appConfig = {
  appName: env.appName,
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  searchDebounceMs: 350,
  tokenStorageKey: "g1_auth_token",
  userStorageKey: "g1_auth_user",
  menuStorageKey: "g1_auth_menu",
  sidebarStorageKey: "g1_sidebar_collapsed",
};
