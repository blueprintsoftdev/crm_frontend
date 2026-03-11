import axios from "axios";
import { domainUrl } from "./constant";

// Plain axios instance — no interceptors.
// Used for requests that should NOT trigger the auto-refresh loop (e.g. auth/status).
const apiPlain = axios.create({
  baseURL: domainUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default apiPlain;
