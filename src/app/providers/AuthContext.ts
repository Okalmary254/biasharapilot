import { createContext } from "react";
import type { Session } from "../../services/neon/client";

export type AuthState = {
  session: Session | null;
  businessId: string | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
