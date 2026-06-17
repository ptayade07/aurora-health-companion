import { useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { getScoreLabel } from "../lib/healthScore";
import type { Mood } from "../lib/types";

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

// Score color based on value
function scoreColor(s: number) {
  if (s >= 80) return LIME;
  if (s >= 60) return AMBER;
  if (s >= 40) return "#FB923C";
  return RED;
}

const MOOD_SCORE: Record<Mood, number> = {
  dead_inside: 20, sleepy: 45, fine: 65, slaying: 85, unstoppable: 100,
};
const MOOD_LABEL: Record<Mood, string> = {
  dead_inside: "Dead inside", sleepy: "Sleepy", fine: "Fine", slaying: "Slaying", unstoppable: "On fire",
};

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

// ── Big score ring (SVG) ──────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const SIZE = 224;
  const CX = 112, CY = 112, R = 94;
  const C      = 2 * Math.PI * R;
  const filled = Math.min((score / 100) * C, C - 0.1);
  const col    = scoreColor(score);

  return (
    <View style={sr.wrap}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          {/* Track */}
          <Circle cx={CX} cy={CY} r={R}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          {/* Arc */}
          <G transform={`rotate(-90 ${CX} ${CY})`}>
            <Circle cx={CX} cy={CY} r={R}
              fill="none" stroke={col} strokeWidth={8} strokeLinecap="round"
              strokeDasharray={`${filled} ${C}`}
            />
          </G>
        </Svg>
        {/* Center content */}
        <View style={[StyleSheet.absoluteFill, sr.center]}>
          <Text style={[sr.num, { color: col }]}>{score}</Text>
          <Text style={sr.outOf}>/ 100</Text>
        </View>
      </View>
      <Text style={sr.label}>AURA SCORE</Text>
      <View style={[sr.pill, { backgroundColor: col + "18", borderColor: col + "44" }]}>
        <Text style={[sr.pillTxt, { color: col }]}>{getScoreLabel(score)}</Text>
      </View>
    </View>
  );
}
const sr = StyleSheet.create({
  wrap:    { alignItems: "center", gap: 12 },
  center:  { alignItems: "center", justifyContent: "center" },
  num:     { fontSize: 64, fontWeight: "900", letterSpacing: -3, lineHeight: 68 },
  outOf:   { color: MUTED, fontSize: 14, fontWeight: "600", marginTop: -2 },
  label:   { color: MUTED, fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  pill:    { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 7, borderWidth: 1 },
  pillTxt: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
});

// ── Component breakdown card ──────────────────────────────────────────────────
function ComponentCard({
  label, weight, earnedPts, maxPts, rawPct, value, color, insight,
}: {
  label: string; weight: string; earnedPts: number; maxPts: number;
  rawPct: number; value: string; color: string; insight: string;
}) {
  const barPct = Math.min(rawPct, 100);
  const isMaxed = earnedPts >= maxPts;

  return (
    <View style={cc.card}>
      <View style={[cc.stripe, { backgroundColor: color }]} />
      <View style={cc.body}>
        {/* Top row */}
        <View style={cc.topRow}>
          <View>
            <View style={cc.labelRow}>
              <Text style={cc.label}>{label}</Text>
              <View style={[cc.weightBadge, { backgroundColor: color + "18", borderColor: color + "33" }]}>
                <Text style={[cc.weightTxt, { color }]}>{weight} of score</Text>
              </View>
            </View>
            <Text style={cc.value}>{value}</Text>
          </View>
          <View style={cc.ptsBox}>
            <Text style={[cc.ptsNum, { color: isMaxed ? color : "#fff" }]}>{earnedPts}</Text>
            <Text style={cc.ptsDen}>/ {maxPts} pts</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={cc.track}>
          <View style={[cc.fill, { width: `${barPct}%`, backgroundColor: color }]} />
        </View>

        {/* Insight */}
        <Text style={cc.insight}>{insight}</Text>
      </View>
    </View>
  );
}
const cc = StyleSheet.create({
  card:   { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: "hidden" },
  stripe: { height: 3, width: "100%" },
  body:   { padding: 16, gap: 10 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  labelRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  label:       { color: "#fff", fontSize: 14, fontWeight: "700" },
  weightBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  weightTxt:   { fontSize: 10, fontWeight: "700" },
  value:       { color: MUTED, fontSize: 12, fontWeight: "500" },
  ptsBox:      { alignItems: "flex-end" },
  ptsNum:      { fontSize: 28, fontWeight: "900", letterSpacing: -1, lineHeight: 30 },
  ptsDen:      { color: MUTED, fontSize: 11, fontWeight: "600" },
  track:  { height: 4, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" },
  fill:   { height: "100%", borderRadius: 99 },
  insight:{ color: SOFT, fontSize: 12, lineHeight: 18 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function AuraScoreScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const {
    healthScore, hydrationPct, stats, profile,
    habitPct, sleepHistory, habits,
  } = useApp();

  // ── Component contributions ───────────────────────────────────────────────
  const hydRaw   = Math.min(100, hydrationPct);
  const hydPts   = Math.round(hydRaw * 0.30);

  const slpRaw   = stats.sleepHours !== null ? Math.min(100, (stats.sleepHours / 8) * 100) : 50;
  const slpPts   = Math.round(slpRaw * 0.30);

  const habRaw   = habitPct;
  const habPts   = Math.round(habRaw * 0.25);

  const moodRaw  = stats.mood ? MOOD_SCORE[stats.mood] : 50;
  const moodPts  = Math.round(moodRaw * 0.15);

  const maxScore = 100;
  const gap      = maxScore - healthScore;

  // ── Weakest components (for "focus on" section) ───────────────────────────
  const components = useMemo(() => [
    { key: "hydration", pct: hydRaw, pts: hydPts, max: 30 },
    { key: "sleep",     pct: slpRaw, pts: slpPts, max: 30 },
    { key: "habits",    pct: habRaw, pts: habPts, max: 25 },
    { key: "mood",      pct: moodRaw,pts: moodPts,max: 15 },
  ], [hydRaw, slpRaw, habRaw, moodRaw]);

  const weakest = [...components].sort((a, b) => (a.pts / a.max) - (b.pts / b.max)).slice(0, 2);

  const focusInsights: Record<string, string> = {
    hydration: hydrationPct < 50
      ? `You've hit only ${Math.round(hydrationPct)}% of your water goal. Drink ${Math.ceil((profile.waterGoalMl - stats.waterMl) / 250) * 250}ml more to see a big score jump.`
      : `${Math.round(profile.waterGoalMl - stats.waterMl)}ml left to hit your daily goal. Almost there.`,
    sleep: stats.sleepHours === null
      ? "You haven't logged sleep yet — defaulting to 50%, costing you up to 15 free points. Log it now."
      : stats.sleepHours < 7
      ? `${stats.sleepHours}h is below the 7–8h target. Each extra hour tonight adds roughly 4 pts tomorrow.`
      : "Your sleep is solid. Not the bottleneck here.",
    habits: habitPct < 100
      ? `${stats.habitsTotal - stats.habitsCompleted} habit${stats.habitsTotal - stats.habitsCompleted !== 1 ? "s" : ""} left today. Completing them would add ${25 - habPts} more pts.`
      : "All habits done. You're maxing the 25-point habits component.",
    mood: !stats.mood
      ? "No mood set — you're stuck at 50% on this component. Tap How Are You Feeling on the home screen."
      : MOOD_SCORE[stats.mood] < 65
      ? "Your mood is weighing the score down. It improves naturally as you hit your other goals."
      : "Mood is contributing well. Keep the energy up.",
  };

  // ── Sleep trend ───────────────────────────────────────────────────────────
  const last7sleep = sleepHistory.slice(-7);
  const maxSlp     = last7sleep.length > 0 ? Math.max(...last7sleep.map((e) => e.hours), 9) : 9;

  // ── Aurora CTA prompt ─────────────────────────────────────────────────────
  const goToAurora = () => {
    const prompt =
      `My aura score is ${healthScore}/100 (${getScoreLabel(healthScore)}). ` +
      `Water: ${Math.round(hydrationPct)}%, Sleep: ${stats.sleepHours ?? "not logged"}h, ` +
      `Habits: ${stats.habitsCompleted}/${stats.habitsTotal}, Mood: ${stats.mood ?? "not set"}. ` +
      `What should I focus on to push my score above ${Math.min(healthScore + 15, 100)}?`;
    router.push({ pathname: "/(tabs)/aurora", params: { initialPrompt: prompt } } as any);
  };

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={SOFT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Aura Score</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* ── Score ring hero ── */}
      <View style={s.heroCard}>
        <LinearGradient
          colors={[`${scoreColor(healthScore)}08`, "transparent"]}
          style={StyleSheet.absoluteFill}
          borderRadius={22}
        />
        <ScoreRing score={healthScore} />

        {/* Max potential callout */}
        {gap > 0 && (
          <View style={s.gapRow}>
            <View style={s.gapDot} />
            <Text style={s.gapTxt}>
              {gap} pts away from{" "}
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {getScoreLabel(Math.min(healthScore + gap, 100))}
              </Text>
            </Text>
          </View>
        )}
      </View>

      {/* ── Score breakdown ── */}
      <Divider label="SCORE BREAKDOWN" />

      <View style={s.breakdownList}>
        <ComponentCard
          label="Hydration"
          weight="30%"
          earnedPts={hydPts}
          maxPts={30}
          rawPct={hydRaw}
          value={`${stats.waterMl}ml of ${profile.waterGoalMl}ml goal`}
          color={BLUE}
          insight={
            hydrationPct >= 90
              ? "Excellent hydration. Full contribution unlocked."
              : hydrationPct >= 60
              ? `${Math.round(profile.waterGoalMl - stats.waterMl)}ml left to reach your daily goal.`
              : `You're at ${Math.round(hydrationPct)}% hydration. Biggest easy win today.`
          }
        />
        <ComponentCard
          label="Sleep"
          weight="30%"
          earnedPts={slpPts}
          maxPts={30}
          rawPct={slpRaw}
          value={stats.sleepHours !== null ? `${stats.sleepHours}h last night` : "Not logged (defaulting to 50%)"}
          color={AMBER}
          insight={
            stats.sleepHours === null
              ? "Log your sleep to stop defaulting to 50% on this 30-point component."
              : stats.sleepHours >= 8
              ? "8h+ sleep — maximum contribution."
              : `${stats.sleepHours}h logged. Target 8h for the full 30 pts.`
          }
        />
        <ComponentCard
          label="Habits"
          weight="25%"
          earnedPts={habPts}
          maxPts={25}
          rawPct={habRaw}
          value={`${stats.habitsCompleted} of ${stats.habitsTotal} completed`}
          color={LIME}
          insight={
            habitPct >= 100
              ? "All habits done. Perfect 25-point contribution."
              : `${stats.habitsTotal - stats.habitsCompleted} habit${stats.habitsTotal - stats.habitsCompleted !== 1 ? "s" : ""} remaining — completing them adds ${25 - habPts} pts.`
          }
        />
        <ComponentCard
          label="Mood"
          weight="15%"
          earnedPts={moodPts}
          maxPts={15}
          rawPct={moodRaw}
          value={stats.mood ? MOOD_LABEL[stats.mood] : "Not set (defaulting to 50%)"}
          color={PURPLE}
          insight={
            !stats.mood
              ? "Set your mood on the home screen — it's 15 free points to calibrate."
              : MOOD_SCORE[stats.mood] >= 85
              ? "High energy mood — strong 15-point contribution."
              : "Mood improves naturally as you hit your other goals today."
          }
        />
      </View>

      {/* ── Focus on ── */}
      <Divider label="WHAT TO FOCUS ON" />

      <View style={s.focusList}>
        {weakest.map((w, i) => {
          const rankColors = [LIME, AMBER];
          const rc = rankColors[i];
          return (
            <View key={w.key} style={s.focusCard}>
              <View style={[s.focusNum, { borderColor: rc + "44", backgroundColor: rc + "10" }]}>
                <Text style={[s.focusNumTxt, { color: rc }]}>{i + 1}</Text>
              </View>
              <View style={s.focusMid}>
                <Text style={s.focusLabel}>
                  {w.key.charAt(0).toUpperCase() + w.key.slice(1)}
                </Text>
                <Text style={s.focusInsight}>{focusInsights[w.key]}</Text>
              </View>
              <View style={s.focusPts}>
                <Text style={[s.focusPtsNum, { color: rc }]}>+{w.max - w.pts}</Text>
                <Text style={s.focusPtsLbl}>pts left</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Sleep trend ── */}
      {last7sleep.length > 0 && (
        <>
          <Divider label="SLEEP TREND" />
          <View style={s.chartCard}>
            <View style={s.chartBars}>
              {last7sleep.map((entry, i) => {
                const day    = new Date(entry.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" });
                const barH   = Math.max(10, (entry.hours / maxSlp) * 90);
                const isGood = entry.hours >= 7;
                const isLast = i === last7sleep.length - 1;
                return (
                  <View key={i} style={s.chartCol}>
                    <Text style={[s.chartNum, isLast && { color: isGood ? LIME : AMBER }]}>
                      {entry.hours}h
                    </Text>
                    <View style={s.chartTrack}>
                      <LinearGradient
                        colors={isLast
                          ? (isGood ? [LIME, LIME + "88"] : [AMBER, AMBER + "88"])
                          : (isGood ? [LIME + "77", LIME + "33"] : [AMBER + "77", AMBER + "33"])}
                        style={[s.chartBar, { height: barH }]}
                      />
                    </View>
                    <Text style={[s.chartDay, isLast && { color: SOFT }]}>{day}</Text>
                  </View>
                );
              })}
            </View>
            {/* 8h guideline label */}
            <View style={s.guideline}>
              <View style={s.guidelineLine} />
              <Text style={s.guidelineTxt}>8h target</Text>
            </View>
          </View>
        </>
      )}

      {/* ── Top habits by streak ── */}
      {habits.some((h) => h.streak > 0) && (
        <>
          <Divider label="HABITS DRIVING YOUR SCORE" />
          <View style={s.habitChips}>
            {[...habits]
              .filter((h) => h.streak > 0)
              .sort((a, b) => b.streak - a.streak)
              .slice(0, 4)
              .map((h) => (
                <View key={h.id} style={[s.habitChip, h.completedToday && s.habitChipDone]}>
                  <View style={[s.habitChipDot, { backgroundColor: h.completedToday ? LIME : MUTED }]} />
                  <Text style={s.habitChipName}>{h.name}</Text>
                  <Text style={[s.habitChipStreak, h.completedToday && { color: LIME }]}>
                    {h.streak}d
                  </Text>
                </View>
              ))}
          </View>
        </>
      )}

      {/* ── Aurora CTA ── */}
      <TouchableOpacity style={s.ctaCard} onPress={goToAurora} activeOpacity={0.82}>
        <View style={s.ctaLeft}>
          <Text style={s.ctaTitle}>Get a personalised plan</Text>
          <Text style={s.ctaSub}>
            Aurora will tell you exactly what to do to push your score higher today.
          </Text>
        </View>
        <LinearGradient
          colors={[LIME, "#A0D000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ctaArrow}
        >
          <Ionicons name="arrow-forward" size={20} color="#000" />
        </LinearGradient>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 20,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.5 },

  // Hero
  heroCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 30,
    borderWidth: 1, borderColor: BORDER, overflow: "hidden",
    alignItems: "center", gap: 16,
  },
  gapRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  gapDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: MUTED },
  gapTxt: { color: MUTED, fontSize: 13, fontWeight: "500" },

  // Breakdown
  breakdownList: { gap: 10 },

  // Focus on
  focusList: { gap: 10 },
  focusCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: BORDER, gap: 14,
  },
  focusNum: {
    width: 34, height: 34, borderRadius: 99, borderWidth: 1,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  focusNumTxt: { fontSize: 14, fontWeight: "900" },
  focusMid:    { flex: 1, gap: 4 },
  focusLabel:  { color: "#fff", fontSize: 14, fontWeight: "700" },
  focusInsight:{ color: MUTED, fontSize: 12, lineHeight: 18 },
  focusPts:    { alignItems: "center", flexShrink: 0 },
  focusPtsNum: { fontSize: 22, fontWeight: "900", letterSpacing: -0.8 },
  focusPtsLbl: { color: MUTED, fontSize: 10, fontWeight: "600" },

  // Sleep chart
  chartCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: BORDER, gap: 8, position: "relative",
  },
  chartBars: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 6 },
  chartCol:  { flex: 1, alignItems: "center", gap: 5 },
  chartNum:  { color: MUTED, fontSize: 9, fontWeight: "700" },
  chartTrack:{ flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  chartBar:  { width: "75%", borderRadius: 6 },
  chartDay:  { color: MUTED, fontSize: 10, fontWeight: "500" },
  guideline: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER,
  },
  guidelineLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)", borderStyle: "dashed" },
  guidelineTxt:  { color: MUTED, fontSize: 10, fontWeight: "600" },

  // Habit chips
  habitChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  habitChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: CARD, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  habitChipDone:   { borderColor: LIME_BORDER, backgroundColor: LIME_DIM },
  habitChipDot:    { width: 6, height: 6, borderRadius: 99 },
  habitChipName:   { color: SOFT, fontSize: 13, fontWeight: "600" },
  habitChipStreak: { color: MUTED, fontSize: 11, fontWeight: "700" },

  // CTA
  ctaCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: CARD, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: LIME_BORDER, marginTop: 8, gap: 16,
  },
  ctaLeft:  { flex: 1, gap: 5 },
  ctaTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.4 },
  ctaSub:   { color: MUTED, fontSize: 13, lineHeight: 20 },
  ctaArrow: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
