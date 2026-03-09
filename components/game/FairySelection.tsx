import { FAIRIES } from "@/lib/game-data";
import { Fairy } from "@/types/game";

interface FairySelectionProps {
  onBack: () => void;
  onSelect: (fairy: Fairy) => void;
}

const FAIRY_COLORS: Record<string, { accent: string; glow: string }> = {
  luna: { accent: "#ff69b4", glow: "rgba(255,105,180,0.3)" },
  miri: { accent: "#00d4ff", glow: "rgba(0,212,255,0.3)" },
  sola: { accent: "#ffd700", glow: "rgba(255,215,0,0.3)" },
};

export function FairySelection({ onBack, onSelect }: FairySelectionProps) {
  return (
    <div
      className="flex h-dvh w-full items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #1a0a3e 0%, #0a0a1a 70%)" }}
    >
      <section className="animate-fade-in-up w-full max-w-3xl">
        <h2
          className="text-center text-4xl font-black sm:text-5xl"
          style={{
            color: "#fff",
            textShadow: "0 0 20px rgba(184,69,255,0.4)",
          }}
        >
          Choose Your Fairy
        </h2>
        <p className="mt-3 text-center text-white/50">Pick your companion before stepping into the enchanted world.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {FAIRIES.map((fairy) => {
            const colors = FAIRY_COLORS[fairy.id] ?? { accent: "#b845ff", glow: "rgba(184,69,255,0.3)" };

            return (
              <button
                key={fairy.id}
                type="button"
                onClick={() => onSelect(fairy)}
                className="glass-panel group p-5 text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 25px ${colors.glow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Color bar */}
                <div
                  className="h-16 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}40, ${colors.accent}15)`,
                    borderBottom: `2px solid ${colors.accent}50`,
                  }}
                />
                <h3 className="mt-4 text-xl font-black text-white">{fairy.name}</h3>
                <p className="text-sm font-semibold" style={{ color: colors.accent }}>{fairy.title}</p>
                <p className="mt-2 text-sm text-white/50">{fairy.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="glass-panel px-5 py-2 text-sm font-bold text-white/50 transition hover:text-white"
          >
            Back
          </button>
        </div>
      </section>
    </div>
  );
}
