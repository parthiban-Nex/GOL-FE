
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can fail (private browsing, quota) - fail silently,
      // the app should still function without persisted state.
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* no-op */
    }
  },
};
