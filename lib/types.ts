import type { PersonalityMode } from "./personality";
import type { CompanionType } from "./companion";

export type Mood = "dead_inside" | "sleepy" | "fine" | "slaying" | "unstoppable";

export type Habit = {
  id: string;
  name: string;
  icon: string;
  completedToday: boolean;
  streak: number;
};

export type UserProfile = {
  name: string;
  age?: number;
  gender?: string;
  goals: string[];
  waterGoalMl: number;
  personality: PersonalityMode;
  onboarded: boolean;
  companionType?: CompanionType;
};

export type DailyStats = {
  waterMl: number;
  sleepHours: number | null;
  habitsCompleted: number;
  habitsTotal: number;
  mood: Mood | null;
  mealsLogged: number;
};

export type HealthInputs = {
  hydrationPct: number;
  sleepHours: number | null;
  habitPct: number;
  mood: Mood | null;
};

export type SleepEntry = {
  date: string; // YYYY-MM-DD
  hours: number;
};

export type HabitLog = {
  id: string;
  date: string;    // YYYY-MM-DD
  value: number;   // steps / minutes / pages
  hour: number;    // 0-23, time when logged
  meta?: string;   // e.g. exercise type: "Cardio" | "Strength" | "Flexibility"
};

export type NutritionEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
};

export type AuroraAction =
  | { type: "add_water"; ml: number }
  | { type: "log_sleep"; hours: number }
  | { type: "create_habit"; name: string; icon: string }
  | { type: "log_meal"; mealType: string; description?: string }
  | { type: "set_mood"; mood: Mood }
  | { type: "none" };

export type AuroraResponse = {
  message: string;
  action: AuroraAction;
};
