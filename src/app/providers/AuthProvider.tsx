import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { neon } from "../../services/neon/client";
import type { Session } from "../../services/neon/client";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = session?.user.id ?? null;

  const refreshBusiness = useCallback(async () => {
    const { data } = await neon
      .from("business_members")
      .select("business_id")
      .limit(1)
      .maybeSingle();
    setBusinessId(data?.business_id ?? null);
  }, []);

  // 1. Track the auth session. Do not run database queries inside this callback.
  useEffect(() => {
    neon.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = neon.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // 2. Load the user's business whenever the signed-in user changes.
  useEffect(() => {
    if (!authReady) return;
    if (!userId) {
      setBusinessId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshBusiness().finally(() => setLoading(false));
  }, [authReady, userId, refreshBusiness]);

  return (
    <AuthContext.Provider value={{ session, businessId, loading, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}
