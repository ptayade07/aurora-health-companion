import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { useApp } from "../../context/AppContext";
import PixelCompanion from "../../components/PixelCompanion";

// ── Palette ────────────────────────────────────────────────────────────────────
const LIME         = "#C8FF00";
const LIME_DIM     = "rgba(200,255,0,0.10)";
const LIME_BORDER  = "rgba(200,255,0,0.18)";
const BG           = "#070707";
const CARD         = "#101010";
const CARD_ALT     = "#181818";
const MUTED        = "rgba(255,255,255,0.30)";
const SOFT         = "rgba(255,255,255,0.65)";
const BORDER       = "rgba(255,255,255,0.07)";
const AMBER        = "#FBBF24";
const BLUE         = "#60C8FF";

// ── Mood data — kaomoji, not emoji ────────────────────────────────────────────
const MOODS = [
  { key: "dead_inside", label: "Dead",    kao: "(╥﹏╥)"     },
  { key: "sleepy",      label: "Sleepy",  kao: "(￣ρ￣)zzZ" },
  { key: "fine",        label: "Fine",    kao: "(•‿•)"      },
  { key: "slaying",     label: "Slaying", kao: "(⌐■_■)"     },
  { key: "unstoppable", label: "On fire", kao: "ᕦ(ò_óˇ)ᕤ"  },
] as const;

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function scoreLabel(s: number) {
  if (s >= 85) return "Elite";
  if (s >= 70) return "Strong";
  if (s >= 50) return "Good";
  if (s >= 30) return "Fair";
  return "Low";
}

// ── Aura ring — number sits in the clear inner space, no overlap ──────────────
//  Ring:  SIZE=176, CX=CY=88, R=70, strokeWidth=6
//  Inner clear radius = 70 − 3 = 67px → inner diameter = 134px
//  Score text at fontSize 52, lineHeight 56 → 56px tall → ≈39px padding each side ✓
function AuraRing({ score }: { score: number }) {
  const SIZE = 176;
  const CX = 88, CY = 88, R = 70;
  const C = 2 * Math.PI * R;
  const filled = Math.min((score / 100) * C, C - 0.1);

  return (
    <View style={ar.wrap}>
      {/* SVG ring */}
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          {/* Track */}
          <Circle cx={CX} cy={CY} r={R}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
          {/* Progress arc — starts at 12 o'clock */}
          <G transform={`rotate(-90 ${CX} ${CY})`}>
            <Circle cx={CX} cy={CY} r={R}
              fill="none" stroke={LIME} strokeWidth={6} strokeLinecap="round"
              strokeDasharray={`${filled} ${C}`}
            />
          </G>
        </Svg>
        {/* Score number — centered inside the ring, well within inner radius */}
        <View style={[StyleSheet.absoluteFill, ar.center]}>
          <Text style={ar.num}>{score}</Text>
        </View>
      </View>
      {/* Labels sit below the ring, never inside it */}
      <Text style={ar.tag}>AURA SCORE</Text>
      <View style={ar.pill}>
        <Text style={ar.pillTxt}>{scoreLabel(score)}</Text>
      </View>
    </View>
  );
}

const ar = StyleSheet.create({
  wrap:   { alignSelf: "center", alignItems: "center", marginVertical: 18 },
  center: { alignItems: "center", justifyContent: "center" },
  num: {
    color: "#fff",
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -2.5,
    lineHeight: 56,
    textAlign: "center",
  },
  tag: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 12,
  },
  pill: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  pillTxt: { color: SOFT, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
});

