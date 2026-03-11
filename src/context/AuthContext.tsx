import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import api from "../utils/api";
import socket from "../utils/socket";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AuthUser {
  role: string | null;
  isAuthenticated: boolean;
  isInitialLoad: boolean;
}

interface AuthContextValue {
  user: AuthUser;
  setUser: React.Dispatch<React.SetStateAction<AuthUser>>;
  checkAuthStatus: () => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

// ── Provider ───────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser>({
    role: null,
    isAuthenticated: false,
    isInitialLoad: true,
  });

  const checkAuthStatus = async () => {
    try {
      const res = await api.get<{ isLoggedIn: boolean; role?: string }>("/auth/status", {
        withCredentials: true,
      });

      if (res.data.isLoggedIn) {
        setUser({ role: res.data.role ?? null, isAuthenticated: true, isInitialLoad: false });
      } else {
        setUser({ role: null, isAuthenticated: false, isInitialLoad: false });
      }
    } catch (err: unknown) {
      const status = (err as any)?.response?.status;
      // Only treat as logged-out on a confirmed auth failure (401/403 after attempted refresh).
      // Network errors (no response) or 5xx server errors are transient — preserve the current
      // session state so a brief backend hiccup doesn't kick the user to the login page.
      if (status === 401 || status === 403) {
        setUser({ role: null, isAuthenticated: false, isInitialLoad: false });
      } else {
        // Transient error: keep existing auth state, just clear isInitialLoad
        setUser((prev) => ({ ...prev, isInitialLoad: false }));
      }
    }
  };

  useEffect(() => {
    checkAuthStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async (redirectTo: string = "/login") => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      // Ignore — cookies are cleared server-side even on error
    }

    if (socket.connected) socket.disconnect();

    // Clear all client-side storage
    localStorage.clear();
    sessionStorage.clear();

    setUser({ role: null, isAuthenticated: false, isInitialLoad: false });
    window.location.href = redirectTo;
  };

  // Re-check auth when the tab becomes visible again (user returns from idle / screen wake).
  // We proactively call /auth/refresh first so the access cookie is renewed before any other
  // API request fires. This prevents a burst of simultaneous 401s on wake-up.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        // Attempt a silent refresh. If it succeeds the new access cookie is ready.
        await api.post("/auth/refresh");
        // After a successful refresh, make sure our React auth state is current.
        await checkAuthStatus();
      } catch {
        // Refresh failed — check status anyway; if the cookie is still valid (e.g., the
        // refresh endpoint had a transient 5xx) the status call will succeed via interceptor.
        await checkAuthStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proactive silent token refresh — keeps the session alive during long admin work sessions.
  // Runs every 50 minutes so the 1-hour access token never expires while the user is active.
  useEffect(() => {
    if (!user.isAuthenticated) return;
    const id = setInterval(async () => {
      try {
        await api.post("/auth/refresh");
      } catch {
        // If the proactive refresh fails the reactive interceptor will handle the next 401.
        // Don't log the user out here — it may be a transient network issue.
      }
    }, 50 * 60 * 1000); // 50 minutes
    return () => clearInterval(id);
  }, [user.isAuthenticated]);

  // When both access + refresh tokens are expired the api interceptor fires this
  // event. We listen here (outside React render) so we can cleanly log out.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  useEffect(() => {
    const handler = () => logoutRef.current();
    window.addEventListener("auth:force-logout", handler);
    return () => window.removeEventListener("auth:force-logout", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, checkAuthStatus, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
