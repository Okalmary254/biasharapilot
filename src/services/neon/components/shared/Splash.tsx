export default function Splash() {
  return (
    <div className="min-h-screen grid place-items-center bg-midnight">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald grid place-items-center text-3xl font-bold text-gold">
          B
        </div>
        <h1 className="text-2xl font-bold text-white">
          Biashara<span className="text-gold">Pilot</span> AI
        </h1>
        <p className="mt-1 text-sm text-white/60">Run your business smarter</p>
        <div className="mx-auto mt-6 h-1 w-24 overflow-hidden rounded bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded bg-gold" />
        </div>
      </div>
    </div>
  );
}
