import { createClient } from "@neon/neon-js/supabase";

const neonUrl = import.meta.env.VITE_NEON_URL;

if (!neonUrl) {
  throw new Error("VITE_NEON_URL is missing. Check your .env file.");
}

// One client for Managed Better Auth (neon.auth) and the Data API (neon.from, neon.rpc).
export const neon = createClient(neonUrl);

export type Session = NonNullable<
  Awaited<ReturnType<typeof neon.auth.getSession>>["data"]["session"]
>;
