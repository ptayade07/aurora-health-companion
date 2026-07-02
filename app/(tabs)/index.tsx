import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Circle, G } from "react-native-svg";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import PixelCompanion from "../../components/PixelCompanion";
import { COMPANIONS } from "../../lib/companion";
import type { Mood } from "../../lib/types";

// ── Palette ───────────────────────────────────────────────────────────────────
const BG      = "#070707";
const CARD    = "#101010";
const CARD2   = "#141414";
const LIME    = "#C8FF00";
const LIME_DIM = "rgba(200,255,0,0.10)";
const LIME_BORDER = "rgba(200,255,0,0.25)";
const WHITE   = "#FFFFFF";
const SOFT    = "rgba(255,255,255,0.68)";
const MUTED   = "rgba(255,255,255,0.38)";
const BORDER  = "rgba(255,255,255,0.08)";

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreLabel(s: number) {
  if (s >= 85) return "Elite";
  if (s >= 70) return "Doing Great";
  if (s >= 50) return "Not Bad";
  if (s >= 30) return "Getting There";
  return "Keep Going";
}

function sleepLabel(h: number | null) {
  if (h === null) return "Not logged";
  if (h >= 8) return "Excellent";
  if (h >= 7) return "Good";
  if (h >= 6) return "Fair";
  return "Needs work";
}

function companionMessage(
  waterMl: number, waterGoal: number,
  habitsCompleted: number, habitsTotal: number,
  sleepHours: number | null,
  fallback: string,
): string {
  const gap = waterGoal - waterMl;
  if (gap > 100) return `Drink ${gap}ml more and we'll hit today's goal.`;
  if (habitsCompleted < habitsTotal)
    return `${habitsTotal - habitsCompleted} more habit${habitsTotal - habitsCompleted !== 1 ? "s" : ""} to go. Almost there!`;
  if (sleepHours === null) return "Don't forget to log your sleep tonight!";
  return fallback;
}

const MOOD_ORDER: Mood[] = ["dead_inside", "sleepy", "fine", "slaying", "unstoppable"];
const MOOD_ICON: Record<Mood, React.ComponentProps<typeof Ionicons>["name"]> = {
  dead_inside: "remove-circle-outline",
  sleepy:      "moon-outline",
  fine:        "happy-outline",
  slaying:     "flash-outline",
  unstoppable: "flame-outline",
};
const MOOD_LABEL: Record<Mood, string> = {
  dead_inside: "Dead", sleepy: "Sleepy", fine: "Motivated",
  slaying: "Slaying", unstoppable: "Unstoppable",
};

