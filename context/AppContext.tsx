import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateHealthScore } from "../lib/healthScore";
import { getPetState } from "../lib/pet";
import { getTodaysVibe } from "../lib/vibes";
import { getAuroraSays } from "../lib/copy";
import { getMoodFromScore, type CompanionMood } from "../lib/companion";
import type { CompanionType } from "../lib/companion";
import type { PersonalityMode } from "../lib/personality";
import type {
  DailyStats,
  Habit,
  HabitLog,
  Mood,
  UserProfile,
  SleepEntry,
  NutritionEntry,
} from "../lib/types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Keys
const DEVICE_KEY  = "@aurora_state_v2";          // non-Supabase single-user
const INTRO_KEY   = "@aurora_intro_v1";           // device-level intro flag
function userDataKey(uid: string) { return `@aurora_data_${uid}`; }
function userCmpKey(uid: string | null) { return `@aurora_cmp_${uid ?? "device"}`; }

const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "Meditate", icon: "", completedToday: false, streak: 0 },
  { id: "2", name: "Walk", icon: "", completedToday: false, streak: 0 },
  { id: "3", name: "Read", icon: "", completedToday: false, streak: 0 },
];

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  goals: [],
  waterGoalMl: 2500,
  personality: "chaotic",
  onboarded: false,
  companionType: "fox",
};

const defaultStats: DailyStats = {
  waterMl: 0,
  sleepHours: null,
  habitsCompleted: 0,
  habitsTotal: 3,
  mood: null,
  mealsLogged: 0,
};

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

type UserWellnessData = {
  stats: DailyStats;
  habits: Habit[];
  habitLogs: Record<string, HabitLog[]>;
  sleepHistory: SleepEntry[];
  nutritionLogs: NutritionEntry[];
};

type AppState = {
  profile: UserProfile;
  stats: DailyStats;
  habits: Habit[];
  habitLogs: Record<string, HabitLog[]>;
  sleepHistory: SleepEntry[];
  nutritionLogs: NutritionEntry[];
  introSeen: boolean;
  loggedIn: boolean;
  userId: string | null;
};

