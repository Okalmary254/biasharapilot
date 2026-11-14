export function GET() {
  return Response.json(
    { ok: true, service: "biasharapilot-api" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
