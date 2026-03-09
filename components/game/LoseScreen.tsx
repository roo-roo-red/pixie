interface LoseScreenProps {
  onTryAgain: () => void;
}

export function LoseScreen({ onTryAgain }: LoseScreenProps) {
  return (
    <section className="w-full rounded-3xl border border-rose-200 bg-white/80 p-6 text-center shadow-xl shadow-rose-100/60 backdrop-blur sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Defeat</p>
      <h2 className="mt-3 text-4xl font-black text-rose-700 sm:text-5xl">The Minions Overpowered You</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base text-rose-900/80 sm:text-lg">
        The witch&apos;s minions fought back hard. Recharge your courage and try the adventure again.
      </p>
      <button
        type="button"
        onClick={onTryAgain}
        className="mt-7 rounded-full bg-rose-500 px-7 py-3 text-base font-bold text-white transition hover:bg-rose-600"
      >
        Try Again
      </button>
    </section>
  );
}