// ── Aura Ring ─────────────────────────────────────────────────────────────────
function AuraRing({ score, onPress }: { score: number; onPress: () => void }) {
  const SIZE = 230;
  const CX = 115, CY = 115, R = 95;
  const C = 2 * Math.PI * R;
  const filled = Math.min((score / 100) * C, C - 0.5);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={ring.wrap}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 16, delay: 100 }}
        style={{ width: SIZE, height: SIZE }}
      >
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={CX} cy={CY} r={R}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
          <G transform={`rotate(-90 ${CX} ${CY})`}>
            <Circle cx={CX} cy={CY} r={R}
              fill="none" stroke={LIME} strokeWidth={14} strokeLinecap="round"
              strokeDasharray={`${filled} ${C}`} />
          </G>
        </Svg>
        <View style={ring.center}>
          <Text style={ring.label}>AURA SCORE</Text>
          <Text style={ring.score}>{score}</Text>
          <Text style={ring.max}>/100</Text>
        </View>
      </MotiView>

      {/* Status pill */}
      <View style={ring.pill}>
        <View style={ring.dot} />
        <Text style={ring.pillTxt}>{scoreLabel(score)}</Text>
      </View>

      <Text style={ring.hint}>Tap for breakdown</Text>
    </TouchableOpacity>
  );
}
const ring = StyleSheet.create({
  wrap:    { alignItems: "center", gap: 14 },
  center:  { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  label:   { color: MUTED, fontSize: 9, fontWeight: "700", letterSpacing: 2.5, marginBottom: 2 },
  score:   { color: WHITE, fontSize: 68, fontWeight: "900", letterSpacing: -3, lineHeight: 72 },
  max:     { color: MUTED, fontSize: 15, fontWeight: "600", marginTop: -4 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: LIME_DIM, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: LIME_BORDER,
  },
  dot:     { width: 7, height: 7, borderRadius: 99, backgroundColor: LIME },
  pillTxt: { color: LIME, fontSize: 13, fontWeight: "800" },
  hint:    { color: MUTED, fontSize: 11, fontWeight: "500" },
});

// ── Companion Card ────────────────────────────────────────────────────────────
function CompanionCard({
  companionId, companionName, mood, level, message,
}: {
  companionId: any; companionName: string; mood: any;
  level: number; message: string;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, delay: 120 }}
      style={cp.card}
    >
      {/* Header row */}
      <View style={cp.header}>
        <Text style={cp.name}>{companionName}</Text>
        <View style={cp.lvBadge}>
          <Text style={cp.lvTxt}>Lv. {level}</Text>
        </View>
      </View>

      {/* Companion + message */}
      <View style={cp.body}>
        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: [-4, 4, -4] }}
          transition={{ loop: true, type: "timing", duration: 2200 }}
        >
          <PixelCompanion companionId={companionId} mood={mood} size={90} />
        </MotiView>

        {/* Speech bubble */}
        <View style={cp.bubble}>
          <View style={cp.bubbleTail} />
          <Text style={cp.bubbleTxt}>{message}</Text>
        </View>
      </View>
    </MotiView>
  );
}
const cp = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderRadius: 22,
    padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  name:    { color: WHITE, fontSize: 16, fontWeight: "700" },
  lvBadge: { backgroundColor: LIME_DIM, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: LIME_BORDER },
  lvTxt:   { color: LIME, fontSize: 11, fontWeight: "800" },
  body:    { flexDirection: "row", alignItems: "center", gap: 16 },
  bubble:  { flex: 1, backgroundColor: CARD2, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER },
  bubbleTail: {
    position: "absolute", left: -7, top: 18,
    width: 0, height: 0,
    borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 8,
    borderTopColor: "transparent", borderBottomColor: "transparent", borderRightColor: CARD2,
  },
  bubbleTxt: { color: SOFT, fontSize: 13, lineHeight: 20 },
});

// ── Missions Card ─────────────────────────────────────────────────────────────
function MissionsCard({
  waterMl, waterGoal, sleepHours, habitsCompleted, habitsTotal,
}: {
  waterMl: number; waterGoal: number; sleepHours: number | null;
  habitsCompleted: number; habitsTotal: number;
}) {
  const missions = [
    {
      label: `Drink ${(waterGoal / 1000).toFixed(1)}L water`,
      done: waterMl >= waterGoal,
    },
    {
      label: "Sleep 7+ hours",
      done: sleepHours !== null && sleepHours >= 7,
    },
    {
      label: `Complete ${Math.min(3, habitsTotal)} habits`,
      done: habitsCompleted >= Math.min(3, habitsTotal),
    },
  ];
  const doneCount = missions.filter((m) => m.done).length;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, delay: 160 }}
      style={ms.card}
    >
      <View style={ms.header}>
        <View>
          <Text style={ms.eyebrow}>Today's Missions</Text>
          <Text style={ms.sub}>{doneCount} of {missions.length} complete</Text>
        </View>
        <View style={ms.xpBadge}>
          <Text style={ms.xpTxt}>+50 XP</Text>
        </View>
      </View>

      {missions.map((m, i) => (
        <View key={i} style={ms.row}>
          <View style={[ms.checkbox, m.done && ms.checkboxDone]}>
            {m.done && <Text style={ms.checkmark}>✓</Text>}
          </View>
          <Text style={[ms.missionTxt, m.done && ms.missionDone]}>
            {m.label}
          </Text>
        </View>
      ))}

      {/* Progress bar */}
      <View style={ms.track}>
        <MotiView
          from={{ width: "0%" }}
          animate={{ width: `${(doneCount / missions.length) * 100}%` }}
          transition={{ type: "timing", duration: 700, delay: 300 }}
          style={ms.fill}
        />
      </View>
    </MotiView>
  );
}
const ms = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderRadius: 22,
    padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  header:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  eyebrow:  { color: WHITE, fontSize: 15, fontWeight: "700" },
  sub:      { color: MUTED, fontSize: 11, fontWeight: "500", marginTop: 2 },
  xpBadge:  { backgroundColor: LIME, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  xpTxt:    { color: "#000", fontSize: 11, fontWeight: "800" },

  row:          { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  checkboxDone: { backgroundColor: LIME, borderColor: LIME },
  checkmark:    { color: "#000", fontSize: 12, fontWeight: "900" },
  missionTxt:   { color: SOFT, fontSize: 14, fontWeight: "500", flex: 1 },
  missionDone:  { color: MUTED, textDecorationLine: "line-through" },

  track: { height: 3, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, marginTop: 6, overflow: "hidden" },
  fill:  { height: 3, backgroundColor: LIME, borderRadius: 99 },
});