// ── Hero card — greeting + ring + vibe ───────────────────────────────────────
function HeroSection({
  score, greeting, name,
  companionId, companionMood,
  vibe, auroraSays, onAskAurora, onScoreTap,
}: {
  score: number; greeting: string; name: string;
  companionId: any; companionMood: any;
  vibe: any; auroraSays: string;
  onAskAurora: () => void; onScoreTap: () => void;
}) {
  return (
    <LinearGradient
      colors={["#0D0D0D", "#0A100A", BG]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={hero.card}
    >
      {/* Greeting row */}
      <View style={hero.topRow}>
        <View>
          <Text style={hero.greeting}>{greeting},</Text>
          <Text style={hero.name}>{name || "there"}.</Text>
        </View>
        <PixelCompanion companionId={companionId} mood={companionMood} size={60} />
      </View>

      {/* Ring — tappable, navigates to score breakdown */}
      <TouchableOpacity onPress={onScoreTap} activeOpacity={0.85}>
        <AuraRing score={score} />
      </TouchableOpacity>

      {/* Divider */}
      <View style={hero.divider} />

      {/* Vibe pill + message */}
      <View style={hero.vibePill}>
        <Text style={hero.vibeText}>{vibe.emoji}  {vibe.title}</Text>
      </View>
      <Text style={hero.say} numberOfLines={2}>{auroraSays}</Text>
      <TouchableOpacity onPress={onAskAurora} style={hero.linkRow}>
        <Text style={hero.linkTxt}>Chat with Aurora</Text>
        <Text style={hero.linkArrow}> →</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const hero = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: LIME_BORDER,
    marginBottom: 14,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { color: SOFT, fontSize: 20, fontWeight: "400", letterSpacing: -0.3 },
  name:     { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -1.2, marginTop: 2 },
  divider:  { height: 1, backgroundColor: BORDER, marginVertical: 16 },
  vibePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  vibeText: { color: SOFT, fontSize: 12, fontWeight: "700", letterSpacing: 0.2 },
  say:      { color: SOFT, fontSize: 14, lineHeight: 22, marginBottom: 14 },
  linkRow:  { flexDirection: "row", alignItems: "center" },
  linkTxt:  { color: "#fff", fontSize: 13, fontWeight: "700" },
  linkArrow:{ color: MUTED, fontSize: 15, fontWeight: "700" },
});

// ── Quick stats — no emojis ───────────────────────────────────────────────────
function QuickStats({
  waterPct, sleepHours, streak,
}: { waterPct: number; sleepHours: number | null; streak: number }) {
  const pills = [
    { value: `${waterPct}%`,                               label: "WATER",  on: waterPct >= 80 },
    { value: sleepHours !== null ? `${sleepHours}h` : "—", label: "SLEEP",  on: sleepHours !== null && sleepHours >= 7 },
    { value: `${streak}`,                                  label: "STREAK", on: streak >= 3 },
  ];
  return (
    <View style={qs.row}>
      {pills.map((p) => (
        <View key={p.label} style={[qs.pill, p.on && qs.pillOn]}>
          <Text style={qs.val}>{p.value}</Text>
          <Text style={qs.lbl}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}

const qs = StyleSheet.create({
  row:   { flexDirection: "row", gap: 8, marginBottom: 14 },
  pill:  {
    flex: 1, backgroundColor: CARD, borderRadius: 10, padding: 14,
    alignItems: "center", gap: 4, borderWidth: 1, borderColor: BORDER,
  },
  pillOn: { borderColor: "rgba(255,255,255,0.14)", backgroundColor: CARD_ALT },
  val:   { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  lbl:   { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
});

// ── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color = LIME, h = 4 }: { pct: number; color?: string; h?: number }) {
  return (
    <View style={[bar.track, { height: h }]}>
      <View style={[bar.fill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}
const bar = StyleSheet.create({
  track: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 99 },
});

// ── Divider with centred label ────────────────────────────────────────────────
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
  row:  { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: BORDER },
  text: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
});

// ── Stat card — no emoji, dot indicator instead ───────────────────────────────
function StatCard({
  dotColor, label, value, unit, pct, barColor, sub, status, statusOn, onPress,
}: {
  dotColor: string; label: string; value: string | number;
  unit?: string; pct: number; barColor: string;
  sub: string; status: string; statusOn: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={sc.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[sc.accent, { backgroundColor: barColor, opacity: statusOn ? 0.85 : 0.35 }]} />
      <View style={sc.body}>
        <View style={sc.topRow}>
          <View style={[sc.dot, { backgroundColor: dotColor }]} />
          <Text style={sc.label}>{label}</Text>
        </View>
        <Text style={sc.num}>
          {value}{unit && <Text style={sc.unit}>{unit}</Text>}
        </Text>
        <Bar pct={pct} color={barColor} h={3} />
        <View style={sc.bottom}>
          <Text style={sc.sub}>{sub}</Text>
          <View style={[sc.chip, { backgroundColor: statusOn ? LIME_DIM : "rgba(255,255,255,0.05)" }]}>
            <Text style={[sc.chipTxt, { color: statusOn ? LIME : MUTED }]}>{status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const sc = StyleSheet.create({
  card:  { flex: 1, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: "hidden", minHeight: 170 },
  accent:{ height: 3, width: "100%" },
  body:  { padding: 16, flex: 1, gap: 6 },
  topRow:{ flexDirection: "row", alignItems: "center", gap: 8 },
  dot:   { width: 6, height: 6, borderRadius: 99 },
  label: { color: MUTED, fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  num: {
    color: "#fff", fontSize: 34, fontWeight: "900",
    letterSpacing: -1.5, lineHeight: 38, marginVertical: 4,
  },
  unit:  { fontSize: 16, fontWeight: "700", color: SOFT },
  bottom:{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  sub:   { color: MUTED, fontSize: 11 },
  chip:  { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipTxt: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
});

// ── Habit grid ────────────────────────────────────────────────────────────────
function HabitGrid({ habits }: { habits: any[] }) {
  if (!habits.length) return null;
  const dow = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun
  const doneToday = habits.filter((h) => h.completedToday).length;
  const weekPct   = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;

  return (
    <View style={hg.card}>
      {/* Summary header */}
      <View style={hg.summary}>
        <View>
          <Text style={hg.summaryTitle}>This Week</Text>
          <Text style={hg.summarySub}>
            {doneToday} of {habits.length} habit{habits.length !== 1 ? "s" : ""} done today
          </Text>
        </View>
        <View style={[hg.summaryBadge, weekPct === 100 && { borderColor: LIME + "55", backgroundColor: LIME_DIM }]}>
          <Text style={[hg.summaryPct, weekPct === 100 && { color: LIME }]}>{weekPct}%</Text>
        </View>
      </View>

      {/* Day header row */}
      <View style={hg.headerRow}>
        <View style={{ width: 90 }} />
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={hg.dayCell}>
            <Text style={[hg.dayLbl, i === dow && { color: LIME }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Habit rows */}
      {habits.slice(0, 5).map((h) => (
        <View key={h.id} style={hg.habitRow}>
          <Text style={hg.habitName} numberOfLines={1}>{h.name}</Text>
          {DAY_LABELS.map((_, i) => {
            const daysAgo = dow - i;
            const future  = daysAgo < 0;
            const done    = !future && (daysAgo === 0 ? h.completedToday : h.streak >= daysAgo);
            return (
              <View key={i} style={hg.dayCell}>
                <View style={[hg.dot, done && hg.dotOn, future && hg.dotFuture]}>
                  {done && <View style={hg.dotInner} />}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
const hg = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: BORDER, gap: 14,
  },

  summary:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  summarySub:   { color: MUTED, fontSize: 11 },
  summaryBadge: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.04)",
  },
  summaryPct: { color: MUTED, fontSize: 13, fontWeight: "800" },

  headerRow: { flexDirection: "row", alignItems: "center" },
  dayCell:   { width: 32, alignItems: "center" },
  dayLbl:    { color: MUTED, fontSize: 10, fontWeight: "700" },

  habitRow:  { flexDirection: "row", alignItems: "center" },
  habitName: { width: 90, color: SOFT, fontSize: 11, fontWeight: "600", paddingRight: 6 },

  dot: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  dotOn:     { backgroundColor: LIME_DIM, borderColor: LIME_BORDER },
  dotFuture: { backgroundColor: "transparent", borderColor: "transparent" },
  dotInner:  { width: 7, height: 7, borderRadius: 99, backgroundColor: LIME },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    profile, stats, habits, vibe, auroraSays, healthScore,
    hydrationPct, todayNutrition, setMood, companionMood,
  } = useApp();

  const longestStreak = habits.reduce((m: number, h: any) => Math.max(m, h.streak), 0);

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? "Up late"      :
    hour < 12 ? "Good morning" :
    hour < 17 ? "Hey"          : "Good evening";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const waterPct = Math.min(Math.round(hydrationPct), 100);
  const questPct = stats.habitsTotal > 0
    ? Math.round((stats.habitsCompleted / stats.habitsTotal) * 100)
    : 0;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Date ── */}
      <Text style={s.date}>{today}</Text>

      {/* ── Hero: greeting + aura ring + vibe ── */}
      <HeroSection
        score={healthScore}
        greeting={greeting}
        name={profile.name}
        companionId={profile.companionType ?? "fox"}
        companionMood={companionMood}
        vibe={vibe}
        auroraSays={auroraSays}
        onAskAurora={() => router.push("/(tabs)/aurora")}
        onScoreTap={() => router.push("/aura-score" as any)}
      />

      {/* ── Quick stat pills ── */}
      <QuickStats
        waterPct={waterPct}
        sleepHours={stats.sleepHours}
        streak={longestStreak}
      />

      {/* ── Mood: kaomoji chips ── */}
      <Divider label="HOW ARE YOU FEELING" />
      <View style={s.moodRow}>
        {MOODS.map((m) => {
          const active = stats.mood === m.key;
          return (
            <Pressable
              key={m.key}
              style={[s.moodChip, active && s.moodActive]}
              onPress={() => setMood(m.key)}
            >
              <Text style={[s.moodKao, active && s.moodKaoActive]}>{m.kao}</Text>
              <Text style={[s.moodLbl, active && { color: "#000" }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Stat cards ── */}
      <Divider label="TODAY" />
      <View style={s.statsRow}>
        <StatCard
          dotColor={waterPct >= 80 ? LIME : BLUE}
          label="Hydration"
          value={waterPct}
          unit="%"
          pct={waterPct}
          barColor={waterPct >= 80 ? LIME : BLUE}
          sub={`${stats.waterMl} / ${profile.waterGoalMl} ml`}
          status={waterPct >= 80 ? "On track" : "Keep going"}
          statusOn={waterPct >= 80}
          onPress={() => router.push("/(tabs)/water")}
        />
        <StatCard
          dotColor={stats.sleepHours !== null && stats.sleepHours >= 7 ? LIME : AMBER}
          label="Sleep"
          value={stats.sleepHours ?? "—"}
          unit={stats.sleepHours !== null ? "h" : undefined}
          pct={stats.sleepHours !== null ? (stats.sleepHours / 9) * 100 : 0}
          barColor={stats.sleepHours !== null && stats.sleepHours >= 7 ? LIME : AMBER}
          sub={stats.sleepHours !== null ? "last night" : "not logged"}
          status={
            stats.sleepHours !== null
              ? stats.sleepHours >= 7 ? "Goal met" : "Under goal"
              : "Log it"
          }
          statusOn={stats.sleepHours !== null && stats.sleepHours >= 7}
          onPress={() => router.push("/(tabs)/sleep" as any)}
        />
      </View>

      {/* ── Quests ── */}
      <TouchableOpacity
        style={s.questCard}
        onPress={() => router.push("/(tabs)/quests")}
        activeOpacity={0.78}
      >
        <View style={s.questRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.questTitle}>Daily Quests</Text>
            <Text style={s.questSub}>
              {questPct === 100
                ? "All done. You're built different."
                : `${stats.habitsTotal - stats.habitsCompleted} remaining today`}
            </Text>
          </View>
          <Text style={s.questPct}>
            {questPct}<Text style={s.questSign}>%</Text>
          </Text>
        </View>
        <View style={s.questTrack}>
          {questPct > 0 && (
            <LinearGradient
              colors={[LIME, "#8ECC00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.questFill, { width: `${Math.min(questPct, 100)}%` }]}
            />
          )}
        </View>
        <Text style={s.questFraction}>{stats.habitsCompleted} of {stats.habitsTotal} done</Text>
      </TouchableOpacity>

      {/* ── Nutrition ── */}
      <TouchableOpacity
        style={s.mealCard}
        onPress={() => router.push("/(tabs)/nutrition" as any)}
        activeOpacity={0.78}
      >
        <View style={s.mealLeft}>
          <View style={s.mealIconBox}>
            <Text style={s.mealAbbr}>NU</Text>
          </View>
          <View>
            <Text style={s.mealTitle}>Nutrition</Text>
            <Text style={s.mealSub}>
              {todayNutrition.length === 0
                ? "Nothing logged yet"
                : `${todayNutrition.length} meal${todayNutrition.length !== 1 ? "s" : ""} logged`}
            </Text>
          </View>
        </View>
        <View style={[s.mealChip, {
          backgroundColor: todayNutrition.length > 0 ? LIME_DIM : "rgba(255,255,255,0.05)",
        }]}>
          <Text style={[s.mealChipTxt, { color: todayNutrition.length > 0 ? LIME : MUTED }]}>
            {todayNutrition.length > 0 ? "On track" : "Log meal"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ── This week habit grid ── */}
      {habits.length > 0 && (
        <>
          <Divider label="THIS WEEK" />
          <HabitGrid habits={habits} />
        </>
      )}

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  date: { color: MUTED, fontSize: 12, fontWeight: "500", letterSpacing: 0.3, marginBottom: 14 },

  // Mood
  moodRow: { flexDirection: "row", gap: 7, marginBottom: 4 },
  moodChip: {
    flex: 1, alignItems: "center", paddingVertical: 13,
    borderRadius: 14, backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER, gap: 6,
  },
  moodActive: { backgroundColor: LIME, borderColor: LIME },
  moodKao:    { color: "rgba(255,255,255,0.68)", fontSize: 10, textAlign: "center" },
  moodKaoActive: { color: "#000" },
  moodLbl: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  // Stat cards row
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },

  // Quest card
  questCard: {
    backgroundColor: BG, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 4,
    marginBottom: 10, gap: 14,
  },
  questRow:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  questTitle:   { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
  questSub:     { color: MUTED, fontSize: 12, lineHeight: 18 },
  questPct:     { color: "#fff", fontSize: 46, fontWeight: "900", letterSpacing: -2, lineHeight: 48 },
  questSign:    { fontSize: 20, fontWeight: "700", letterSpacing: 0 },
  questTrack:   { height: 7, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" },
  questFill:    { height: "100%", borderRadius: 99 },
  questFraction:{ color: MUTED, fontSize: 11, fontWeight: "600" },

  // Nutrition strip
  mealCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: CARD, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 4,
  },
  mealLeft:    { flexDirection: "row", alignItems: "center", gap: 14 },
  mealIconBox: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: CARD_ALT, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: BORDER,
  },
  mealAbbr:    { color: MUTED, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  mealTitle:   { color: "#fff", fontSize: 15, fontWeight: "700" },
  mealSub:     { color: MUTED, fontSize: 12, marginTop: 2 },
  mealChip:    { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  mealChipTxt: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },

});
