# BiasharaPilot AI (Stage 1: Foundation, Neon edition)

React + TypeScript + Vite + Tailwind v4 + Neon (Postgres, Managed Better Auth, Data API) + Capacitor.

## Neon setup
1. In the Neon Console, open your project, enable **Auth** (Managed Better Auth) and the **Data API**.
2. Run `neon/migrations/001_core.sql`, then `002_onboarding.sql`, in the Neon SQL Editor.
3. Copy your host and database name from **Connect** and set `.env`:
   `VITE_NEON_URL=https://<your-host>/<database>`
4. Allow your origins: add `http://localhost:5173` and `https://localhost` (the Android app origin)
   to Auth trusted origins, and to the Data API CORS list.

## Run
`npm run dev`

## Android
```
npm run build && npx cap sync android && npx cap open android
```

## Security
Only the public base URL belongs in this app. Never put a Neon connection string with a password in frontend code.
