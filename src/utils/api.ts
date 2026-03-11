import axios from "axios";
import { domainUrl } from "./constant";

const api = axios.create({
  baseURL: domainUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Token-refresh state ────────────────────────────────────────────────────────
// Ensures only ONE /auth/refresh call runs at a time.
// All other 401s that arrive while a refresh is in-flight are queued and
// replayed once the refresh resolves (or rejected if it fails).
let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

// Automatic token-refresh interceptor.
// On a 401, silently call /auth/refresh then retry the original request once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      // If a refresh is already in-flight, queue this request until it finishes
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(() => Promise.reject(error));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError);
        // Only force-logout on a real auth rejection from the server (401/403).
        // Network errors (no response) are transient — don't log the user out.
        const status = (refreshError as any)?.response?.status;
        if (status === 401 || status === 403) {
          window.dispatchEvent(new CustomEvent("auth:force-logout"));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
