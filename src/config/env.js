
function readEnv(key, fallback = undefined) {
  const value = import.meta.env[key];
  if (value === undefined || value === "") return fallback;
  return value;
}

export const env = {
  apiBaseUrl: readEnv("VITE_API_BASE_URL", "http://localhost:7878/api"),
  appName: readEnv("VITE_APP_NAME", "myTVS GarageOne Lite"),
  apiTimeout: Number(readEnv("VITE_API_TIMEOUT", "15000")),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
