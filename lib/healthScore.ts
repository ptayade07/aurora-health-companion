import type { HealthInputs, Mood } from "./types";

const MOOD_SCORE: Record<Mood, number> = {
  dead_inside: 20,
  sleepy: 45,
  fine: 65,
  slaying: 85,
  unstoppable: 100,
};

export function calculateHealthScore(inputs: HealthInputs): number {
  const hydration = Math.min(100, inputs.hydrationPct);
  const sleep =
    inputs.sleepHours === null
      ? 50
      : Math.min(100, (inputs.sleepHours / 8) * 100);
  const habits = inputs.habitPct;
  const mood = inputs.mood ? MOOD_SCORE[inputs.mood] : 50;

  return Math.round(hydration * 0.3 + sleep * 0.3 + habits * 0.25 + mood * 0.15);
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Main Character Energy";
  if (score >= 75) return "Doing Great";
  if (score >= 50) return "Surviving";
  if (score >= 25) return "Needs Love";
  return "Emergency Mode";
}
