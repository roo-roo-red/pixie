interface WinScreenProps {
  onPlayAgain: () => void;
}

export function WinScreen({ onPlayAgain }: WinScreenProps) {
  return (
    <section className="w-full rounded-3xl border border-emerald-100 bg-white/75 p-6 text-center shadow-xl shadow-emerald-100/60 backdrop-blur sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Victory</p>
      <h2 className="mt-3 text-4xl font-black text-emerald-700 sm:text-5xl">Pixie Land Restored</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base text-emerald-900/80 sm:text-lg">
        You reached Pixie Land, gathered every magical petal, and drove the witch&apos;s minions away.
      </p>
      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-7 rounded-full bg-emerald-500 px-7 py-3 text-base font-bold text-white transition hover:bg-emerald-600"
      >
        Play Again
      </button>
    </section>
  );
}
