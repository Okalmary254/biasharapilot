import { createClient, SupabaseAuthAdapter } from "@neon/neon-js";

const authUrl =
  import.meta.env.VITE_NEON_AUTH_URL || import.meta.env.VITE_NEON_URL;
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL;

if (!authUrl) {
  throw new Error(
    "VITE_NEON_AUTH_URL is missing. Configure your Neon Auth URL in Vercel.",
  );
}

if (!dataApiUrl) {
  throw new Error(
    "VITE_NEON_DATA_API_URL is missing. Configure your Neon Data API URL in Vercel.",
  );
}

// Keep authentication and database access pointed at their separate Neon endpoints.
export const neon = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: authUrl,
  },
  dataApi: {
    url: dataApiUrl,
  },
});

export type Session = NonNullable<
  Awaited<ReturnType<typeof neon.auth.getSession>>["data"]["session"]
>;
