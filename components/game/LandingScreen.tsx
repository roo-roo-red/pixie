interface LandingScreenProps {
  onStart: () => void;
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <section className="w-full rounded-3xl border border-rose-100/80 bg-white/70 p-6 text-center shadow-xl shadow-rose-100/50 backdrop-blur sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">Fantasy Adventure</p>
      <h1 className="mt-3 text-5xl font-black text-rose-700 sm:text-6xl">Pixie</h1>
      <p className="mx-auto mt-5 max-w-2xl text-base text-rose-900/80 sm:text-lg">
        Choose a fairy, gather magical petals, and outsmart the witch&apos;s minions on your journey back to Pixie Land.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 rounded-full bg-rose-500 px-8 py-3 text-base font-bold text-white transition hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
      >
        Begin Adventure
      </button>
    </section>
  );
}
