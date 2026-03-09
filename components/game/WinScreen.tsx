interface WinScreenProps {
  onPlayAgain: () => void;
}

export function WinScreen({ onPlayAgain }: WinScreenProps) {
  return (
    <div className="flex h-dvh w-full items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 40%, #0a2a1a 0%, #0a0a1a 70%)" }}>
      <section className="animate-fade-in-up text-center">
        <p
          className="text-sm font-bold uppercase tracking-[0.3em]"
          style={{ color: "var(--neon-green)" }}
        >
          Victory
        </p>
        <h2
          className="mt-4 text-5xl font-black sm:text-6xl"
          style={{
            color: "#fff",
            textShadow: "0 0 30px rgba(57,255,20,0.5), 0 0 60px rgba(57,255,20,0.2)",
          }}
        >
          Pixie Land Restored
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-white/60 sm:text-lg">
          You reached Pixie Land, gathered every magical petal, and drove the witch&apos;s minions away.
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="btn-neon mt-10 text-lg"
          style={{ background: "linear-gradient(135deg, #39ff14, #00d4ff)" }}
        >
          Play Again
        </button>
      </section>
    </div>
  );
}
