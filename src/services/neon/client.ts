import { createClient } from "@neon/neon-js";

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

// Neon Auth uses Better Auth by default; database requests use the separate Data API.
export const neon = createClient({
  auth: { url: authUrl },
  dataApi: { url: dataApiUrl },
});

// Keep both the session metadata and its associated user available to the app.
export type Session = NonNullable<
  Awaited<ReturnType<typeof neon.auth.getSession>>["data"]
>;