// ── Health Card (grid cell) ────────────────────────────────────────────────────
function HealthCard({
  label, value, unit, sub, accent, onPress, children,
}: {
  label: string; value: string | number; unit?: string;
  sub: string; accent?: boolean; onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[hc.card, accent && hc.cardAccent]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Text style={[hc.label, accent && hc.labelAccent]}>{label}</Text>
      <Text style={[hc.value, accent && hc.valueAccent]}>
        {value}
        {unit ? <Text style={[hc.unit, accent && hc.unitAccent]}>{unit}</Text> : null}
      </Text>
      <Text style={[hc.sub, accent && hc.subAccent]}>{sub}</Text>
      {children}
    </TouchableOpacity>
  );
}
const hc = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: CARD, borderRadius: 22,
    padding: 18, minHeight: 148,
    justifyContent: "space-between",
    borderWidth: 1, borderColor: BORDER,
  },
  cardAccent:  { backgroundColor: LIME, borderColor: LIME },
  label:       { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  labelAccent: { color: "rgba(0,0,0,0.50)" },
  value:       { color: WHITE, fontSize: 38, fontWeight: "900", letterSpacing: -1.5, marginTop: 8 },
  valueAccent: { color: "#000" },
  unit:        { fontSize: 18, fontWeight: "700", color: SOFT },
  unitAccent:  { color: "rgba(0,0,0,0.55)" },
  sub:         { color: MUTED, fontSize: 11, fontWeight: "500" },
  subAccent:   { color: "rgba(0,0,0,0.50)" },
});

// ── Mood Card ─────────────────────────────────────────────────────────────────
function MoodCard({ mood, onCycle }: { mood: Mood | null; onCycle: () => void }) {
  const current = mood ?? "fine";
  return (
    <TouchableOpacity style={[hc.card, mo.card]} onPress={onCycle} activeOpacity={0.82}>
      <Text style={hc.label}>Mood</Text>
      <Ionicons name={MOOD_ICON[current]} size={32} color={LIME} style={mo.icon} />
      <Text style={mo.moodLabel}>{MOOD_LABEL[current]}</Text>
      <Text style={mo.tap}>Tap to change</Text>
    </TouchableOpacity>
  );
}
const mo = StyleSheet.create({
  card:      { justifyContent: "flex-start", gap: 4 },
  icon:      { marginTop: 8 },
  moodLabel: { color: WHITE, fontSize: 14, fontWeight: "700", marginTop: 2 },
  tap:       { color: MUTED, fontSize: 10, fontWeight: "500", marginTop: 4 },
});

