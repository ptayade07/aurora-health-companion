import type { PersonalityMode } from "./personality";
import type { HealthInputs } from "./types";

type CopyBank = Record<PersonalityMode, string[]>;

const HYDRATION_LOW: CopyBank = {
  supportive: [
    "Your water intake is a little low today. A small glass could help.",
    "Hydration check — you're behind, but there's still time to catch up.",
  ],
  chaotic: [
    "Girl, your water bottle is emptier than my hopes of you sleeping before midnight.",
    "Water called. It misses you.",
    "Hydration level: desert lizard.",
    "Your kidneys have entered the chat.",
  ],
  brutally_honest: [
    "Bitch, you're running on vibes and dehydration.",
    "Your water intake is embarrassing today. Fix it.",
    "One glass of water. That's the assignment.",
  ],
};

const HYDRATION_GOOD: CopyBank = {
  supportive: [
    "Great hydration today — your body will thank you.",
    "You're doing wonderfully with your water goal.",
  ],
  chaotic: [
    "3-day hydration streak. Your kidneys would like to send a thank you note.",
    "Look at you hydrating like a functional adult.",
    "Water warrior behavior detected.",
  ],
  brutally_honest: [
    "Okay fine, you're actually drinking water today. Proud of you.",
    "Hydration on point. Don't get too comfortable though.",
  ],
};

const SLEEP_LOW: CopyBank = {
  supportive: [
    "You didn't get much sleep. Be gentle with yourself today.",
    "Rest might be your best move tonight.",
  ],
  chaotic: [
    "You got 5.5 hours of sleep. Your brain filed a formal complaint.",
    "Your sleep schedule has entered witness protection.",
  ],
  brutally_honest: [
    "That sleep was not it. Go to bed earlier tonight.",
    "Your brain is running on 2% battery.",
  ],
};

const HABITS_LOW: CopyBank = {
  supportive: [
    "A few quests are still waiting — you've got this.",
    "Small steps count. One habit at a time.",
  ],
  chaotic: [
    "One more completed quest and I start believing in you.",
    "Your quests are giving abandoned side mission energy.",
  ],
  brutally_honest: [
    "You skipped your quests again. Character development when?",
    "Do the thing. You know the thing.",
  ],
};

const GENERAL: CopyBank = {
  supportive: [
    "Every small step forward matters. I'm here with you.",
    "You're showing up — that's what counts.",
  ],
  chaotic: [
    "You opened Instagram 12 times today but still forgot to drink water.",
    "Monday survived. That's character development.",
  ],
  brutally_honest: [
    "We're not failing, we're just... aggressively resting.",
    "Be honest — how many times did you snooze today?",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getAuroraSays(
  personality: PersonalityMode,
  inputs: HealthInputs
): string {
  if (inputs.hydrationPct < 50) return pick(HYDRATION_LOW[personality]);
  if (inputs.hydrationPct >= 80) return pick(HYDRATION_GOOD[personality]);
  if (inputs.sleepHours !== null && inputs.sleepHours < 6)
    return pick(SLEEP_LOW[personality]);
  if (inputs.habitPct < 50) return pick(HABITS_LOW[personality]);
  return pick(GENERAL[personality]);
}

export function getWeeklyTea(day: string, personality: PersonalityMode): string {
  const teas: Record<PersonalityMode, Record<string, string>> = {
    supportive: {
      Mon: "A steady start to the week.",
      Tue: "You kept going — that matters.",
      Wed: "Midweek check-in: doing okay.",
      Thu: "Almost there. Keep it up.",
      Fri: "Week well spent.",
      Sat: "Rest and recharge.",
      Sun: "Ready for a fresh week.",
    },
    chaotic: {
      Mon: "Survived.",
      Tue: "Forgot water existed.",
      Wed: "Character development started.",
      Thu: "Your sleep schedule filed for divorce.",
      Fri: "Main character behavior.",
      Sat: "Touch grass (hydrated version).",
      Sun: "Weekly reset. Don't blow it.",
    },
    brutally_honest: {
      Mon: "Monday chaos. Classic.",
      Tue: "Tuesday and still no water. Interesting.",
      Wed: "Halfway through the week. Do better.",
      Thu: "Thursday slump is showing.",
      Fri: "Friday excuses incoming.",
      Sat: "Weekend doesn't mean abandon all habits.",
      Sun: "New week, new you? Prove it.",
    },
  };
  return teas[personality][day] ?? "Another day in the Aurora universe.";
}

export function getCompanionGreeting(
  name: string,
  stats: {
    sleepHours: number | null;
    waterMl: number;
    waterGoalMl: number;
    pendingHabit: string | null;
  },
  personality: PersonalityMode
): string {
  const remaining = Math.max(0, stats.waterGoalMl - stats.waterMl);
  const sleepLine =
    stats.sleepHours !== null
      ? `You slept ${stats.sleepHours} hours.`
      : "No sleep logged yet.";
  const waterLine =
    remaining > 0
      ? `You're ${remaining}ml behind on water.`
      : "Hydration goal crushed today.";
  const habitLine = stats.pendingHabit
    ? `Your ${stats.pendingHabit} quest is waiting.`
    : "All quests done for now.";

  if (personality === "chaotic") {
    return `Hey ${name}.\n${sleepLine}\n${waterLine}\n${habitLine}\nWhat's the move today?`;
  }
  if (personality === "brutally_honest") {
    return `${name}. Real talk:\n${sleepLine}\n${waterLine}\n${habitLine}\nWhat's the plan?`;
  }
  return `Good to see you, ${name}.\n${sleepLine}\n${waterLine}\n${habitLine}\nHow can I help today?`;
}
