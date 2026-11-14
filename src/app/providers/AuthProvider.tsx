import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { neon } from "../../services/neon/client";
import type { Session } from "../../services/neon/client";
import { AuthContext } from "./AuthContext";

function describeDataApiError(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return error instanceof Error ? error.message : "Unable to check your business membership.";
  }

  const value = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
    status?: unknown;
  };
  const parts = [
    typeof value.message === "string" ? value.message : "Business membership lookup failed.",
    typeof value.code === "string" ? `Code: ${value.code}` : null,
    typeof value.status === "number" ? `HTTP: ${value.status}` : null,
    typeof value.details === "string" && value.details ? `Details: ${value.details}` : null,
    typeof value.hint === "string" && value.hint ? `Hint: ${value.hint}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = session?.user.id ?? null;

  const refreshBusiness = useCallback(async () => {
    setBusinessError(null);
    if (!userId) {
      setBusinessId(null);
      return;
    }

    try {
      const { data, error } = await neon
        .from("business_members")
        .select("business_id")
        .limit(1)
        .maybeSingle();

      if (error) {
        setBusinessError(describeDataApiError(error));
        return;
      }
      setBusinessId(data?.business_id ?? null);
    } catch (error) {
      setBusinessError(describeDataApiError(error));
    }
  }, [userId]);

  const syncSession = useCallback(async () => {
    try {
      const { data, error } = await neon.auth.getSession();
      if (error) {
        setSession(null);
        setBusinessId(null);
        setBusinessError(error.message ?? "Unable to verify your sign-in session.");
        setAuthReady(true);
        return false;
      }
      const nextSession = data?.session ?? null;
      setSession(nextSession);
      setAuthReady(true);
      return Boolean(nextSession);
    } catch (error) {
      setSession(null);
      setBusinessId(null);
      setBusinessError(error instanceof Error ? error.message : "Unable to verify your sign-in session.");
      setAuthReady(true);
      return false;
    }
  }, []);

  const clearLocalSession = useCallback(() => {
    setSession(null);
    setBusinessId(null);
    setBusinessError(null);
    setLoading(false);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    void syncSession();

    // Better Auth does not expose Supabase's onAuthStateChange API.
    // Refresh when the tab becomes active so cross-tab sign-in/out is reflected.
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") void syncSession();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [syncSession]);

  useEffect(() => {
    if (!authReady) return;
    if (!userId) {
      setBusinessId(null);
      setBusinessError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refreshBusiness().finally(() => setLoading(false));
  }, [authReady, userId, refreshBusiness]);

  return (
    <AuthContext.Provider value={{ session, businessId, businessError, loading, refreshBusiness, syncSession, clearLocalSession }}>
      {children}
    </AuthContext.Provider>
  );
}
