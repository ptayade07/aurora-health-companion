import type { HealthInputs } from "./types";

export type Vibe = {
  emoji: string;
  title: string;
};

export function getTodaysVibe(inputs: HealthInputs): Vibe {
  const { hydrationPct, sleepHours, habitPct } = inputs;

  if (hydrationPct >= 80 && (sleepHours ?? 0) >= 7 && habitPct >= 70) {
    return { emoji: "✨", title: "Main Character Energy" };
  }
  if (hydrationPct >= 80) {
    return { emoji: "🌊", title: "Hydration Queen" };
  }
  if (hydrationPct < 40) {
    return { emoji: "🦎", title: "Hydration Goblin" };
  }
  if ((sleepHours ?? 0) > 0 && sleepHours! < 6) {
    return { emoji: "😴", title: "Sleep-Deprived Wizard" };
  }
  if (habitPct >= 80) {
    return { emoji: "🔥", title: "Consistency Demon" };
  }
  if (habitPct >= 50) {
    return { emoji: "🌱", title: "Self-Improvement Arc" };
  }
  return { emoji: "🌀", title: "Chaos Mode Activated" };
}
