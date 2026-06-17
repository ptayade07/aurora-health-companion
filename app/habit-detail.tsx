import { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

// ── Palette ────────────────────────────────────────────────────────────────────
const LIME        = "#C8FF00";
const LIME_DIM    = "rgba(200,255,0,0.08)";
const LIME_BORDER = "rgba(200,255,0,0.18)";
const BG          = "#070707";
const CARD        = "#101010";
const CARD_ALT    = "#181818";
const MUTED       = "rgba(255,255,255,0.30)";
const SOFT        = "rgba(255,255,255,0.65)";
const BORDER      = "rgba(255,255,255,0.07)";
const AMBER       = "#FBBF24";
const BLUE        = "#60C8FF";
const PURPLE      = "#A78BFA";
const RED         = "#F87171";

// ── Habit type detection ──────────────────────────────────────────────────────
type HabitType = "walk" | "reading" | "exercise" | "generic";

function detectType(name: string): HabitType {
  const n = name.toLowerCase();
  if (/\b(walk|walks|walking|steps?|run|running|jog|jogging|hike|hiking|stroll)\b/.test(n)) return "walk";
  if (/\b(read|reads|reading|book|books|pages?|novel|study|studying)\b/.test(n)) return "reading";
  if (/\b(exercise|exercises?|gym|workout|workouts?|lift|lifting|yoga|stretch|stretching|swim|swimming|cycle|cycling|bike|biking|cardio|strength|hiit|pilates|crossfit)\b/.test(n)) return "exercise";
  return "generic";
}

const TYPE_CONFIG: Record<HabitType, {
  accentColor: string;
  inputLabel: string;
  placeholder: string;
  unit: string;
  logLabel: string;
  formatValue: (v: number) => string;
}> = {
  walk: {
    accentColor: LIME,
    inputLabel: "Steps today",
    placeholder: "e.g. 8000",
    unit: "steps",
    logLabel: "Log walk",
    formatValue: (v) => `${v.toLocaleString()} steps`,
  },
  reading: {
    accentColor: AMBER,
    inputLabel: "Minutes read",
    placeholder: "e.g. 30",
    unit: "min",
    logLabel: "Log reading session",
    formatValue: (v) => `${v} min`,
  },
  exercise: {
    accentColor: BLUE,
    inputLabel: "Duration (minutes)",
    placeholder: "e.g. 45",
    unit: "min",
    logLabel: "Log workout",
    formatValue: (v) => `${v} min`,
  },
  generic: {
    accentColor: "#9999AA",
    inputLabel: "Value (optional)",
    placeholder: "e.g. 1",
    unit: "",
    logLabel: "Mark complete",
    formatValue: (v) => `${v}`,
  },
};

const EXERCISE_TYPES = ["Cardio", "Strength", "Flexibility"] as const;
type ExerciseType = (typeof EXERCISE_TYPES)[number];

const EXERCISE_COLORS: Record<ExerciseType, string> = {
  Cardio:      LIME,
  Strength:    AMBER,
  Flexibility: BLUE,
};

const TIME_SLOTS = [
  { label: "Morning",   range: "5am–12pm",  hours: [5,6,7,8,9,10,11],          color: AMBER  },
  { label: "Afternoon", range: "12pm–6pm",   hours: [12,13,14,15,16,17],         color: LIME   },
  { label: "Evening",   range: "6pm–10pm",   hours: [18,19,20,21],               color: BLUE   },
  { label: "Night",     range: "10pm–5am",   hours: [22,23,0,1,2,3,4],           color: PURPLE },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function dateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function shortDay(dateIso: string) {
  return new Date(dateIso + "T12:00:00").toLocaleDateString("en", { weekday: "short" });
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <View style={dv.row}>
      <View style={dv.line} />
      <Text style={dv.text}>{label}</Text>
      <View style={dv.line} />
    </View>
  );
}
const dv = StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: BORDER },
  text: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HabitDetailScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const params  = useLocalSearchParams<{ id: string; name: string }>();
  const habitId = params.id ?? "";
  const habitName = params.name ?? "Habit";
  const type    = detectType(habitName);
  const config  = TYPE_CONFIG[type];
  const { habits, habitLogs, addHabitLog, toggleHabit } = useApp();

  const habit = habits.find((h) => h.id === habitId);

  const [inputValue, setInputValue]     = useState("");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("Cardio");
  const [logged, setLogged]             = useState(false);

  const logsForHabit = useMemo(() => habitLogs[habitId] ?? [], [habitLogs, habitId]);

  // ── Aggregate logs by date ────────────────────────────────────────────────
  const logsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    logsForHabit.forEach((l) => {
      map[l.date] = (map[l.date] ?? 0) + l.value;
    });
    return map;
  }, [logsForHabit]);

  // ── Last 28 days for calendar ─────────────────────────────────────────────
  const calDays = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => {
      const iso = dateStr(27 - i);
      const val = logsByDate[iso];
      const isToday = iso === todayStr();
      const hasLog  = val !== undefined;
      return { iso, val, isToday, hasLog };
    }),
  [logsByDate]);

  // ── Last 7 days for weekly chart ──────────────────────────────────────────
  const weekData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const iso = dateStr(6 - i);
      return { iso, day: shortDay(iso), val: logsByDate[iso] ?? 0, isToday: iso === todayStr() };
    }),
  [logsByDate]);
  const weekMax = Math.max(...weekData.map((d) => d.val), 1);

  // ── Time of day ───────────────────────────────────────────────────────────
  const timeSlotCounts = useMemo(() =>
    TIME_SLOTS.map((slot) => ({
      ...slot,
      count: logsForHabit.filter((l) => slot.hours.includes(l.hour)).length,
    })),
  [logsForHabit]);
  const maxSlotCount = Math.max(...timeSlotCounts.map((s) => s.count), 1);

  // ── Exercise type breakdown ───────────────────────────────────────────────
  const exerciseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logsForHabit.forEach((l) => {
      if (l.meta) counts[l.meta] = (counts[l.meta] ?? 0) + 1;
    });
    return counts;
  }, [logsForHabit]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalThisWeek = weekData.reduce((s, d) => s + d.val, 0);
  const avgThisWeek   = weekData.filter((d) => d.val > 0).length > 0
    ? Math.round(totalThisWeek / weekData.filter((d) => d.val > 0).length)
    : 0;
  const bestEver      = Math.max(...logsForHabit.map((l) => l.value), 0);
  const bestDate      = bestEver > 0
    ? logsForHabit.find((l) => l.value === bestEver)?.date
    : null;

  const todayAlreadyLogged = logsByDate[todayStr()] !== undefined;

  // ── Handle log ────────────────────────────────────────────────────────────
  const handleLog = () => {
    if (type === "generic") {
      if (!habit?.completedToday) toggleHabit(habitId);
      setLogged(true);
      return;
    }
    const val = parseInt(inputValue, 10);
    if (!val || val <= 0) return;
    addHabitLog(habitId, val, type === "exercise" ? exerciseType : undefined);
    setInputValue("");
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  const accentColor = config.accentColor;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={SOFT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{habitName}</Text>
        {habit && habit.streak > 0 ? (
          <View style={[s.streakBadge, { borderColor: accentColor + "44", backgroundColor: accentColor + "12" }]}>
            <Text style={[s.streakTxt, { color: accentColor }]}>{habit.streak}d</Text>
          </View>
        ) : <View style={{ width: 46 }} />}
      </View>

      {/* ── Quick stats ── */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: accentColor }]}>{habit?.streak ?? 0}</Text>
          <Text style={s.statLbl}>current streak</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statNum}>{logsForHabit.length}</Text>
          <Text style={s.statLbl}>total sessions</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={[s.statNum, bestEver > 0 ? { color: accentColor } : {}]}>
            {bestEver > 0 ? (type === "walk" ? (bestEver >= 1000 ? `${(bestEver / 1000).toFixed(1)}k` : `${bestEver}`) : `${bestEver}`) : "—"}
          </Text>
          <Text style={s.statLbl}>best {type === "walk" ? "steps" : "min"}</Text>
        </View>
      </View>

      {/* ── Log today ── */}
      <Divider label="LOG TODAY" />

      <View style={[s.logCard, todayAlreadyLogged && s.logCardDone]}>
        {todayAlreadyLogged ? (
          <View style={s.loggedRow}>
            <View style={[s.checkCircle, { backgroundColor: accentColor }]}>
              <Ionicons name="checkmark" size={16} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.loggedTitle}>Logged today</Text>
              <Text style={s.loggedSub}>
                {config.formatValue(logsByDate[todayStr()] ?? 0)} — tap again to add more
              </Text>
            </View>
            <TouchableOpacity
              style={s.logMoreBtn}
              onPress={() => setLogged(false)}
            >
              <Text style={[s.logMoreTxt, { color: accentColor }]}>+ Add</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {(!todayAlreadyLogged || true) && type !== "generic" && (
          <View style={s.logForm}>
            {type === "exercise" && (
              <View style={s.typeRow}>
                {EXERCISE_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      s.typeChip,
                      exerciseType === t && {
                        backgroundColor: EXERCISE_COLORS[t] + "18",
                        borderColor: EXERCISE_COLORS[t] + "55",
                      },
                    ]}
                    onPress={() => setExerciseType(t)}
                  >
                    <View style={[s.typeDot, { backgroundColor: exerciseType === t ? EXERCISE_COLORS[t] : MUTED }]} />
                    <Text style={[s.typeTxt, exerciseType === t && { color: EXERCISE_COLORS[t] }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder={config.placeholder}
                placeholderTextColor={MUTED}
                keyboardType="numeric"
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleLog}
                returnKeyType="done"
              />
              {config.unit ? <Text style={s.inputUnit}>{config.unit}</Text> : null}
            </View>

            <TouchableOpacity
              style={[s.logBtn, { borderColor: accentColor + "44", backgroundColor: accentColor + "10" }]}
              onPress={handleLog}
              activeOpacity={0.8}
            >
              {logged ? (
                <Text style={[s.logBtnTxt, { color: accentColor }]}>Saved.</Text>
              ) : (
                <Text style={[s.logBtnTxt, { color: accentColor }]}>{config.logLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {type === "generic" && (
          <TouchableOpacity
            style={[s.logBtn, {
              borderColor: habit?.completedToday ? accentColor + "44" : BORDER,
              backgroundColor: habit?.completedToday ? accentColor + "10" : CARD_ALT,
            }]}
            onPress={handleLog}
            activeOpacity={0.8}
          >
            {habit?.completedToday ? (
              <Text style={[s.logBtnTxt, { color: accentColor }]}>Done today</Text>
            ) : (
              <Text style={[s.logBtnTxt, { color: SOFT }]}>Mark as done</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── 28-day calendar ── */}
      <Divider label="LAST 28 DAYS" />

      <View style={s.calCard}>
        {/* Day header */}
        <View style={s.calHeader}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <Text key={i} style={s.calHeaderTxt}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid — 4 rows of 7 */}
        <View style={s.calGrid}>
          {calDays.map((day, i) => {
            const isEmpty = !day.hasLog && !day.isToday;
            const intensity = day.val !== undefined && weekMax > 0
              ? Math.max(0.2, Math.min(1, day.val / (type === "walk" ? 10000 : 60)))
              : 0;
            return (
              <View key={i} style={s.calCell}>
                <View style={[
                  s.calDot,
                  day.hasLog  && { backgroundColor: accentColor, opacity: 0.4 + intensity * 0.6 },
                  day.isToday && !day.hasLog && { borderColor: accentColor, borderWidth: 1.5 },
                ]}>
                  {day.isToday && day.hasLog && (
                    <View style={[s.calDotInner, { backgroundColor: accentColor }]} />
                  )}
                </View>
                {day.isToday && (
                  <View style={[s.calTodayPip, { backgroundColor: accentColor }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View style={s.calLegend}>
          <View style={[s.calDot, { backgroundColor: accentColor, opacity: 0.35 }]} />
          <Text style={s.calLegendTxt}>Logged</Text>
          <View style={[s.calDot, { borderColor: accentColor, borderWidth: 1.5 }]} />
          <Text style={s.calLegendTxt}>Today</Text>
        </View>
      </View>

      {/* ── This week bar chart (non-generic) ── */}
      {type !== "generic" && (
        <>
          <Divider label="THIS WEEK" />
          <View style={s.weekCard}>
            <View style={s.weekTopRow}>
              <View>
                <Text style={s.weekTotal}>
                  {type === "walk"
                    ? `${totalThisWeek.toLocaleString()} steps`
                    : `${totalThisWeek} min`}
                </Text>
                <Text style={s.weekTotalLbl}>total this week</Text>
              </View>
              {avgThisWeek > 0 && (
                <View style={[s.avgBadge, { borderColor: accentColor + "33", backgroundColor: accentColor + "0E" }]}>
                  <Text style={[s.avgTxt, { color: accentColor }]}>
                    avg {type === "walk" ? `${avgThisWeek.toLocaleString()} steps` : `${avgThisWeek} min`}
                  </Text>
                </View>
              )}
            </View>

            <View style={s.weekBars}>
              {weekData.map((d, i) => {
                const barPct = weekMax > 0 ? d.val / weekMax : 0;
                return (
                  <View key={i} style={s.weekBarCol}>
                    {d.val > 0 && (
                      <Text style={[s.weekBarVal, d.isToday && { color: accentColor }]}>
                        {type === "walk" ? (d.val >= 1000 ? `${(d.val / 1000).toFixed(1)}k` : d.val) : d.val}
                      </Text>
                    )}
                    {d.val === 0 && <Text style={s.weekBarVal}> </Text>}
                    <View style={s.weekBarTrack}>
                      {barPct > 0 && (
                        <LinearGradient
                          colors={d.isToday ? [accentColor, accentColor + "88"] : [accentColor + "66", accentColor + "22"]}
                          style={[s.weekBarFill, { height: `${Math.max(barPct * 100, 6)}%` }]}
                        />
                      )}
                    </View>
                    <Text style={[s.weekBarDay, d.isToday && { color: accentColor, fontWeight: "800" }]}>
                      {d.day.slice(0, 2)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {bestDate && bestEver > 0 && (
              <View style={s.bestRow}>
                <View style={[s.bestDot, { backgroundColor: accentColor }]} />
                <Text style={s.bestTxt}>
                  Best: {config.formatValue(bestEver)} on {new Date(bestDate + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* ── Time of day ── */}
      {logsForHabit.length > 0 && (
        <>
          <Divider label={type === "walk" ? "WHEN DO YOU WALK?" : type === "reading" ? "WHEN DO YOU READ?" : type === "exercise" ? "WHEN DO YOU TRAIN?" : "WHEN ARE YOU MOST ACTIVE?"} />
          <View style={s.timeCard}>
            {timeSlotCounts.map((slot) => {
              const barW = Math.max(slot.count > 0 ? 0.08 : 0, slot.count / maxSlotCount);
              return (
                <View key={slot.label} style={s.timeRow}>
                  <View style={s.timeLeft}>
                    <Text style={s.timeLabel}>{slot.label}</Text>
                    <Text style={s.timeRange}>{slot.range}</Text>
                  </View>
                  <View style={s.timeTrack}>
                    <LinearGradient
                      colors={[slot.color, slot.color + "44"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[s.timeBar, { width: `${Math.round(barW * 100)}%` }]}
                    />
                  </View>
                  <Text style={[s.timeCount, slot.count > 0 && { color: slot.color }]}>
                    {slot.count}x
                  </Text>
                </View>
              );
            })}
            {(() => {
              const best = [...timeSlotCounts].sort((a, b) => b.count - a.count)[0];
              if (best.count === 0) return null;
              return (
                <View style={s.timeInsight}>
                  <View style={[s.timeInsightDot, { backgroundColor: best.color }]} />
                  <Text style={s.timeInsightTxt}>
                    You tend to {type === "walk" ? "walk" : type === "reading" ? "read" : type === "exercise" ? "train" : "do this"} in the{" "}
                    <Text style={{ color: best.color, fontWeight: "700" }}>{best.label.toLowerCase()}</Text>
                  </Text>
                </View>
              );
            })()}
          </View>
        </>
      )}

      {/* ── Exercise type breakdown ── */}
      {type === "exercise" && Object.keys(exerciseCounts).length > 0 && (
        <>
          <Divider label="WORKOUT TYPES" />
          <View style={s.typeCard}>
            {EXERCISE_TYPES.map((t) => {
              const count  = exerciseCounts[t] ?? 0;
              const total2 = Object.values(exerciseCounts).reduce((a, b) => a + b, 0);
              const pct    = total2 > 0 ? Math.round((count / total2) * 100) : 0;
              return (
                <View key={t} style={s.typeStatRow}>
                  <View style={[s.typeStatDot, { backgroundColor: EXERCISE_COLORS[t] }]} />
                  <Text style={s.typeStatName}>{t}</Text>
                  <View style={s.typeStatTrack}>
                    <View style={[s.typeStatBar, { width: `${pct}%`, backgroundColor: EXERCISE_COLORS[t] }]} />
                  </View>
                  <Text style={[s.typeStatPct, { color: EXERCISE_COLORS[t] }]}>{count}×</Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* ── Reading progress ── */}
      {type === "reading" && totalThisWeek > 0 && (
        <>
          <Divider label="READING PACE" />
          <View style={s.paceCard}>
            <View style={s.paceRow}>
              <View style={s.paceStat}>
                <Text style={[s.paceNum, { color: AMBER }]}>{Math.round(totalThisWeek / 7)}</Text>
                <Text style={s.paceLbl}>min / day avg</Text>
              </View>
              <View style={s.paceDivider} />
              <View style={s.paceStat}>
                <Text style={[s.paceNum, { color: AMBER }]}>{totalThisWeek}</Text>
                <Text style={s.paceLbl}>min this week</Text>
              </View>
              <View style={s.paceDivider} />
              <View style={s.paceStat}>
                <Text style={[s.paceNum, { color: AMBER }]}>{logsForHabit.reduce((s, l) => s + l.value, 0)}</Text>
                <Text style={s.paceLbl}>min all time</Text>
              </View>
            </View>
            <Text style={s.paceInsight}>
              At your current pace, that's roughly{" "}
              <Text style={{ color: AMBER, fontWeight: "700" }}>
                {Math.round(logsForHabit.reduce((s, l) => s + l.value, 0) / 60)} hours
              </Text>{" "}
              of reading total.
            </Text>
          </View>
        </>
      )}

      {/* ── Empty state (no logs at all) ── */}
      {logsForHabit.length === 0 && type !== "generic" && (
        <View style={s.emptyCard}>
          <View style={s.emptyDots}>
            <View style={[s.emptyDot, { backgroundColor: accentColor }]} />
            <View style={[s.emptyDot, { backgroundColor: accentColor, opacity: 0.5 }]} />
            <View style={[s.emptyDot, { backgroundColor: accentColor, opacity: 0.2 }]} />
          </View>
          <Text style={s.emptyTitle}>Start logging to see insights</Text>
          <Text style={s.emptySub}>
            After your first few sessions, you'll see your weekly chart, best times, and trends here.
          </Text>
        </View>
      )}

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 20,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  streakBadge: {
    width: 46, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  streakTxt: { fontSize: 13, fontWeight: "800" },

  // Quick stats
  statsRow: {
    flexDirection: "row", backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, paddingVertical: 18, marginBottom: 4,
  },
  statBox:     { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, backgroundColor: BORDER, marginVertical: 4 },
  statNum:     { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  statLbl:     { color: MUTED, fontSize: 10, fontWeight: "600", textAlign: "center" },

  // Log today
  logCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 18, gap: 12,
  },
  logCardDone: { borderColor: "rgba(200,255,0,0.12)" },
  loggedRow:   { flexDirection: "row", alignItems: "center", gap: 12 },
  checkCircle: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  loggedTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  loggedSub:   { color: MUTED, fontSize: 12, marginTop: 2 },
  logMoreBtn:  { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: CARD_ALT, borderWidth: 1, borderColor: BORDER },
  logMoreTxt:  { fontSize: 12, fontWeight: "700" },

  logForm: { gap: 10 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: CARD_ALT, borderWidth: 1, borderColor: BORDER,
  },
  typeDot: { width: 6, height: 6, borderRadius: 99 },
  typeTxt: { color: MUTED, fontSize: 12, fontWeight: "700" },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD_ALT, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER, overflow: "hidden",
  },
  input: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 15,
    color: "#fff", fontSize: 16,
  },
  inputUnit: {
    color: MUTED, fontSize: 13, fontWeight: "600",
    paddingRight: 16,
  },

  logBtn: {
    borderRadius: 10, paddingVertical: 15, alignItems: "center",
    borderWidth: 1,
  },
  logBtnTxt: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },

  // Calendar
  calCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 18, gap: 12,
  },
  calHeader:    { flexDirection: "row", paddingBottom: 8 },
  calHeaderTxt: { flex: 1, textAlign: "center", color: MUTED, fontSize: 10, fontWeight: "700" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: `${100/7}%`, alignItems: "center", paddingVertical: 4, position: "relative" },
  calDot:  { width: 20, height: 20, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.04)", borderColor: "transparent", borderWidth: 0 },
  calDotInner: { width: 8, height: 8, borderRadius: 4, position: "absolute", top: 6, left: 6 },
  calTodayPip: { width: 3, height: 3, borderRadius: 99, marginTop: 2 },
  calLegend: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  calLegendTxt: { color: MUTED, fontSize: 10, fontWeight: "600", marginRight: 8 },

  // Weekly chart
  weekCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 18, gap: 14,
  },
  weekTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  weekTotal:    { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  weekTotalLbl: { color: MUTED, fontSize: 11, fontWeight: "600", marginTop: 2 },
  avgBadge:  { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  avgTxt:    { fontSize: 11, fontWeight: "700" },

  weekBars:    { flexDirection: "row", alignItems: "flex-end", height: 100, gap: 6 },
  weekBarCol:  { flex: 1, alignItems: "center", gap: 5 },
  weekBarVal:  { color: MUTED, fontSize: 9, fontWeight: "700", height: 13, textAlign: "center" },
  weekBarTrack:{ flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center", borderRadius: 6, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)" },
  weekBarFill: { width: "100%", borderRadius: 6 },
  weekBarDay:  { color: MUTED, fontSize: 10, fontWeight: "600" },

  bestRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  bestDot: { width: 6, height: 6, borderRadius: 99 },
  bestTxt: { color: MUTED, fontSize: 11, fontWeight: "600" },

  // Time of day
  timeCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 18, gap: 14,
  },
  timeRow:   { flexDirection: "row", alignItems: "center", gap: 12 },
  timeLeft:  { width: 80 },
  timeLabel: { color: SOFT, fontSize: 12, fontWeight: "700" },
  timeRange: { color: MUTED, fontSize: 10, marginTop: 1 },
  timeTrack: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" },
  timeBar:   { height: "100%", borderRadius: 99 },
  timeCount: { color: MUTED, fontSize: 12, fontWeight: "700", width: 24, textAlign: "right" },
  timeInsight: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER,
  },
  timeInsightDot: { width: 6, height: 6, borderRadius: 99, flexShrink: 0 },
  timeInsightTxt: { color: MUTED, fontSize: 12, lineHeight: 18, flex: 1 },

  // Exercise type breakdown
  typeCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 18, gap: 12,
  },
  typeStatRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  typeStatDot:   { width: 8, height: 8, borderRadius: 99, flexShrink: 0 },
  typeStatName:  { color: SOFT, fontSize: 13, fontWeight: "600", width: 80 },
  typeStatTrack: { flex: 1, height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" },
  typeStatBar:   { height: "100%", borderRadius: 99 },
  typeStatPct:   { fontSize: 12, fontWeight: "700", width: 28, textAlign: "right" },

  // Reading pace
  paceCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 18, gap: 12,
  },
  paceRow:     { flexDirection: "row" },
  paceStat:    { flex: 1, alignItems: "center", gap: 4 },
  paceDivider: { width: 1, backgroundColor: BORDER, marginVertical: 4 },
  paceNum:     { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.8 },
  paceLbl:     { color: MUTED, fontSize: 10, fontWeight: "600", textAlign: "center" },
  paceInsight: { color: MUTED, fontSize: 12, lineHeight: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },

  // Empty state
  emptyCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 32,
    alignItems: "center", gap: 12,
  },
  emptyDots:  { flexDirection: "row", gap: 8 },
  emptyDot:   { width: 8, height: 8, borderRadius: 99 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  emptySub:   { color: MUTED, fontSize: 12, textAlign: "center", lineHeight: 19 },
});
