import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line, Circle } from "react-native-svg";
import { MotiView } from "moti";
import { useApp } from "../../context/AppContext";
import { calculateHealthScore } from "../../lib/healthScore";
import type { SleepEntry } from "../../lib/types";

// ── Palette ────────────────────────────────────────────────────────────────────
const BG     = "#070707";
const CARD   = "#101010";
const LIME   = "#C8FF00";
const MUTED  = "rgba(255,255,255,0.30)";
const SOFT   = "rgba(255,255,255,0.65)";
const BORDER = "rgba(255,255,255,0.07)";
const LIME_DIM    = "rgba(200,255,0,0.10)";
const LIME_BORDER = "rgba(200,255,0,0.22)";
const AMBER  = "#FBBF24";
const BLUE   = "#60C8FF";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - 64; // card padding 20*2 + outer 16*2 — 8 slack
const CHART_H = 110;

type Range = "7D" | "30D" | "90D";
const RANGE_DAYS: Record<Range, number> = { "7D": 7, "30D": 30, "90D": 90 };

// ── Date helpers ──────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }

function dateNDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function weekMonday(weekOffset = 0) {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - dow - weekOffset * 7);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function pctChange(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return Math.round(((a - b) / b) * 100);
}

// ── Smooth bezier path ────────────────────────────────────────────────────────
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp.toFixed(1)} ${pts[i - 1].y.toFixed(1)} ${cp.toFixed(1)} ${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

function buildPoints(
  values: number[], w: number, h: number, min: number, max: number
) {
  const range = max - min || 1;
  return values.map((v, i) => ({
    x: values.length === 1 ? w / 2 : (i / (values.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 12) - 6,
  }));
}

// ── Line Chart ────────────────────────────────────────────────────────────────
function LineChart({
  values, labels, color = LIME, unit = "", gradId,
}: {
  values: number[]; labels?: string[]; color?: string; unit?: string; gradId: string;
}) {
  if (values.length === 0) {
    return (
      <View style={lc.empty}>
        <Text style={lc.emptyTxt}>Log more data to see your trend</Text>
      </View>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const pts = buildPoints(values, CHART_W, CHART_H, min, max);
  const linePath = smoothPath(pts);
  const fillPath = values.length >= 2
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${CHART_H} L ${pts[0].x.toFixed(1)} ${CHART_H} Z`
    : "";

  const avgY = CHART_H - ((avg - min) / (max - min || 1)) * (CHART_H - 12) - 6;

  // Which labels to show (max 4)
  const showEvery = Math.ceil(values.length / 4);
  const visibleLabels = labels?.filter((_, i) => i % showEvery === 0 || i === labels.length - 1) ?? [];

  return (
    <View style={lc.wrap}>
      <Svg width={CHART_W} height={CHART_H} style={{ overflow: "visible" }}>
        <Defs>
          <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.22" />
            <Stop offset="1" stopColor={color} stopOpacity="0.01" />
          </SvgGradient>
        </Defs>

        {/* Average dashed line */}
        <Line
          x1={0} y1={avgY} x2={CHART_W} y2={avgY}
          stroke={color} strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.25}
        />

        {/* Gradient fill */}
        {fillPath && (
          <Path d={fillPath} fill={`url(#${gradId})`} />
        )}

        {/* Line */}
        <Path
          d={linePath}
          stroke={color} strokeWidth={2.5}
          fill="none" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* End dot */}
        <Circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r={4} fill={color}
        />
      </Svg>

      {/* Labels row */}
      {labels && (
        <View style={lc.labelsRow}>
          {labels.length <= 7
            ? labels.map((l, i) => (
                <Text key={i} style={lc.label}>{l}</Text>
              ))
            : visibleLabels.map((l, i) => (
                <Text key={i} style={lc.label}>{l}</Text>
              ))
          }
        </View>
      )}

      {/* Stats row */}
      <View style={lc.statsRow}>
        <View style={lc.statItem}>
          <Text style={lc.statVal}>{min.toFixed(unit === "h" ? 1 : 0)}{unit}</Text>
          <Text style={lc.statLbl}>Min</Text>
        </View>
        <View style={lc.statItem}>
          <Text style={[lc.statVal, { color }]}>{avg.toFixed(unit === "h" ? 1 : 0)}{unit}</Text>
          <Text style={lc.statLbl}>Avg</Text>
        </View>
        <View style={lc.statItem}>
          <Text style={lc.statVal}>{max.toFixed(unit === "h" ? 1 : 0)}{unit}</Text>
          <Text style={lc.statLbl}>Max</Text>
        </View>
      </View>
    </View>
  );
}
const lc = StyleSheet.create({
  wrap:     { gap: 10 },
  empty:    { height: CHART_H, alignItems: "center", justifyContent: "center" },
  emptyTxt: { color: MUTED, fontSize: 13, fontStyle: "italic" },
  labelsRow:{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  label:    { color: MUTED, fontSize: 9, fontWeight: "500" },
  statsRow: { flexDirection: "row", gap: 0, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal:  { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: -0.5 },
  statLbl:  { color: MUTED, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
});

// ── Trend Card wrapper ────────────────────────────────────────────────────────
function TrendCard({
  title, delay = 0, children,
}: {
  title: string; delay?: number; children: React.ReactNode;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, delay }}
      style={tc.card}
    >
      <Text style={tc.title}>{title}</Text>
      {children}
    </MotiView>
  );
}
const tc = StyleSheet.create({
  card:  { backgroundColor: CARD, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  title: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 18 },
});

// ── Habit Consistency Heatmap ─────────────────────────────────────────────────
const CELL  = 14;
const GAP   = 3;
const WEEKS = 16;
const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function heatColor(count: number, maxCount: number): string {
  if (count === 0) return "#1C1C1C";
  const pct = count / maxCount;
  if (pct < 0.25) return "#2D4A00";
  if (pct < 0.5)  return "#4A7A00";
  if (pct < 0.75) return "#7AB800";
  return LIME;
}

function HabitHeatmap({
  habits, sleepHistory, nutritionLogs,
}: {
  habits: { streak: number; name: string }[];
  sleepHistory: SleepEntry[];
  nutritionLogs: { date: string }[];
}) {
  const cells = useMemo(() => {
    const today = new Date();
    const total = WEEKS * 7;
    const result: { date: string; count: number }[] = [];

    const sleepDates  = new Set(sleepHistory.map((e) => e.date));
    const nutriDates  = new Set(nutritionLogs.map((e) => e.date));

    for (let i = total - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      const daysAgo = i;

      const habitCount = habits.filter((h) => h.streak > daysAgo).length;
      const hasS = sleepDates.has(date) ? 1 : 0;
      const hasN = nutriDates.has(date) ? 1 : 0;
      const count = habitCount + hasS + hasN;

      result.push({ date, count });
    }
    return result;
  }, [habits, sleepHistory, nutritionLogs]);

  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  // Build week columns: grid[weekIdx][dowIdx]
  // Find which DOW today is to figure out first partial week
  const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon
  // cells[0] = oldest date, cells[total-1] = today
  // Group into 16 weeks, last column goes up to todayDow
  const grid: (number | null)[][] = Array.from({ length: WEEKS }, () => Array(7).fill(null));
  cells.forEach((cell, absIdx) => {
    const fromEnd = cells.length - 1 - absIdx; // 0 = today
    const weekFromEnd = Math.floor(fromEnd / 7);
    const dayFromEnd  = fromEnd % 7;
    const weekCol = WEEKS - 1 - weekFromEnd;
    if (weekCol < 0 || weekCol >= WEEKS) return;
    const dow = (todayDow - dayFromEnd + 7) % 7;
    grid[weekCol][dow] = cell.count;
  });

  const totalActive = cells.filter((c) => c.count > 0).length;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, delay: 300 }}
      style={hm.card}
    >
      <View style={hm.header}>
        <Text style={hm.title}>Habit Consistency</Text>
        <Text style={hm.sub}>{totalActive} active days</Text>
      </View>

      <View style={hm.grid}>
        {/* DOW labels */}
        <View style={hm.dowCol}>
          {DOW_LABELS.map((d, i) => (
            <Text key={i} style={hm.dowLabel}>{i % 2 === 0 ? d : ""}</Text>
          ))}
        </View>

        {/* Week columns */}
        {grid.map((week, wi) => (
          <View key={wi} style={hm.weekCol}>
            {week.map((count, di) => (
              <View
                key={di}
                style={[
                  hm.cell,
                  { backgroundColor: count === null ? "transparent" : heatColor(count ?? 0, maxCount) },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={hm.legend}>
        <Text style={hm.legendLbl}>Less</Text>
        {["#1C1C1C", "#2D4A00", "#4A7A00", "#7AB800", LIME].map((c) => (
          <View key={c} style={[hm.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={hm.legendLbl}>More</Text>
      </View>
    </MotiView>
  );
}
const hm = StyleSheet.create({
  card:   { backgroundColor: CARD, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 },
  title:  { color: "#fff", fontSize: 15, fontWeight: "700" },
  sub:    { color: MUTED, fontSize: 11, fontWeight: "500" },

  grid:    { flexDirection: "row", gap: GAP },
  dowCol:  { gap: GAP, paddingTop: 0 },
  dowLabel:{ width: 10, height: CELL, lineHeight: CELL, color: MUTED, fontSize: 8, fontWeight: "600", textAlign: "center" },
  weekCol: { gap: GAP },
  cell:    { width: CELL, height: CELL, borderRadius: 3 },

  legend:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 14, justifyContent: "flex-end" },
  legendLbl:  { color: MUTED, fontSize: 9, fontWeight: "500" },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});

// ── Weekly Report ─────────────────────────────────────────────────────────────
function WeeklyReport({
  sleepHistory, habits, healthScore,
}: {
  sleepHistory: SleepEntry[];
  habits: { streak: number; completedToday: boolean }[];
  healthScore: number;
}) {
  const thisMonday = weekMonday(0);
  const lastMonday = weekMonday(1);
  const lastSunday = addDays(lastMonday, 6);

  const thisSleep = sleepHistory.filter(
    (e) => e.date >= thisMonday && e.date <= todayStr()
  );
  const lastSleep = sleepHistory.filter(
    (e) => e.date >= lastMonday && e.date <= lastSunday
  );

  const thisAvgSleep = thisSleep.length
    ? thisSleep.reduce((s, e) => s + e.hours, 0) / thisSleep.length
    : null;
  const lastAvgSleep = lastSleep.length
    ? lastSleep.reduce((s, e) => s + e.hours, 0) / lastSleep.length
    : null;

  const sleepPct = pctChange(thisAvgSleep, lastAvgSleep);

  // Habit score: sum of streaks as proxy for consistency
  const totalStreak = habits.reduce((s, h) => s + h.streak, 0);
  const doneToday   = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;

  const metrics = [
    {
      label: "Sleep",
      value: thisAvgSleep ? `${thisAvgSleep.toFixed(1)}h avg` : "No data",
      change: sleepPct,
      color: LIME,
    },
    {
      label: "Habits",
      value: totalHabits > 0 ? `${doneToday}/${totalHabits} today` : "None added",
      change: totalStreak > 7 ? 10 : null,
      color: BLUE,
    },
    {
      label: "Aura Score",
      value: `${healthScore}`,
      change: null,
      color: AMBER,
    },
  ];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, delay: 360 }}
      style={wr.card}
    >
      <View style={wr.header}>
        <View>
          <Text style={wr.eyebrow}>Weekly Reports</Text>
          <Text style={wr.title}>Week Summary</Text>
        </View>
        <View style={wr.badge}>
          <Text style={wr.badgeTxt}>Auto</Text>
        </View>
      </View>

      {metrics.map((m, i) => (
        <View key={i} style={[wr.row, i < metrics.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}>
          <View style={[wr.dot, { backgroundColor: m.color }]} />
          <Text style={wr.metricLabel}>{m.label}</Text>
          <Text style={wr.metricValue}>{m.value}</Text>
          {m.change !== null && (
            <View style={[wr.changeBadge, {
              backgroundColor: (m.change ?? 0) >= 0 ? "rgba(200,255,0,0.08)" : "rgba(248,113,113,0.08)",
              borderColor:     (m.change ?? 0) >= 0 ? "rgba(200,255,0,0.22)" : "rgba(248,113,113,0.22)",
            }]}>
              <Text style={[wr.changeTxt, {
                color: (m.change ?? 0) >= 0 ? LIME : "#F87171",
              }]}>
                {(m.change ?? 0) >= 0 ? "+" : ""}{m.change}%
              </Text>
            </View>
          )}
        </View>
      ))}

      <Text style={wr.footnote}>Generated from your logged data</Text>
    </MotiView>
  );
}
const wr = StyleSheet.create({
  card:  { backgroundColor: CARD, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  header:{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  eyebrow:{ color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 2 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.6 },
  badge: { backgroundColor: LIME_DIM, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: LIME_BORDER },
  badgeTxt: { color: LIME, fontSize: 10, fontWeight: "800" },

  row:   { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  dot:   { width: 7, height: 7, borderRadius: 99 },
  metricLabel: { color: SOFT, fontSize: 14, fontWeight: "500", flex: 1 },
  metricValue: { color: "#fff", fontSize: 14, fontWeight: "700" },
  changeBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  changeTxt:   { fontSize: 11, fontWeight: "800" },

  footnote: { color: MUTED, fontSize: 10, fontWeight: "500", marginTop: 10, textAlign: "center" },
});

// ── Range Picker ──────────────────────────────────────────────────────────────
function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <View style={rp.row}>
      {(["7D", "30D", "90D"] as Range[]).map((r) => (
        <TouchableOpacity
          key={r}
          style={[rp.btn, value === r && rp.btnActive]}
          onPress={() => onChange(r)}
          activeOpacity={0.8}
        >
          <Text style={[rp.label, value === r && rp.labelActive]}>{r}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const rp = StyleSheet.create({
  row:       { flexDirection: "row", gap: 8, marginBottom: 20 },
  btn:       { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: "center" },
  btnActive: { backgroundColor: LIME_DIM, borderColor: LIME_BORDER },
  label:     { color: MUTED, fontSize: 13, fontWeight: "700" },
  labelActive:{ color: LIME },
});

// ── No-data placeholder ───────────────────────────────────────────────────────
function NoData({ message }: { message: string }) {
  return (
    <View style={nd.wrap}>
      <Text style={nd.txt}>{message}</Text>
    </View>
  );
}
const nd = StyleSheet.create({
  wrap: { height: 80, alignItems: "center", justifyContent: "center" },
  txt:  { color: MUTED, fontSize: 13, fontStyle: "italic", textAlign: "center" },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { sleepHistory, nutritionLogs, habits, stats, profile, healthScore } = useApp();
  const [range, setRange] = useState<Range>("30D");

  const days = RANGE_DAYS[range];
  const cutoff = dateNDaysAgo(days);

  // ── Sleep data ──────────────────────────────────────────────────────────
  const sleepInRange = useMemo(
    () => sleepHistory.filter((e) => e.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date)),
    [sleepHistory, cutoff]
  );
  const sleepValues = sleepInRange.map((e) => e.hours);
  const sleepLabels = sleepInRange.map((e) =>
    new Date(e.date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })
  );

  // ── Aura Trend (approximate from sleep) ─────────────────────────────────
  const auraValues = useMemo(() =>
    sleepInRange.map((e) => {
      const sleepPct = Math.min(100, (e.hours / 8) * 100);
      // Use sleep component only; treat others as neutral baseline
      return Math.round(sleepPct * 0.3 + 50 * 0.7);
    }),
    [sleepInRange]
  );

  // ── Hydration ── only today, no history ─────────────────────────────────
  const hydrationPct = Math.round(Math.min(100, (stats.waterMl / profile.waterGoalMl) * 100));

  // ── Mood ── only today, no history ──────────────────────────────────────
  const MOOD_SCORE: Record<string, number> = {
    dead_inside: 20, sleepy: 45, fine: 65, slaying: 85, unstoppable: 100,
  };
  const todayMoodScore = stats.mood ? MOOD_SCORE[stats.mood] : null;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 20 }}
        style={s.header}
      >
        <Text style={s.eyebrow}>Your journey</Text>
        <Text style={s.title}>Progress</Text>
      </MotiView>

      {/* ── Range Picker ── */}
      <RangePicker value={range} onChange={setRange} />

      {/* ── Aura Trend ── */}
      <TrendCard title="Aura Trend" delay={40}>
        {auraValues.length >= 2 ? (
          <LineChart
            values={auraValues}
            labels={sleepLabels}
            color={LIME}
            unit=""
            gradId="auraGrad"
          />
        ) : (
          <NoData message={`Log sleep across ${range === "7D" ? "several days" : "a week"} to see your Aura trend`} />
        )}
      </TrendCard>

      {/* ── Sleep Trend ── */}
      <TrendCard title="Sleep Trend" delay={100}>
        {sleepValues.length >= 2 ? (
          <LineChart
            values={sleepValues}
            labels={sleepLabels}
            color={BLUE}
            unit="h"
            gradId="sleepGrad"
          />
        ) : (
          <NoData message="Log sleep a few nights to see your trend" />
        )}
      </TrendCard>

      {/* ── Hydration Trend ── */}
      <TrendCard title="Hydration Trend" delay={160}>
        {hydrationPct > 0 ? (
          <View style={s.singleStat}>
            {/* Today's bar */}
            <View style={s.hydroRow}>
              <View style={s.hydroTrack}>
                <MotiView
                  from={{ width: "0%" }}
                  animate={{ width: `${hydrationPct}%` }}
                  transition={{ type: "timing", duration: 800, delay: 200 }}
                  style={[s.hydroFill, { backgroundColor: hydrationPct >= 75 ? LIME : AMBER }]}
                />
              </View>
              <Text style={[s.hydroPct, { color: hydrationPct >= 75 ? LIME : AMBER }]}>
                {hydrationPct}%
              </Text>
            </View>
            <Text style={s.hydroToday}>
              {stats.waterMl} / {profile.waterGoalMl} ml today
            </Text>
            <Text style={s.hydroHint}>Daily water history builds over time</Text>
          </View>
        ) : (
          <NoData message="Log water today to start tracking" />
        )}
      </TrendCard>

      {/* ── Mood Trend ── */}
      <TrendCard title="Mood Trend" delay={220}>
        {todayMoodScore !== null ? (
          <View style={s.singleStat}>
            <View style={s.moodRow}>
              {(["dead_inside", "sleepy", "fine", "slaying", "unstoppable"] as const).map((m) => {
                const score = MOOD_SCORE[m];
                const active = stats.mood === m;
                const emoji  = { dead_inside: "😵", sleepy: "😴", fine: "😊", slaying: "⚡", unstoppable: "🔥" }[m];
                return (
                  <View key={m} style={s.moodItem}>
                    <Text style={[s.moodEmoji, !active && { opacity: 0.3 }]}>{emoji}</Text>
                    <View style={[s.moodBar, { height: (score / 100) * 48 }, active && { backgroundColor: LIME }]} />
                  </View>
                );
              })}
            </View>
            <Text style={s.hydroHint}>Mood history builds as you track daily</Text>
          </View>
        ) : (
          <NoData message="Set your mood on Today to start tracking" />
        )}
      </TrendCard>

      {/* ── Habit Consistency Heatmap ── */}
      <HabitHeatmap
        habits={habits}
        sleepHistory={sleepHistory}
        nutritionLogs={nutritionLogs}
      />

      {/* ── Weekly Report ── */}
      <WeeklyReport
        sleepHistory={sleepHistory}
        habits={habits}
        healthScore={healthScore}
      />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16 },

  header:  { marginBottom: 20 },
  eyebrow: { color: MUTED, fontSize: 11, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 4 },
  title:   { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1.2 },

  // Single-stat cards (hydration + mood)
  singleStat: { gap: 10 },

  // Hydration
  hydroRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  hydroTrack:{ flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" },
  hydroFill: { height: 8, borderRadius: 99 },
  hydroPct:  { fontSize: 16, fontWeight: "800", minWidth: 40, textAlign: "right" },
  hydroToday:{ color: SOFT, fontSize: 13, fontWeight: "500" },
  hydroHint: { color: MUTED, fontSize: 11, fontStyle: "italic" },

  // Mood bars
  moodRow:  { flexDirection: "row", alignItems: "flex-end", gap: 10, height: 64 },
  moodItem: { flex: 1, alignItems: "center", gap: 6, justifyContent: "flex-end" },
  moodEmoji:{ fontSize: 20 },
  moodBar:  { width: "100%", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.10)" },
});
