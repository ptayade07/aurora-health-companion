import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { useApp } from "../../context/AppContext";

// ── Palette ───────────────────────────────────────────────────────────────────
const LIME         = "#C8FF00";
const LIME_DIM     = "rgba(200,255,0,0.14)";
const LIME_BORDER  = "rgba(200,255,0,0.28)";
const BG           = "#070809";
const GLASS        = "rgba(255,255,255,0.05)";
const GLASS_BORDER = "rgba(255,255,255,0.10)";
const WHITE        = "#FFFFFF";
const SOFT         = "rgba(255,255,255,0.72)";
const MUTED        = "rgba(255,255,255,0.42)";

// ── Mood data ─────────────────────────────────────────────────────────────────
const MOODS = [
  { key: "dead_inside", label: "Dead",    kao: "(╥﹏╥)"     },
  { key: "sleepy",      label: "Sleepy",  kao: "(￣ρ￣)zzZ" },
  { key: "fine",        label: "Fine",    kao: "(•‿•)"      },
  { key: "slaying",     label: "Slaying", kao: "(⌐■_■)"     },
  { key: "unstoppable", label: "On fire", kao: "ᕦ(ò_óˇ)ᕤ"  },
] as const;

function scoreLabel(s: number) {
  if (s >= 85) return "Elite";
  if (s >= 70) return "Strong";
  if (s >= 50) return "Good";
  if (s >= 30) return "Fair";
  return "Low";
}

// ── Aura Ring ─────────────────────────────────────────────────────────────────
function AuraRing({ score }: { score: number }) {
  const SIZE = 192;
  const CX = 96, CY = 96, R = 78;
  const C = 2 * Math.PI * R;
  const filled = Math.min((score / 100) * C, C - 0.1);

  return (
    <View style={{ width: SIZE, height: SIZE, alignSelf: "center" }}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle cx={CX} cy={CY} r={R}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        {/* Arc */}
        <G transform={`rotate(-90 ${CX} ${CY})`}>
          <Circle cx={CX} cy={CY} r={R}
            fill="none" stroke={LIME} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={`${filled} ${C}`}
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={ring.num}>{score}</Text>
        <Text style={ring.sub}>AURA SCORE</Text>
      </View>
    </View>
  );
}
const ring = StyleSheet.create({
  num: { color: WHITE, fontSize: 54, fontWeight: "900", letterSpacing: -2.5, lineHeight: 56, textAlign: "center" },
  sub: { color: MUTED, fontSize: 9, fontWeight: "700", letterSpacing: 3, textAlign: "center", marginTop: 4 },
});

