import { FAIRIES } from "@/lib/game-data";
import { Fairy } from "@/types/game";

interface FairySelectionProps {
  onBack: () => void;
  onSelect: (fairy: Fairy) => void;
}

export function FairySelection({ onBack, onSelect }: FairySelectionProps) {
  return (
    <section className="w-full rounded-3xl border border-rose-100/80 bg-white/70 p-6 shadow-xl shadow-rose-100/50 backdrop-blur sm:p-8">
      <h2 className="text-3xl font-black text-rose-700">Choose Your Fairy</h2>
      <p className="mt-2 text-rose-900/80">Pick your companion before stepping into the enchanted map.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {FAIRIES.map((fairy) => (
          <button
            key={fairy.id}
            type="button"
            onClick={() => onSelect(fairy)}
            className="rounded-2xl border border-rose-100 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`h-20 rounded-xl bg-gradient-to-r ${fairy.colorClass}`} />
            <h3 className="mt-3 text-xl font-bold text-rose-800">{fairy.name}</h3>
            <p className="text-sm font-medium text-rose-500">{fairy.title}</p>
            <p className="mt-2 text-sm text-rose-900/80">{fairy.description}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 rounded-full border border-rose-300 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
      >
        Back
      </button>
    </section>
  );
}
