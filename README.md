# BiasharaPilot AI

React + TypeScript + Vite + Tailwind v4 + Neon (Postgres, Managed Better Auth, Data API) + Capacitor.

## Current build

- Stage 1 foundation: authentication, business onboarding, dashboard and profile.
- Stage 2 pages: inventory (add/search/archive products and low-stock indicators), customer directory (add/search contacts), and expense tracking (record and review recent expenses).
- Sales entry and AI assistant remain planned modules; their routes currently show a placeholder.

## Neon setup
1. In the Neon Console, open your project, enable **Auth** (Managed Better Auth) and the **Data API**.
2. Run these SQL migrations in order in the Neon SQL Editor:
   - `neon/migrations/001_core.sql`
   - `neon/migrations/002_onboarding.sql`
   - `neon/migrations/003_operational_write_policies.sql`
3. Copy your host and database name from **Connect** and set `.env`:
   `VITE_NEON_URL=https://<your-host>/<database>`
4. Allow your origins: add `http://localhost:5173` and `https://localhost` (the Android app origin) to Auth trusted origins and the Data API CORS list.

## Run
`npm install`
`npm run dev`

## Android
```sh
npm run build && npx cap sync android && npx cap open android
```

## Security
Only the public base URL belongs in this app. Never put a Neon connection string with a password in frontend code.