// ── Nutrition Card ─────────────────────────────────────────────────────────────
function NutritionCard({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={nt.card} onPress={onPress} activeOpacity={0.82}>
      <View style={nt.left}>
        <Text style={nt.label}>Nutrition</Text>
        <Text style={nt.value}>
          {count > 0 ? count : "—"}
          {count > 0 && <Text style={nt.unit}> {count === 1 ? "meal" : "meals"} logged</Text>}
        </Text>
        <Text style={nt.sub}>{count === 0 ? "Nothing logged yet" : "Today"}</Text>
      </View>
      <Text style={nt.arrow}>→</Text>
    </TouchableOpacity>
  );
}
const nt = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderRadius: 22,
    padding: 20, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: BORDER, marginBottom: 14,
  },
  left:  { gap: 3 },
  label: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  value: { color: WHITE, fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  unit:  { fontSize: 16, fontWeight: "500", color: SOFT },
  sub:   { color: MUTED, fontSize: 11, fontWeight: "500" },
  arrow: { color: LIME, fontSize: 22, fontWeight: "700" },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    profile, stats,
    healthScore, companionMood, auroraSays,
    todayNutrition, setMood,
  } = useApp();

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? "Up late," :
    hour < 12 ? "Good morning," :
    hour < 17 ? "Hey," : "Good evening,";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const companion = COMPANIONS.find((c) => c.id === profile.companionType) ?? COMPANIONS[0];
  const companionLevel = Math.max(1, Math.floor(healthScore / 20) + 1);
  const compMsg = companionMessage(
    stats.waterMl, profile.waterGoalMl,
    stats.habitsCompleted, stats.habitsTotal,
    stats.sleepHours,
    auroraSays,
  );

  const waterPct = Math.min(Math.round((stats.waterMl / profile.waterGoalMl) * 100), 100);

  const cycleMood = () => {
    const idx = MOOD_ORDER.indexOf(stats.mood ?? "fine");
    setMood(MOOD_ORDER[(idx + 1) % MOOD_ORDER.length]);
  };

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 20 }}
        style={s.header}
      >
        <View>
          <Text style={s.greeting}>{greeting}</Text>
          <Text style={s.name}>{profile.name || "there"}</Text>
        </View>
        <Text style={s.date}>{today}</Text>
      </MotiView>

      {/* ── Aura Ring ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 60 }}
        style={s.ringCard}
      >
        <AuraRing
          score={healthScore}
          onPress={() => router.push("/aura-score" as any)}
        />
      </MotiView>

      {/* ── Companion ── */}
      <CompanionCard
        companionId={profile.companionType}
        companionName={companion.name}
        mood={companionMood}
        level={companionLevel}
        message={compMsg}
      />

      {/* ── Today's Missions ── */}
      <MissionsCard
        waterMl={stats.waterMl}
        waterGoal={profile.waterGoalMl}
        sleepHours={stats.sleepHours}
        habitsCompleted={stats.habitsCompleted}
        habitsTotal={stats.habitsTotal}
      />

      {/* ── Health Grid ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18, delay: 200 }}
        style={s.grid}
      >
        {/* Row 1: Water + Sleep */}
        <View style={s.row}>
          <HealthCard
            accent
            label="Water"
            value={stats.waterMl}
            unit="ml"
            sub={`${waterPct}% · goal ${profile.waterGoalMl}ml`}
            onPress={() => router.push("/(tabs)/water")}
          />
          <HealthCard
            label="Sleep"
            value={stats.sleepHours ?? "—"}
            unit={stats.sleepHours !== null ? "h" : undefined}
            sub={sleepLabel(stats.sleepHours)}
            onPress={() => router.push("/(tabs)/sleep" as any)}
          />
        </View>

        {/* Row 2: Habits + Mood */}
        <View style={s.row}>
          <HealthCard
            label="Habits"
            value={stats.habitsCompleted}
            unit={` / ${stats.habitsTotal}`}
            sub={stats.habitsCompleted === stats.habitsTotal && stats.habitsTotal > 0 ? "All done!" : "Done today"}
            onPress={() => router.push("/(tabs)/quests")}
          />
          <MoodCard mood={stats.mood} onCycle={cycleMood} />
        </View>
      </MotiView>

      {/* ── Nutrition ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18, delay: 260 }}
      >
        <NutritionCard
          count={todayNutrition.length}
          onPress={() => router.push("/(tabs)/nutrition" as any)}
        />
      </MotiView>
    </ScrollView>
  );
}

// ── Root Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16 },

  header: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-between", marginBottom: 28,
  },
  greeting: { color: MUTED, fontSize: 14, fontWeight: "500" },
  name:     { color: WHITE, fontSize: 30, fontWeight: "800", letterSpacing: -1, marginTop: 2 },
  date:     { color: MUTED, fontSize: 11, fontWeight: "500", paddingBottom: 4 },

  ringCard: {
    backgroundColor: CARD, borderRadius: 28,
    paddingVertical: 32, alignItems: "center",
    marginBottom: 14, borderWidth: 1, borderColor: BORDER,
  },

  grid: { gap: 10, marginBottom: 14 },
  row:  { flexDirection: "row", gap: 10 },
});
