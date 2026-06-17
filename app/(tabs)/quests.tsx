import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";

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

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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

// ── Radial ring ────────────────────────────────────────────────────────────────
function ProgressRing({ pct, size, stroke, color }: {
  pct: number; size: number; stroke: number; color: string;
}) {
  const half      = size / 2;
  const innerSize = size - stroke * 2;
  const angle     = (Math.min(pct, 100) / 100) * 360;
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: "-90deg" }] }}>
      <View style={{ position: "absolute", width: size, height: size, borderRadius: half, borderWidth: stroke, borderColor: "rgba(255,255,255,0.06)" }} />
      <View style={{ position: "absolute", left: half, width: half, height: size, overflow: "hidden" }}>
        <View style={{ position: "absolute", left: -half, width: size, height: size, borderRadius: half, backgroundColor: color, transform: [{ rotate: `${Math.min(angle, 180) - 180}deg` }] }} />
      </View>
      {pct > 50 && (
        <View style={{ position: "absolute", left: 0, width: half, height: size, overflow: "hidden" }}>
          <View style={{ position: "absolute", left: 0, width: size, height: size, borderRadius: half, backgroundColor: color, transform: [{ rotate: `${Math.min(angle - 180, 180) - 180}deg` }] }} />
        </View>
      )}
      <View style={{ position: "absolute", top: stroke, left: stroke, width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: CARD }} />
    </View>
  );
}

