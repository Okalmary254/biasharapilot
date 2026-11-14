import { createContext } from "react";
import type { Session } from "../../services/neon/client";

export type AuthState = {
  session: Session | null;
  businessId: string | null;
  businessError: string | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
  syncSession: () => Promise<boolean>;
  clearLocalSession: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
