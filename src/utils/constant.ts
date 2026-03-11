// Central API base URL — driven by VITE_API_URL in .env (falls back to localhost for dev).
export const domainUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
