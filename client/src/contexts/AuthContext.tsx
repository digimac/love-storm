import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AuthContextValue {
  isSteward: boolean;
  login: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSteward, setIsSteward] = useState(false);

  const login = useCallback(async (pin: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/steward/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setIsSteward(true);
        return { ok: true };
      }
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.message ?? "Incorrect PIN" };
    } catch {
      return { ok: false, error: "Could not reach server. Check your connection." };
    }
  }, []);

  const logout = useCallback(() => {
    setIsSteward(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isSteward, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
