interface LoseScreenProps {
  onTryAgain: () => void;
}

export function LoseScreen({ onTryAgain }: LoseScreenProps) {
  return (
    <div className="flex h-dvh w-full items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 40%, #2a0a0a 0%, #0a0a1a 70%)" }}>
      {/* Red vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.15) 100%)",
        }}
      />
      <section className="animate-fade-in-up relative text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">
          Defeat
        </p>
        <h2
          className="mt-4 text-5xl font-black sm:text-6xl"
          style={{
            color: "#fff",
            textShadow: "0 0 30px rgba(255,0,0,0.5), 0 0 60px rgba(255,0,0,0.2)",
          }}
        >
          The Minions Won
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-white/60 sm:text-lg">
          The witch&apos;s minions fought back hard. Recharge your courage and try again.
        </p>
        <button
          type="button"
          onClick={onTryAgain}
          className="btn-neon mt-10 text-lg"
          style={{ background: "linear-gradient(135deg, #ff2d55, #ff6b35)" }}
        >
          Try Again
        </button>
      </section>
    </div>
  );
}
