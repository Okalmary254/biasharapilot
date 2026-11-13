# BiasharaPilot AI

React + TypeScript + Vite + Tailwind v4 + Neon (Postgres, Managed Better Auth, Data API) + Capacitor.

## Current build

- Authentication: responsive sign-in and registration, password visibility, validation and email-verification guidance.
- Profile: editable name, phone and language preference; account and business details; sign out.
- Business operations: inventory, sales checkout with automatic stock deduction, customer directory and expense tracking.
- AI assistant: business metrics and low-stock context from the signed-in business, suggested prompts and chat UI. Conversational responses require a secure server-side AI endpoint.

## Neon setup
1. In the Neon Console, enable **Auth** (Managed Better Auth) and the **Data API**.
2. Run these SQL migrations in order in the Neon SQL Editor:
   - `neon/migrations/001_core.sql`
   - `neon/migrations/002_onboarding.sql`
   - `neon/migrations/003_operational_write_policies.sql`
   - `neon/migrations/004_sales_workflow.sql`
3. Set `VITE_NEON_URL` in `.env` to the Neon Data API base URL. Never use a connection string containing a password in browser code.
4. Add `http://localhost:5173` and your production/Android origins to Neon Auth trusted origins and Data API CORS.

## AI integration
Set `VITE_AI_API_URL` to your server-side AI endpoint. The endpoint contract is:
- Request: `POST` with `Authorization: Bearer <Neon session access token>` and JSON `{ "messages": [{ "role": "user" | "assistant", "content": "..." }], "businessContext": { ... } }`.
- Response: `{ "reply": "..." }`
- Keep the model provider key on the server in a secret such as `OPENAI_API_KEY`. Never expose provider keys through `VITE_*` variables.
- Verify the bearer token server-side against Neon Auth; do not trust the supplied business context as proof of access. Enforce per-user/business rate limits, validate request sizes, and treat context as untrusted input.

## Run
`npm install`
`npm run dev`

## Android
```sh
npm run build && npx cap sync android && npx cap open android
```