// ── Hero Card ─────────────────────────────────────────────────────────────────
function HeroCard({
  score, greeting, name,
  vibe, auroraSays, onAskAurora, onScoreTap,
}: {
  score: number; greeting: string; name: string;
  vibe: any; auroraSays: string;
  onAskAurora: () => void; onScoreTap: () => void;
}) {
  return (
    <LinearGradient
      colors={["rgba(200,255,0,0.07)", "rgba(255,255,255,0.03)", "rgba(0,0,0,0)"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={hc.outer}
    >
      <View style={hc.inner}>
        {/* Top row */}
        <View style={hc.topRow}>
          <View>
            <Text style={hc.greeting}>{greeting}</Text>
            <Text style={hc.name}>{name || "there"}</Text>
          </View>
        </View>

        {/* Ring */}
        <TouchableOpacity onPress={onScoreTap} activeOpacity={0.85} style={{ marginVertical: 10 }}>
          <AuraRing score={score} />
        </TouchableOpacity>

        {/* Status */}
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <View style={hc.statusPill}>
            <View style={hc.statusDot} />
            <Text style={hc.statusTxt}>{scoreLabel(score)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={hc.divider} />

        {/* Vibe */}
        <View style={hc.vibeRow}>
          <Text style={hc.vibeText}>{vibe.emoji}  {vibe.title}</Text>
        </View>
        <Text style={hc.say} numberOfLines={2}>{auroraSays}</Text>

        <TouchableOpacity onPress={onAskAurora} style={hc.chatRow} activeOpacity={0.8}>
          <Text style={hc.chatTxt}>Chat with Aurora</Text>
          <Text style={hc.chatArrow}> →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
const hc = StyleSheet.create({
  outer: {
    borderRadius: 28,
    padding: 1.5,
    marginBottom: 14,
  },
  inner: {
    backgroundColor: "rgba(16,18,16,0.95)",
    borderRadius: 27,
    padding: 22,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { color: MUTED, fontSize: 14, fontWeight: "500" },
  name:     { color: WHITE, fontSize: 28, fontWeight: "800", letterSpacing: -1.2, marginTop: 2 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LIME_DIM,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: LIME_BORDER,
  },
  statusDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: LIME },
  statusTxt: { color: LIME, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },

  divider: { height: 1, backgroundColor: GLASS_BORDER, marginVertical: 18 },

  vibeRow: {
    alignSelf: "flex-start",
    backgroundColor: GLASS,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginBottom: 10,
  },
  vibeText: { color: SOFT, fontSize: 12, fontWeight: "600" },
  say:      { color: SOFT, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  chatRow:  { flexDirection: "row", alignItems: "center" },
  chatTxt:  { color: WHITE, fontSize: 13, fontWeight: "700" },
  chatArrow:{ color: LIME, fontSize: 16, fontWeight: "700" },
});

// ── Bento Cell ────────────────────────────────────────────────────────────────
function BentoCell({
  lime, label, value, unit, sub, onPress,
}: {
  lime: boolean; label: string; value: string | number;
  unit?: string; sub: string; onPress?: () => void;
}) {
  if (lime) {
    return (
      <TouchableOpacity style={bent.lime} onPress={onPress} activeOpacity={0.82}>
        <Text style={bent.limeLbl}>{label}</Text>
        <Text style={bent.limeVal}>
          {value}{unit ? <Text style={bent.limeUnit}>{unit}</Text> : null}
        </Text>
        <Text style={bent.limeSub}>{sub}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={bent.dark} onPress={onPress} activeOpacity={0.82}>
      <Text style={bent.darkLbl}>{label}</Text>
      <Text style={bent.darkVal}>
        {value}{unit ? <Text style={bent.darkUnit}>{unit}</Text> : null}
      </Text>
      <Text style={bent.darkSub}>{sub}</Text>
    </TouchableOpacity>
  );
}
const bent = StyleSheet.create({
  lime: {
    flex: 1,
    backgroundColor: LIME,
    borderRadius: 24,
    padding: 18,
    minHeight: 140,
    justifyContent: "space-between",
  },
  limeLbl:  { fontSize: 10, fontWeight: "700", letterSpacing: 1, color: "rgba(0,0,0,0.50)", textTransform: "uppercase" },
  limeVal:  { fontSize: 42, fontWeight: "900", letterSpacing: -1.5, color: "#000", marginTop: 8 },
  limeUnit: { fontSize: 20, fontWeight: "700", color: "rgba(0,0,0,0.60)" },
  limeSub:  { fontSize: 11, color: "rgba(0,0,0,0.50)", fontWeight: "500" },

  dark: {
    flex: 1,
    backgroundColor: GLASS,
    borderRadius: 24,
    padding: 18,
    minHeight: 140,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  darkLbl:  { fontSize: 10, fontWeight: "700", letterSpacing: 1, color: MUTED, textTransform: "uppercase" },
  darkVal:  { fontSize: 42, fontWeight: "900", letterSpacing: -1.5, color: WHITE, marginTop: 8 },
  darkUnit: { fontSize: 20, fontWeight: "700", color: SOFT },
  darkSub:  { fontSize: 11, color: MUTED, fontWeight: "500" },
});

// ── Activity Row ──────────────────────────────────────────────────────────────
function ActivityRow({
  label, sub, done, onPress,
}: {
  label: string; sub?: string; done: boolean; onPress?: () => void;
}) {
  if (done) {
    return (
      <TouchableOpacity style={act.lime} onPress={onPress} activeOpacity={0.82}>
        <View style={act.limeIcon}>
          <Text style={{ color: "#000", fontSize: 15, fontWeight: "700" }}>+</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={act.limeName}>{label}</Text>
          {sub ? <Text style={act.limeSub}>{sub}</Text> : null}
        </View>
        <Text style={act.limeArrow}>›</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={act.dark} onPress={onPress} activeOpacity={0.82}>
      <View style={act.darkIcon}>
        <Text style={{ color: MUTED, fontSize: 15, fontWeight: "300" }}>○</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={act.darkName}>{label}</Text>
        {sub ? <Text style={act.darkSub}>{sub}</Text> : null}
      </View>
      <Text style={act.darkArrow}>›</Text>
    </TouchableOpacity>
  );
}
const act = StyleSheet.create({
  lime: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIME,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  limeIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  limeName:  { color: "#000", fontSize: 15, fontWeight: "700" },
  limeSub:   { color: "rgba(0,0,0,0.50)", fontSize: 12, marginTop: 1 },
  limeArrow: { color: "rgba(0,0,0,0.35)", fontSize: 22, fontWeight: "300" },

  dark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GLASS,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  darkIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  darkName:  { color: WHITE, fontSize: 15, fontWeight: "600" },
  darkSub:   { color: MUTED, fontSize: 12, marginTop: 1 },
  darkArrow: { color: MUTED, fontSize: 22, fontWeight: "300" },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    profile, stats, habits, vibe, auroraSays, healthScore,
    hydrationPct, todayNutrition, setMood,
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
      {/* Date */}
      <Text style={s.date}>{today}</Text>

      {/* Hero */}
      <HeroCard
        score={healthScore}
        greeting={greeting}
        name={profile.name}
        vibe={vibe}
        auroraSays={auroraSays}
        onAskAurora={() => router.push("/(tabs)/aurora")}
        onScoreTap={() => router.push("/aura-score" as any)}
      />

      {/* Bento grid */}
      <View style={s.bento}>
        <View style={s.row}>
          <BentoCell
            lime
            label="Hydration"
            value={waterPct}
            unit="%"
            sub={`${stats.waterMl} / ${profile.waterGoalMl} ml`}
            onPress={() => router.push("/(tabs)/water")}
          />
          <BentoCell
            lime={false}
            label="Sleep"
            value={stats.sleepHours ?? "—"}
            unit={stats.sleepHours !== null ? "h" : undefined}
            sub={stats.sleepHours !== null ? "last night" : "not logged"}
            onPress={() => router.push("/(tabs)/sleep" as any)}
          />
        </View>
        <View style={s.row}>
          <BentoCell
            lime={false}
            label="Streak"
            value={longestStreak}
            unit=" d"
            sub="keep going"
          />
          <BentoCell
            lime
            label="Quests"
            value={questPct}
            unit="%"
            sub={`${stats.habitsCompleted} of ${stats.habitsTotal} done`}
            onPress={() => router.push("/(tabs)/quests")}
          />
        </View>
      </View>

      {/* Mood */}
      <Text style={s.sectionLbl}>How are you feeling</Text>
      <View style={s.moodRow}>
        {MOODS.map((m) => {
          const active = stats.mood === m.key;
          return (
            <Pressable
              key={m.key}
              style={[s.moodChip, active && s.moodChipActive]}
              onPress={() => setMood(m.key)}
            >
              <Text style={[s.moodKao, active && s.moodKaoActive]}>{m.kao}</Text>
              <Text style={[s.moodLbl, active && s.moodLblActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Habits */}
      {habits.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionLbl}>Today's habits</Text>
            <View style={[s.badge, questPct === 100 && s.badgeLime]}>
              <Text style={[s.badgeTxt, questPct === 100 && s.badgeTxtLime]}>{questPct}%</Text>
            </View>
          </View>
          <View style={s.stack}>
            {habits.slice(0, 5).map((h: any) => (
              <ActivityRow
                key={h.id}
                label={h.name}
                sub={h.completedToday ? "Completed" : "Pending"}
                done={h.completedToday}
                onPress={() => router.push("/(tabs)/quests")}
              />
            ))}
          </View>
        </View>
      )}

      {/* Nutrition */}
      <View style={s.section}>
        <Text style={s.sectionLbl}>Nutrition</Text>
        <ActivityRow
          label="Meals logged"
          sub={
            todayNutrition.length === 0
              ? "Nothing logged yet"
              : `${todayNutrition.length} meal${todayNutrition.length !== 1 ? "s" : ""} today`
          }
          done={todayNutrition.length > 0}
          onPress={() => router.push("/(tabs)/nutrition" as any)}
        />
      </View>

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  date: { color: MUTED, fontSize: 12, fontWeight: "500", letterSpacing: 0.4, marginBottom: 16 },

  // Bento
  bento: { gap: 10, marginBottom: 28 },
  row:   { flexDirection: "row", gap: 10 },

  // Section
  section:    { marginBottom: 22 },
  sectionHead:{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionLbl: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 },

  badge: {
    backgroundColor: GLASS,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  badgeLime:    { backgroundColor: LIME_DIM, borderColor: LIME_BORDER },
  badgeTxt:     { color: SOFT, fontSize: 11, fontWeight: "800" },
  badgeTxtLime: { color: LIME },

  // Mood
  moodRow: { flexDirection: "row", gap: 7, marginBottom: 28 },
  moodChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    gap: 6,
  },
  moodChipActive: { backgroundColor: LIME, borderColor: LIME },
  moodKao:        { color: SOFT, fontSize: 10, textAlign: "center" },
  moodKaoActive:  { color: "#000" },
  moodLbl:        { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  moodLblActive:  { color: "#000" },

  // Stacked list
  stack: { gap: 8 },
});
