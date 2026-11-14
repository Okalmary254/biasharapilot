import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { neon } from "../../services/neon/client";
import type { Session } from "../../services/neon/client";
import { AuthContext } from "./AuthContext";

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
        setBusinessError(error.message);
        return;
      }
      setBusinessId(data?.business_id ?? null);
    } catch (error) {
      setBusinessError(error instanceof Error ? error.message : "Unable to check your business membership.");
    }
  }, [userId]);

  const syncSession = useCallback(async () => {
    try {
      const { data, error } = await neon.auth.getSession();
      if (error) {
        setSession(null);
        setBusinessId(null);
        setBusinessError(error.message);
        setAuthReady(true);
        return false;
      }
      setSession(data.session);
      setAuthReady(true);
      return Boolean(data.session);
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
    const { data } = neon.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setBusinessId(null);
        setBusinessError(null);
      }
    });
    return () => data.subscription.unsubscribe();
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
