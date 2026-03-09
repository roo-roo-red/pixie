"use client";

import { POWER_CONFIG, POWER_ORDER, POWERS } from "@/lib/game-data";
import { PowerId, PowerState } from "@/types/game";

interface PowerPanelProps {
  collectedPetals: Set<PowerId>;
  powers: Record<PowerId, PowerState>;
  now: number;
  activePower: PowerId | null;
  onActivate: (powerId: PowerId) => void;
  onStartRecharge: (powerId: PowerId) => void;
}

const POWER_COLORS: Record<PowerId, { main: string; glow: string; bg: string }> = {
  ice: { main: "#00d4ff", glow: "rgba(0,212,255,0.5)", bg: "rgba(0,212,255,0.12)" },
  fire: { main: "#ff6b35", glow: "rgba(255,107,53,0.5)", bg: "rgba(255,107,53,0.12)" },
  water: { main: "#4d7cff", glow: "rgba(77,124,255,0.5)", bg: "rgba(77,124,255,0.12)" },
  animalTalk: { main: "#39ff14", glow: "rgba(57,255,20,0.5)", bg: "rgba(57,255,20,0.12)" },
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
  size,
}: {
  progress: number;
  color: string;
  isActive: boolean;
  size: number;
}) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 0.5s linear",
          filter: isActive ? `drop-shadow(0 0 6px ${color})` : "none",
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
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: "rgba(10, 10, 30, 0.7)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
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
        const isReady = status === "Ready";

        // Calculate ring progress
        let ringProgress = 0;
        if (isActive && displayed.activeUntil) {
          const remaining = displayed.activeUntil - now;
          ringProgress = Math.max(0, remaining / POWER_CONFIG.activeMs);
        } else if (isRecharging && displayed.rechargeUntil) {
          const remaining = displayed.rechargeUntil - now;
          ringProgress = 1 - Math.max(0, remaining / POWER_CONFIG.rechargeMs);
        } else if (isCollected && !isEmpty) {
          ringProgress = 1;
        }

        // Timer text for recharging
        let timerText = "";
        if (isRecharging && displayed.rechargeUntil) {
          const secLeft = Math.ceil((displayed.rechargeUntil - now) / 1000);
          timerText = `${secLeft}`;
        } else if (isActive && displayed.activeUntil) {
          const secLeft = Math.ceil((displayed.activeUntil - now) / 1000);
          timerText = `${secLeft}`;
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
          <div key={powerId} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleClick}
              disabled={!isCollected}
              className="group relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 enabled:hover:scale-110 enabled:active:scale-95"
              style={{
                background: isActive ? colors.bg : isEmpty ? "rgba(255,0,0,0.05)" : "rgba(0,0,0,0.3)",
                border: `2px solid ${isActive ? colors.main : isReady ? `${colors.main}60` : "rgba(255,255,255,0.06)"}`,
                boxShadow: isActive
                  ? `0 0 25px ${colors.glow}, inset 0 0 15px ${colors.bg}`
                  : isReady
                    ? `0 0 12px ${colors.glow}40`
                    : "none",
                opacity: isCollected ? 1 : 0.2,
              }}
              title={`${definition.label}${isCollected ? ` - ${status}` : " (not collected)"}`}
            >
              <CooldownRing progress={ringProgress} color={colors.main} isActive={isActive} size={64} />
              <span className={`relative z-10 text-2xl ${isActive ? "animate-pulse-glow" : ""}`}>
                {icon}
              </span>

              {/* Timer overlay */}
              {timerText && (
                <span
                  className="absolute -bottom-0.5 z-10 rounded-full px-1.5 text-[10px] font-black tabular-nums"
                  style={{
                    background: "rgba(0,0,0,0.8)",
                    color: isActive ? colors.main : "rgba(255,255,255,0.6)",
                    border: `1px solid ${isActive ? colors.main : "rgba(255,255,255,0.15)"}40`,
                  }}
                >
                  {timerText}s
                </span>
              )}

              {/* Active indicator dot */}
              {activePower === powerId && isActive && (
                <div
                  className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full animate-pulse-glow"
                  style={{ background: colors.main, boxShadow: `0 0 10px ${colors.main}` }}
                />
              )}

              {/* Empty state — tap to recharge hint */}
              {isEmpty && isCollected && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white/40">Tap</span>
                </div>
              )}
            </button>

            {/* Label */}
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: isCollected ? `${colors.main}90` : "rgba(255,255,255,0.15)" }}
            >
              {definition.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
