#!/usr/bin/env bash
# Run once from the project root after unzipping.
set -e

echo "Removing default template files and old Supabase leftovers..."
rm -f src/App.tsx src/App.css
rm -rf supabase src/services/supabase
npm uninstall @supabase/supabase-js >/dev/null 2>&1 || true

echo "Installing dependencies..."
npm install @neon/neon-js react-router-dom lucide-react recharts
npm install tailwindcss @tailwindcss/vite
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

grep -q "VITE_NEON_URL" .env 2>/dev/null || cp .env.example .env

echo "Building web assets..."
npm run build

if [ ! -d android ]; then
  echo "Adding Android platform..."
  npx cap add android
fi
npx cap sync android

echo ""
echo "Done. Next steps:"
echo "  1. Put your Neon base URL in .env (VITE_NEON_URL)"
echo "  2. Run neon/migrations/001 then 002 on your Neon database"
echo "  3. npm run dev"
