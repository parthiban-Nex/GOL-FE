export const NOT_CONNECTED_TITLE = "Not available yet - backend API pending";

export function notConnected(feature) {
  return Promise.reject(
    new Error(`${feature} isn't connected to the backend yet.`),
  );
}
