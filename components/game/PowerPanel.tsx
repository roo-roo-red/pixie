import { POWER_ORDER, POWERS } from "@/lib/game-data";
import { PowerId, PowerState } from "@/types/game";

interface PowerPanelProps {
  collectedPetals: Set<PowerId>;
  powers: Record<PowerId, PowerState>;
  now: number;
  activePower: PowerId | null;
  onActivate: (powerId: PowerId) => void;
  onStartRecharge: (powerId: PowerId) => void;
}

function formatSeconds(ms: number) {
  return Math.max(0, Math.ceil(ms / 1000));
}

function resolveForDisplay(power: PowerState, now: number) {
  const rechargeFinished = power.rechargeUntil !== null && power.rechargeUntil <= now;
  const activeFinished = power.activeUntil !== null && power.activeUntil <= now;

  return {
    energy: rechargeFinished ? power.maxEnergy : power.energy,
    maxEnergy: power.maxEnergy,
    rechargeUntil: rechargeFinished ? null : power.rechargeUntil,
    activeUntil: activeFinished ? null : power.activeUntil,
  };
}

function getPowerStatus(power: ReturnType<typeof resolveForDisplay>, now: number) {
  if (power.activeUntil && power.activeUntil > now) {
    return "Active";
  }

  if (power.rechargeUntil && power.rechargeUntil > now) {
    return "Recharging";
  }

  if (power.energy === 0) {
    return "Empty";
  }

  return "Ready";
}

export function PowerPanel({
  collectedPetals,
  powers,
  now,
  activePower,
  onActivate,
  onStartRecharge,
}: PowerPanelProps) {
  return (
    <section className="rounded-3xl border border-pink-100 bg-white/85 p-4 shadow-sm">
      <h3 className="text-xl font-black text-rose-800">Petal Powers</h3>
      <p className="text-sm text-rose-900/70">Activate a power, then use it to clear an obstacle.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {POWER_ORDER.map((powerId) => {
          const definition = POWERS.find((entry) => entry.id === powerId);

          if (!definition) {
            return null;
          }

          const displayed = resolveForDisplay(powers[powerId], now);
          const isCollected = collectedPetals.has(powerId);
          const status = getPowerStatus(displayed, now);
          const rechargeSeconds = displayed.rechargeUntil ? formatSeconds(displayed.rechargeUntil - now) : 0;
          const activeSeconds = displayed.activeUntil ? formatSeconds(displayed.activeUntil - now) : 0;
          const isActivateDisabled =
            !isCollected || status === "Recharging" || status === "Empty" || status === "Active";

          return (
            <article key={powerId} className="rounded-2xl border border-rose-100 bg-white p-3">
              <div className={`h-10 rounded-lg bg-gradient-to-r ${definition.colorClass}`} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <h4 className="font-bold text-rose-900">{definition.label}</h4>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {status}
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-900/70">{definition.description}</p>
              <p className="mt-2 text-xs font-semibold text-rose-700">
                Energy: {displayed.energy}/{displayed.maxEnergy}
              </p>
              {status === "Recharging" && (
                <p className="mt-1 text-xs text-rose-700">Recharge: {rechargeSeconds}s left</p>
              )}
              {status === "Active" && <p className="mt-1 text-xs text-rose-700">Active: {activeSeconds}s left</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onActivate(powerId)}
                  disabled={isActivateDisabled}
                  className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition enabled:hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-200"
                >
                  Activate
                </button>
                {status === "Empty" && (
                  <button
                    type="button"
                    onClick={() => onStartRecharge(powerId)}
                    className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                  >
                    Recharge
                  </button>
                )}
              </div>
              {activePower === powerId && status === "Active" && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">Selected for obstacle use</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