type AppContextValue = AppState & {
  healthScore: number;
  pet: ReturnType<typeof getPetState>;
  vibe: ReturnType<typeof getTodaysVibe>;
  auroraSays: string;
  hydrationPct: number;
  habitPct: number;
  companionMood: CompanionMood;
  todayNutrition: NutritionEntry[];
  setIntroSeen: () => void;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setPersonality: (mode: PersonalityMode) => void;
  setCompanionType: (type: CompanionType) => void;
  addWater: (ml: number) => void;
  logSleep: (hours: number) => void;
  setMood: (mood: Mood) => void;
  toggleHabit: (id: string) => void;
  addHabit: (name: string, icon?: string) => void;
  logMeal: (type: string) => void;
  addNutrition: (mealType: NutritionEntry["mealType"], description?: string) => void;
  removeNutrition: (id: string) => void;
  habitLogs: Record<string, HabitLog[]>;
  addHabitLog: (habitId: string, value: number, meta?: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyWellnessData(
  data: Partial<UserWellnessData>,
  setters: {
    setStats: (s: DailyStats) => void;
    setHabits: (h: Habit[]) => void;
    setHabitLogs: (l: Record<string, HabitLog[]>) => void;
    setSleepHistory: (s: SleepEntry[]) => void;
    setNutritionLogs: (n: NutritionEntry[]) => void;
  }
) {
  if (data.stats) setters.setStats(data.stats);
  if (data.habits) setters.setHabits(data.habits);
  if (data.habitLogs) setters.setHabitLogs(data.habitLogs);
  if (data.sleepHistory) setters.setSleepHistory(data.sleepHistory);
  if (data.nutritionLogs) setters.setNutritionLogs(data.nutritionLogs);
}

function clearWellnessData(setters: {
  setStats: (s: DailyStats) => void;
  setHabits: (h: Habit[]) => void;
  setHabitLogs: (l: Record<string, HabitLog[]>) => void;
  setSleepHistory: (s: SleepEntry[]) => void;
  setNutritionLogs: (n: NutritionEntry[]) => void;
}) {
  setters.setStats(defaultStats);
  setters.setHabits(DEFAULT_HABITS);
  setters.setHabitLogs({});
  setters.setSleepHistory([]);
  setters.setNutritionLogs([]);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [stats, setStats] = useState<DailyStats>(defaultStats);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [habitLogs, setHabitLogs] = useState<Record<string, HabitLog[]>>({});
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionEntry[]>([]);
  const [introSeen, setIntroSeenState] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const setters = { setStats, setHabits, setHabitLogs, setSleepHistory, setNutritionLogs };

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Intro flag is device-level (not per-user)
      const introRaw = await AsyncStorage.getItem(INTRO_KEY);
      if (introRaw === "1") setIntroSeenState(true);

      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const uid = session.user.id;
          setLoggedIn(true);
          setUserId(uid);

          // Load THIS user's wellness data; migrate from old single-key if new key is empty
          const dataRaw = await AsyncStorage.getItem(userDataKey(uid));
          if (dataRaw) {
            applyWellnessData(JSON.parse(dataRaw), setters);
          } else {
            // One-time migration: copy old @aurora_state_v2 data to this user's key
            const oldRaw = await AsyncStorage.getItem(DEVICE_KEY);
            if (oldRaw) {
              const old = JSON.parse(oldRaw);
              applyWellnessData(old, setters);
              // Save under new user key so migration only runs once
              await AsyncStorage.setItem(userDataKey(uid), JSON.stringify({
                stats: old.stats, habits: old.habits, habitLogs: old.habitLogs ?? {},
                sleepHistory: old.sleepHistory ?? [], nutritionLogs: old.nutritionLogs ?? [],
              }));
            }
          }

          // Load profile from Supabase
          const { data: p } = await supabase
            .from("profiles").select("*").eq("id", uid).single();
          if (p) {
            setProfile({
              ...DEFAULT_PROFILE,
              name: p.name || "",
              age: p.age,
              gender: p.gender,
              goals: p.goals || [],
              waterGoalMl: p.water_goal_ml || 2500,
              personality: p.personality || "chaotic",
              onboarded: true,
            });
          }

          // Load THIS user's companion choice
          const cmp = await AsyncStorage.getItem(userCmpKey(uid));
          if (cmp) setProfile((pr) => ({ ...pr, companionType: cmp as CompanionType }));
        }
      } else {
        // Non-Supabase device mode
        const raw = await AsyncStorage.getItem(DEVICE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppState>;
          applyWellnessData(saved, setters);
          if (saved.loggedIn) setLoggedIn(saved.loggedIn);
          if (saved.profile) setProfile(saved.profile);
          // Companion override from device key
          const cmp = await AsyncStorage.getItem(userCmpKey(null));
          if (cmp) setProfile((pr) => ({ ...pr, companionType: cmp as CompanionType }));
        }
      }

      setReady(true);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist ─────────────────────────────────────────────────────────────────
  // Supabase mode: save per-user wellness data
  useEffect(() => {
    if (!ready || !isSupabaseConfigured || !userId) return;
    AsyncStorage.setItem(userDataKey(userId), JSON.stringify({
      stats, habits, habitLogs, sleepHistory, nutritionLogs,
    }));
  }, [stats, habits, habitLogs, sleepHistory, nutritionLogs, userId, ready]);

  // Non-Supabase mode: save full state
  useEffect(() => {
    if (!ready || isSupabaseConfigured) return;
    AsyncStorage.setItem(DEVICE_KEY, JSON.stringify({
      profile, stats, habits, habitLogs, sleepHistory, nutritionLogs, introSeen, loggedIn,
    }));
  }, [profile, stats, habits, habitLogs, sleepHistory, nutritionLogs, introSeen, loggedIn, ready]);

  // Intro flag: device-level
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(INTRO_KEY, introSeen ? "1" : "0");
  }, [introSeen, ready]);

  // ── Computed values ─────────────────────────────────────────────────────────
  const hydrationPct = useMemo(
    () => Math.min(100, (stats.waterMl / profile.waterGoalMl) * 100),
    [stats.waterMl, profile.waterGoalMl]
  );
  const habitPct = useMemo(() => {
    const total = habits.length || 1;
    const done = habits.filter((h) => h.completedToday).length;
    return (done / total) * 100;
  }, [habits]);
  const healthInputs = useMemo(
    () => ({ hydrationPct, sleepHours: stats.sleepHours, habitPct, mood: stats.mood }),
    [hydrationPct, stats.sleepHours, habitPct, stats.mood]
  );
  const healthScore   = useMemo(() => calculateHealthScore(healthInputs), [healthInputs]);
  const pet           = useMemo(() => getPetState(healthScore), [healthScore]);
  const vibe          = useMemo(() => getTodaysVibe(healthInputs), [healthInputs]);
  const companionMood = useMemo(() => getMoodFromScore(healthScore), [healthScore]);
  const auroraSays    = useMemo(
    () => getAuroraSays(profile.personality, healthInputs),
    [profile.personality, healthInputs]
  );
  const todayNutrition = useMemo(() => {
    const today = getTodayStr();
    return nutritionLogs.filter((n) => n.date === today);
  }, [nutritionLogs]);

  const syncHabitStats = useCallback((next: Habit[]) => {
    setStats((s) => ({
      ...s,
      habitsCompleted: next.filter((h) => h.completedToday).length,
      habitsTotal: next.length,
    }));
  }, []);

  // ── Auth actions ────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      if (data.user) {
        const uid = data.user.id;
        setUserId(uid);
        setLoggedIn(true);

        // Load THIS user's saved wellness data; migrate from old key if new key empty
        const dataRaw = await AsyncStorage.getItem(userDataKey(uid));
        if (dataRaw) {
          applyWellnessData(JSON.parse(dataRaw), setters);
        } else {
          const oldRaw = await AsyncStorage.getItem(DEVICE_KEY);
          if (oldRaw) {
            const old = JSON.parse(oldRaw);
            applyWellnessData(old, setters);
            await AsyncStorage.setItem(userDataKey(uid), JSON.stringify({
              stats: old.stats, habits: old.habits, habitLogs: old.habitLogs ?? {},
              sleepHistory: old.sleepHistory ?? [], nutritionLogs: old.nutritionLogs ?? [],
            }));
          } else {
            clearWellnessData(setters);
          }
        }

        // Load Supabase profile
        const { data: p } = await supabase
          .from("profiles").select("*").eq("id", uid).single();
        if (p) {
          setProfile({
            ...DEFAULT_PROFILE,
            name: p.name || "",
            age: p.age,
            gender: p.gender,
            goals: p.goals || [],
            waterGoalMl: p.water_goal_ml || 2500,
            personality: p.personality || "chaotic",
            onboarded: true,
          });
        }

        // Load THIS user's companion
        const cmp = await AsyncStorage.getItem(userCmpKey(uid));
        if (cmp) setProfile((pr) => ({ ...pr, companionType: cmp as CompanionType }));
      }
      return null;
    }
    setLoggedIn(true);
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return error.message;
      if (data.user) {
        setUserId(data.user.id);
        setLoggedIn(true);
      }
      return null;
    }
    setLoggedIn(true);
    return null;
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    // Clear everything — next login loads that user's own data
    setLoggedIn(false);
    setUserId(null);
    setProfile(DEFAULT_PROFILE);
    clearWellnessData(setters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completeOnboarding = useCallback(
    async (data: Partial<UserProfile>) => {
      const next = { ...DEFAULT_PROFILE, ...data, onboarded: true } as UserProfile;
      setProfile(next);
      setLoggedIn(true);

      if (data.companionType) {
        await AsyncStorage.setItem(userCmpKey(userId), data.companionType);
      }

      if (isSupabaseConfigured && supabase && userId) {
        await supabase.from("profiles").upsert({
          id: userId,
          name: data.name || "",
          goals: data.goals || [],
          water_goal_ml: data.waterGoalMl || 2500,
          personality: data.personality || "chaotic",
        });
      }
    },
    [userId]
  );

  // ── Data actions ────────────────────────────────────────────────────────────
  const addNutrition = useCallback(
    (mealType: NutritionEntry["mealType"], description = "") => {
      const entry: NutritionEntry = {
        id: Date.now().toString(),
        date: getTodayStr(),
        mealType,
        description,
      };
      setNutritionLogs((prev) => [...prev, entry]);
      setStats((s) => ({ ...s, mealsLogged: s.mealsLogged + 1 }));
    },
    []
  );

  const removeNutrition = useCallback((id: string) => {
    setNutritionLogs((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      const todayCount = filtered.filter((n) => n.date === getTodayStr()).length;
      setStats((s) => ({ ...s, mealsLogged: todayCount }));
      return filtered;
    });
  }, []);

  // ── Context value ───────────────────────────────────────────────────────────
  const value: AppContextValue = {
    profile,
    stats,
    habits,
    sleepHistory,
    nutritionLogs,
    introSeen,
    loggedIn,
    userId,
    healthScore,
    pet,
    vibe,
    auroraSays,
    hydrationPct,
    habitPct,
    companionMood,
    todayNutrition,
    setIntroSeen: () => setIntroSeenState(true),
    completeOnboarding,
    login,
    signup,
    logout,
    setPersonality: (mode) => {
      setProfile((p) => ({ ...p, personality: mode }));
      if (isSupabaseConfigured && supabase && userId) {
        supabase.from("profiles").update({ personality: mode }).eq("id", userId);
      }
    },
    setCompanionType: (type) => {
      AsyncStorage.setItem(userCmpKey(userId), type);
      setProfile((p) => ({ ...p, companionType: type }));
    },
    addWater: (ml) => setStats((s) => ({ ...s, waterMl: s.waterMl + ml })),
    logSleep: (hours) => {
      setStats((s) => ({ ...s, sleepHours: hours }));
      const today = getTodayStr();
      setSleepHistory((prev) => {
        const without = prev.filter((e) => e.date !== today);
        return [...without, { date: today, hours }].sort((a, b) =>
          a.date.localeCompare(b.date)
        );
      });
    },
    setMood: (mood) => setStats((s) => ({ ...s, mood })),
    toggleHabit: (id) => {
      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === id
            ? { ...h, completedToday: !h.completedToday, streak: !h.completedToday ? h.streak + 1 : h.streak }
            : h
        );
        syncHabitStats(next);
        return next;
      });
    },
    addHabit: (name, icon = "") => {
      setHabits((prev) => {
        const next = [
          ...prev,
          { id: Date.now().toString(), name, icon, completedToday: false, streak: 0 },
        ];
        syncHabitStats(next);
        return next;
      });
    },
    logMeal: (type) => addNutrition(type as NutritionEntry["mealType"]),
    addNutrition,
    removeNutrition,
    habitLogs,
    addHabitLog: (habitId: string, value: number, meta?: string) => {
      const entry: HabitLog = {
        id: Date.now().toString(),
        date: getTodayStr(),
        value,
        hour: new Date().getHours(),
        meta,
      };
      setHabitLogs((prev) => ({
        ...prev,
        [habitId]: [...(prev[habitId] ?? []), entry],
      }));
      setHabits((prev) => {
        const already = prev.find((h) => h.id === habitId)?.completedToday;
        if (already) return prev;
        const next = prev.map((h) =>
          h.id === habitId ? { ...h, completedToday: true, streak: h.streak + 1 } : h
        );
        syncHabitStats(next);
        return next;
      });
    },
  };

  if (!ready) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
