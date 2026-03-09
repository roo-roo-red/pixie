"use client";

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

const POWER_COLORS: Record<PowerId, { main: string; glow: string }> = {
  ice: { main: "#00d4ff", glow: "rgba(0,212,255,0.4)" },
  fire: { main: "#ff6b35", glow: "rgba(255,107,53,0.4)" },
  water: { main: "#4d7cff", glow: "rgba(77,124,255,0.4)" },
  animalTalk: { main: "#39ff14", glow: "rgba(57,255,20,0.4)" },
};

const POWER_ICONS: Record<PowerId, string> = {
  ice: "\u2744\uFE0F",
  fire: "\uD83D\uDD25",
  water: "\uD83D\uDCA7",
  animalTalk: "\uD83D\uDC3E",
};

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
  if (power.activeUntil && power.activeUntil > now) return "Active";
  if (power.rechargeUntil && power.rechargeUntil > now) return "Recharging";
  if (power.energy === 0) return "Empty";
  return "Ready";
}

function CooldownRing({
  progress,
  color,
  isActive,
}: {
  progress: number;
  color: string;
  isActive: boolean;
}) {
  const circumference = 2 * Math.PI * 25;
  const offset = circumference * (1 - progress);

  return (
    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
      {/* Background ring */}
      <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      {/* Progress ring */}
      <circle
        cx="28"
        cy="28"
        r="25"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 1s linear",
          filter: isActive ? `drop-shadow(0 0 4px ${color})` : "none",
        }}
      />
    </svg>
  );
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
    <div className="glass-panel flex items-center gap-2 px-3 py-2">
      {POWER_ORDER.map((powerId) => {
        const definition = POWERS.find((entry) => entry.id === powerId);
        if (!definition) return null;

        const displayed = resolveForDisplay(powers[powerId], now);
        const isCollected = collectedPetals.has(powerId);
        const status = getPowerStatus(displayed, now);
        const colors = POWER_COLORS[powerId];
        const icon = POWER_ICONS[powerId];

        const isActive = status === "Active";
        const isEmpty = status === "Empty";
        const isRecharging = status === "Recharging";

        // Calculate ring progress
        let ringProgress = 0;
        if (isActive && displayed.activeUntil) {
          const totalMs = 9000;
          const remaining = displayed.activeUntil - now;
          ringProgress = Math.max(0, remaining / totalMs);
        } else if (isRecharging && displayed.rechargeUntil) {
          const totalMs = 75000;
          const remaining = displayed.rechargeUntil - now;
          ringProgress = 1 - Math.max(0, remaining / totalMs);
        } else if (isCollected && !isEmpty) {
          ringProgress = 1;
        }

        const handleClick = () => {
          if (!isCollected) return;
          if (isEmpty) {
            onStartRecharge(powerId);
          } else {
            onActivate(powerId);
          }
        };

        return (
          <button
            key={powerId}
            type="button"
            onClick={handleClick}
            disabled={!isCollected}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 enabled:hover:scale-110 enabled:active:scale-95 disabled:opacity-25"
            style={{
              background: isActive ? `${colors.main}25` : "rgba(0,0,0,0.3)",
              boxShadow: isActive ? `0 0 20px ${colors.glow}` : "none",
            }}
            title={`${definition.label}${isCollected ? ` - ${status}` : " (not collected)"}`}
          >
            <CooldownRing progress={ringProgress} color={colors.main} isActive={isActive} />
            <span className={`relative z-10 text-xl ${isActive ? "animate-pulse-glow" : ""}`}>
              {icon}
            </span>

            {/* Energy dots */}
            {isCollected && (
              <div className="absolute -bottom-1 flex gap-0.5">
                {Array.from({ length: displayed.maxEnergy }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: i < displayed.energy ? colors.main : "rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Active power indicator */}
            {activePower === powerId && isActive && (
              <div
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full animate-pulse-glow"
                style={{ background: colors.main }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