// ── Abbr box ───────────────────────────────────────────────────────────────────
function AbbrBox({ name, done }: { name: string; done: boolean }) {
  return (
    <View style={[ab.box, done && ab.done]}>
      <Text style={[ab.txt, done && ab.txtDone]}>{name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}
const ab = StyleSheet.create({
  box:    { width: 44, height: 44, borderRadius: 8, backgroundColor: CARD_ALT, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER },
  done:   { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" },
  txt:    { color: MUTED, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  txtDone:{ color: "#fff" },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { habits, toggleHabit, addHabit, hydrationPct, stats } = useApp();
  const [newHabit, setNewHabit] = useState("");

  const done          = habits.filter((h) => h.completedToday).length;
  const total         = habits.length;
  const allDone       = done === total && total > 0;
  const pct           = total > 0 ? Math.round((done / total) * 100) : 0;
  const waterPct      = Math.min(Math.round(hydrationPct), 100);
  const sleepPct      = stats.sleepHours ? Math.min((stats.sleepHours / 9) * 100, 100) : 0;
  const longestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const avgStreak     = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.streak, 0) / habits.length)
    : 0;

  // Streak leaders — top 3 habits by streak
  const leaders = [...habits].sort((a, b) => b.streak - a.streak).filter((h) => h.streak > 0).slice(0, 3);

  // Weekly rhythm — estimated completions per day of the week
  const dow = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun
  const weekData = DAY_LABELS.map((label, i) => {
    const daysAgo = dow - i;
    const future  = daysAgo < 0;
    const count   = future ? 0 : habits.filter((h) =>
      daysAgo === 0 ? h.completedToday : h.streak >= daysAgo
    ).length;
    return { label, count, future, isToday: daysAgo === 0 };
  });
  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  const handleAdd = () => {
    if (newHabit.trim()) {
      addHabit(newHabit.trim(), "");
      setNewHabit("");
    }
  };

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <Text style={s.title}>Habits</Text>
      <Text style={s.subtitle}>
        {total === 0
          ? "Build your routine, one habit at a time."
          : allDone
          ? "Perfect day. Every habit checked off."
          : `${done} of ${total} done today`}
      </Text>

      {/* ── Today hero card ── */}
      <View style={s.heroCard}>
        <LinearGradient
          colors={pct >= 80
            ? ["rgba(200,255,0,0.07)", "rgba(200,255,0,0.01)"]
            : ["rgba(255,255,255,0.03)", "transparent"]}
          style={StyleSheet.absoluteFill}
          borderRadius={22}
        />

        {/* Top row: title + date pill */}
        <View style={s.heroTopRow}>
          <Text style={s.heroLabel}>TODAY</Text>
          {allDone && (
            <View style={s.perfectBadge}>
              <Text style={s.perfectTxt}>PERFECT DAY</Text>
            </View>
          )}
        </View>

        {/* Main content: rings LEFT, completion RIGHT */}
        <View style={s.heroBody}>
          {/* Nested rings */}
          <View style={s.ringsWrap}>
            <View style={{ position: "absolute" }}>
              <ProgressRing pct={pct}      size={140} stroke={11} color={LIME} />
            </View>
            <View style={{ position: "absolute" }}>
              <ProgressRing pct={waterPct} size={106} stroke={10} color={BLUE + "B0"} />
            </View>
            <View style={{ position: "absolute" }}>
              <ProgressRing pct={sleepPct} size={72}  stroke={10} color={LIME + "55"} />
            </View>
            <View style={s.ringCenter}>
              <Text style={s.ringCenterNum}>{done}/{total}</Text>
              <Text style={s.ringCenterLbl}>done</Text>
            </View>
          </View>

          {/* Right side stats */}
          <View style={s.heroRight}>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{pct}%</Text>
              <Text style={s.heroStatLbl}>complete</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{longestStreak}</Text>
              <Text style={s.heroStatLbl}>best streak</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{avgStreak}</Text>
              <Text style={s.heroStatLbl}>avg streak</Text>
            </View>
          </View>
        </View>

        {/* Ring legend */}
        <View style={s.legendRow}>
          {[
            { color: LIME,       label: "Habits" },
            { color: BLUE+"B0",  label: "Water"  },
            { color: LIME+"55",  label: "Sleep"  },
          ].map((l) => (
            <View key={l.label} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: l.color }]} />
              <Text style={s.legendTxt}>{l.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Weekly rhythm ── */}
      {total > 0 && (
        <>
          <Divider label="WEEKLY RHYTHM" />
          <View style={s.weekCard}>
            <View style={s.weekBars}>
              {weekData.map((d, i) => {
                const barPct = d.future || d.count === 0 ? 0 : (d.count / maxCount);
                const baseColor = d.isToday
                  ? LIME
                  : d.count === total && total > 0
                  ? LIME
                  : AMBER;
                const barColors: [string, string] = d.isToday
                  ? [LIME, LIME + "AA"]
                  : [baseColor + "BB", baseColor + "33"];

                return (
                  <View key={i} style={s.weekBarCol}>
                    {/* Count label */}
                    {!d.future && d.count > 0 && (
                      <Text style={[s.weekBarCount, d.isToday && { color: LIME }]}>
                        {d.count}
                      </Text>
                    )}
                    {d.future && <Text style={s.weekBarCount}> </Text>}
                    {!d.future && d.count === 0 && <Text style={s.weekBarCount}>—</Text>}

                    {/* Bar */}
                    <View style={s.weekBarTrack}>
                      {barPct > 0 && (
                        <LinearGradient
                          colors={barColors}
                          style={[s.weekBarFill, { height: `${Math.max(barPct * 100, 8)}%` }]}
                        />
                      )}
                    </View>

                    {/* Day label */}
                    <Text style={[s.weekBarDay, d.isToday && { color: LIME, fontWeight: "800" }]}>
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Footer: total habits reference */}
            <View style={s.weekFooter}>
              <View style={[s.weekFooterDot, { backgroundColor: LIME }]} />
              <Text style={s.weekFooterTxt}>
                Max {total} habit{total !== 1 ? "s" : ""} per day
              </Text>
            </View>
          </View>
        </>
      )}

      {/* ── Streak leaders ── */}
      {leaders.length > 0 && (
        <>
          <Divider label="STREAK LEADERS" />
          <View style={s.leadersRow}>
            {leaders.map((h, i) => {
              const rankColors = [LIME, AMBER, BLUE];
              const rc = rankColors[i] ?? SOFT;
              return (
                <View key={h.id} style={s.leaderCard}>
                  <View style={[s.leaderStripe, { backgroundColor: rc }]} />
                  <View style={s.leaderBody}>
                    <Text style={[s.leaderRank, { color: rc }]}>#{i + 1}</Text>
                    <Text style={s.leaderName} numberOfLines={2}>{h.name}</Text>
                    <View style={s.leaderStreakRow}>
                      <Text style={[s.leaderStreakNum, { color: rc }]}>{h.streak}</Text>
                      <Text style={s.leaderStreakUnit}> days</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* ── Habit list ── */}
      {total > 0 && (
        <>
          <Text style={s.sectionLabel}>YOUR HABITS</Text>
          <View style={s.habitList}>
            {habits.map((h) => (
              <Pressable
                key={h.id}
                style={({ pressed }) => [s.habitRow, pressed && { opacity: 0.76 }]}
                onPress={() => router.push({ pathname: "/habit-detail", params: { id: h.id, name: h.name } } as any)}
              >
                <View style={[s.habitStripe, { backgroundColor: h.completedToday ? LIME : "rgba(255,255,255,0.05)" }]} />
                <AbbrBox name={h.name} done={h.completedToday} />
                <View style={s.habitMid}>
                  <Text style={[s.habitName, h.completedToday && s.habitDone]}>{h.name}</Text>
                  <View style={s.habitMeta}>
                    {h.streak > 0 ? (
                      <Text style={[s.habitStreak, h.completedToday && { color: LIME + "99" }]}>
                        {h.streak} day streak
                      </Text>
                    ) : (
                      <Text style={s.habitStreak}>Tap to log and start your streak</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.toggle, h.completedToday && s.toggleDone]}
                  onPress={(e) => { e.stopPropagation(); toggleHabit(h.id); }}
                  hitSlop={8}
                >
                  {h.completedToday
                    ? <Ionicons name="checkmark" size={15} color="#000" />
                    : <View style={s.toggleEmpty} />}
                </TouchableOpacity>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* ── Empty state ── */}
      {total === 0 && (
        <View style={s.emptyCard}>
          <View style={s.emptyDots}>
            {[LIME, AMBER, BLUE, "rgba(167,139,250,0.9)"].map((c) => (
              <View key={c} style={[s.emptyDot, { backgroundColor: c }]} />
            ))}
          </View>
          <Text style={s.emptyTitle}>No habits yet</Text>
          <Text style={s.emptySub}>Add a habit below to start building your daily routine.</Text>
        </View>
      )}

      {/* ── Add habit ── */}
      <Text style={s.sectionLabel}>ADD HABIT</Text>
      <View style={s.addCard}>
        <TextInput
          style={s.input}
          placeholder="e.g. Meditate, Walk 30 min, Read…"
          placeholderTextColor={MUTED}
          value={newHabit}
          onChangeText={setNewHabit}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={s.addBtn} activeOpacity={0.85} onPress={handleAdd}>
          <Text style={s.addBtnTxt}>Add Habit</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: BG },
  content:  { paddingHorizontal: 16, paddingBottom: 120 },

  title:    { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1.2, marginBottom: 6 },
  subtitle: { color: MUTED, fontSize: 13, marginBottom: 24 },

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 22,
    borderWidth: 1, borderColor: BORDER, overflow: "hidden", gap: 20,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroLabel:  { color: MUTED, fontSize: 11, fontWeight: "700", letterSpacing: 1.8 },
  perfectBadge: {
    backgroundColor: LIME, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  perfectTxt: { color: "#000", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },

  heroBody:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ringsWrap:  { width: 140, height: 140, alignItems: "center", justifyContent: "center" },
  ringCenter: { alignItems: "center", justifyContent: "center" },
  ringCenterNum: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.8, lineHeight: 24 },
  ringCenterLbl: { color: MUTED, fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },

  heroRight:   { flex: 1, paddingLeft: 20, gap: 14 },
  heroStat:    { gap: 2 },
  heroStatNum: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: -1.2, lineHeight: 34 },
  heroStatLbl: { color: MUTED, fontSize: 10, fontWeight: "600" },
  heroDivider: { height: 1, backgroundColor: BORDER },

  legendRow: {
    flexDirection: "row", gap: 14,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: BORDER,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { color: MUTED, fontSize: 11, fontWeight: "600" },

  // ── Weekly rhythm ──────────────────────────────────────────────────────────
  weekCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: BORDER, gap: 14,
  },
  weekBars:    { flexDirection: "row", alignItems: "flex-end", height: 110, gap: 6 },
  weekBarCol:  { flex: 1, alignItems: "center", gap: 5 },
  weekBarCount:{ color: MUTED, fontSize: 10, fontWeight: "700", height: 14, textAlign: "center" },
  weekBarTrack:{ flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center", borderRadius: 6, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)" },
  weekBarFill: { width: "100%", borderRadius: 6 },
  weekBarDay:  { color: MUTED, fontSize: 10, fontWeight: "600" },

  weekFooter:    { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: BORDER },
  weekFooterDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: MUTED },
  weekFooterTxt: { color: MUTED, fontSize: 11, fontWeight: "600" },

  // ── Streak leaders ─────────────────────────────────────────────────────────
  leadersRow: { flexDirection: "row", gap: 8 },
  leaderCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER, overflow: "hidden",
  },
  // (first card border override removed — rank stripe alone signals #1)
  leaderStripe: { height: 3, width: "100%" },
  leaderBody:   { padding: 14, gap: 6 },
  leaderRank:   { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  leaderName: {
    color: "#fff", fontSize: 13, fontWeight: "700",
    lineHeight: 17, minHeight: 34,
  },
  leaderStreakRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  leaderStreakNum: { fontSize: 28, fontWeight: "900", letterSpacing: -1, lineHeight: 30 },
  leaderStreakUnit:{ color: MUTED, fontSize: 12, fontWeight: "600" },

  // ── Habit list ─────────────────────────────────────────────────────────────
  habitList: { gap: 8 },
  habitRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    overflow: "hidden", paddingVertical: 18, paddingRight: 18, gap: 14,
  },
  habitStripe: { width: 3, alignSelf: "stretch" },
  habitMid:    { flex: 1, gap: 5 },
  habitName:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  habitDone:   { color: SOFT, textDecorationLine: "line-through" },
  habitMeta:   { flexDirection: "row", alignItems: "center", gap: 8 },
  habitStreak: { color: MUTED, fontSize: 11, fontWeight: "600" },

  toggle: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  toggleDone:  { backgroundColor: LIME, borderColor: LIME },
  toggleEmpty: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)" },

  // ── Section label (replaces heavy Divider for habit/add sections) ──────────
  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: "700",
    letterSpacing: 1.6, marginTop: 24, marginBottom: 12,
  },

  // ── Empty + Add ────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 36,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: BORDER,
  },
  emptyDots:  { flexDirection: "row", gap: 10 },
  emptyDot:   { width: 10, height: 10, borderRadius: 99 },
  emptyTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emptySub:   { color: MUTED, fontSize: 13, textAlign: "center", lineHeight: 20 },

  addCard: {
    backgroundColor: BG, borderRadius: 14, padding: 0,
    gap: 10,
  },
  input: {
    backgroundColor: CARD_ALT, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 15,
    color: "#fff", fontSize: 15,
  },
  addBtn: {
    borderRadius: 10, paddingVertical: 15, alignItems: "center",
    backgroundColor: CARD_ALT, borderWidth: 1, borderColor: BORDER,
  },
  addBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 0.4 },
});
