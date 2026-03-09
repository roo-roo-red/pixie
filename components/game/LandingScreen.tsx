interface LandingScreenProps {
  onStart: () => void;
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className="flex h-dvh w-full items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 40%, #1a0a3e 0%, #0a0a1a 70%)" }}>
      <section className="animate-fade-in-up text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: "var(--neon-pink)" }}>
          Fantasy Adventure
        </p>
        <h1
          className="mt-4 text-7xl font-black sm:text-8xl"
          style={{
            color: "#fff",
            textShadow: "0 0 30px rgba(184,69,255,0.6), 0 0 60px rgba(255,45,149,0.3), 0 0 100px rgba(184,69,255,0.2)",
          }}
        >
          Pixie
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base text-white/60 sm:text-lg">
          Choose a fairy, gather magical petals, and outsmart the witch&apos;s minions on your journey back to Pixie Land.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="btn-neon mt-10 text-lg animate-shimmer"
        >
          Begin Adventure
        </button>
      </section>
    </div>
  );
}
