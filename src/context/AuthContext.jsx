import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService from "../services/authService";
import apiClient from "../services/apiClient";

// FIX 5: AuthContext.jsx was not present in the uploaded codebase but is
//         imported by index.js (<AuthProvider>) and indirectly used across
//         auth pages and ProtectedRoute.  Without it every page that touches
//         auth crashes at runtime.  This is the canonical implementation that
//         matches all the authService calls already in the codebase.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solvedProblems, setSolvedProblems] = useState(new Set());

  // ── Bootstrap: check if there is an existing session cookie ──────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        setUser(data.user);
        // If backend embeds solvedProblems on the user object, use that
        if (data.user?.solvedProblems?.length) {
          setSolvedProblems(new Set(data.user.solvedProblems));
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    if (data.user?.solvedProblems?.length) {
      setSolvedProblems(new Set(data.user.solvedProblems));
    }
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await authService.register({ name, email, password });
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setSolvedProblems(new Set());
    }
  }, []);

  // Mark a problem solved via the API and update the in-memory user object so
  // downstream consumers (CircuitModal, ProblemsPage) reflect the change
  // without needing a page reload.
  const markProblemSolved = useCallback(async (problemId) => {
    const { data } = await apiClient.post(
      `/progress/problems/${problemId}/complete`,
    );
    if (data?.user) {
      setUser(data.user);
    }
  }, []);

  // Idempotent solved check against the authoritative DB list on the user object.
  const hasSolvedProblem = useCallback(
    (problemId) => {
      if (!user?.solvedProblems) return false;
      return user.solvedProblems.includes(Number(problemId));
    },
    [user],
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    markProblemSolved,
    hasSolvedProblem,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return ctx;
}

export default AuthContext;
