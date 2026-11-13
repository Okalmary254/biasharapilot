# BiasharaPilot AI

React + TypeScript + Vite + Tailwind v4 + Neon (Postgres, Managed Better Auth, Data API) + Capacitor.

## Current build

- Authentication: responsive sign-in and registration, password visibility, validation and email-verification guidance.
- Profile: editable name, phone and language preference; account and business details; sign out.
- Business operations: inventory, sales checkout with automatic stock deduction, customer directory and expense tracking.
- AI assistant: Groq-powered business copilot with verified business membership and server-loaded sales, expenses, customer count and low-stock context.

## Neon setup
1. In the Neon Console, enable **Auth** (Managed Better Auth) and the **Data API**.
2. Run these SQL migrations in order in the Neon SQL Editor:
   - `neon/migrations/001_core.sql`
   - `neon/migrations/002_onboarding.sql`
   - `neon/migrations/003_operational_write_policies.sql`
   - `neon/migrations/004_sales_workflow.sql`
   - `neon/migrations/005_auth_schema_permissions.sql`
3. Set `VITE_NEON_URL` to the Neon Data API base URL. Do not put a database connection string/password in browser code.
4. Add your local and production origins to Neon Auth trusted origins and Data API CORS.
5. In **Settings → Better Auth**, enable **Sign-up with Email** and **Verify at Sign-up**, and choose **verification links**. Verification links require a custom SMTP email provider; configure and test that provider in Neon Auth before enabling this in production. Set the Auth application name to **BiasharaPilot AI** so confirmation emails are recognizable.
6. Keep the production Vercel domain in Neon Auth trusted domains. Test the complete signup → email link → sign-in flow with a new address.

## Groq AI endpoint

The Vercel serverless endpoint lives at `api/ai.ts` and is called by the assistant at `/api/ai` by default. It:

- Requires a signed-in Neon session JWT in the Bearer header.
- Checks the requested business against `business_members` through the Neon Data API, so Neon validates the token and applies RLS before any business data is read.
- Loads business metrics on the server. Client-supplied business metrics are not trusted or sent to Groq.
- Calls Groq's Chat Completions API and returns `{ "reply": "..." }`.
- Keeps the Groq key server-side and validates request methods, message roles, message lengths and payload size.

Configure these variables in **Vercel → Project → Settings → Environment Variables** for Preview and Production as appropriate:

| Variable | Value |
| --- | --- |
| `VITE_NEON_URL` | Your Neon Data API base URL (also used by the browser SDK) |
| `GROQ_API_KEY` | Your Groq API key (server-side secret; never use a `VITE_` prefix) |
| `GROQ_MODEL` | Optional; defaults to `openai/gpt-oss-120b` |
| `NEON_DATA_API_URL` | Optional; defaults to `VITE_NEON_URL` for the server function |
| `APP_ORIGINS` | Optional comma-separated extra origins for Capacitor/WebView or a separately hosted frontend; same-origin Vercel requests are allowed automatically |
| `VITE_AI_API_URL` | Optional; defaults to same-origin `/api/ai` |

After adding/changing variables, redeploy the Vercel project. Do not commit your real `.env` file or Groq key.

### Local development

The standard Vite dev server does not execute Vercel functions. Install the Vercel CLI and run `vercel dev` from the project root to test both the Vite frontend and `/api/ai` locally. Add the variables above to the local ignored `.env` file.

## Run the frontend only

`npm install`
`npm run dev`

## Android

```sh
npm run build && npx cap sync android && npx cap open android
```

The Vercel API function is a web deployment backend; a Capacitor APK calling it must use the deployed absolute API URL (set `VITE_AI_API_URL` to `https://your-domain/api/ai` when building the Android app). The endpoint handles preflight requests and allows common Capacitor origins; add any custom app origin to `APP_ORIGINS`.
