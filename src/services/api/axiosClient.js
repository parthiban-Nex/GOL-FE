import axios from "axios";
import { env } from "@/config/env";
import { appConfig } from "@/config/appConfig";
import { storage } from "@/utils/storage";


export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


axiosClient.interceptors.request.use((config) => {
  const token = storage.get(appConfig.tokenStorageKey);
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const serverMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message;

    if (status === 401) {
      // Do NOT invalidate user session if 401 comes from upstream catalog / external ERP services
      const isUpstreamCatalog =
        error.config?.url?.includes("/catelog/") ||
        error.config?.url?.includes("/jobCards/partsmart") ||
        error.response?.data?.error?.code === "INVALID_TOKEN" ||
        error.response?.data?.code === "INVALID_TOKEN";

      if (!isUpstreamCatalog) {
        unauthorizedHandler?.();
      }
    }

    const safeMessage =
      serverMessage ||
      {
        400: "That request could not be processed.",
        403: "You don't have permission to do that.",
        404: "We couldn't find what you were looking for.",
        422: "Some of the submitted data is invalid.",
        429: "Too many requests - please slow down and try again.",
        500: "Something went wrong on our end. Please try again shortly.",
      }[status] ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please check your connection."
        : "Network error - please check your connection and try again.");

    return Promise.reject({
      status: status ?? 0,
      message: safeMessage,
      code: error.code,
      raw: env.isDev ? error : undefined,
    });
  }
);
