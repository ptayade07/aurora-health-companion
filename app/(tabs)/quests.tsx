import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";

// ── Palette ────────────────────────────────────────────────────────────────────
const LIME        = "#C8FF00";
const LIME_DIM    = "rgba(200,255,0,0.08)";
const LIME_BORDER = "rgba(200,255,0,0.22)";
const BG          = "#070707";
const CARD        = "#101010";
const CARD_ALT    = "#181818";
const MUTED       = "rgba(255,255,255,0.30)";
const SOFT        = "rgba(255,255,255,0.65)";
const BORDER      = "rgba(255,255,255,0.07)";

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const { habits, toggleHabit, addHabit } = useApp();
  const [newHabit, setNewHabit] = useState("");

  const done  = habits.filter((h) => h.completedToday).length;
  const total = habits.length;
  const allDone = done === total && total > 0;

  const handleAdd = () => {
    if (newHabit.trim()) {
      addHabit(newHabit.trim(), "");
      setNewHabit("");
    }
  };

  // Habits sorted: incomplete first, then completed
  const sorted = [
    ...habits.filter((h) => !h.completedToday),
    ...habits.filter((h) => h.completedToday),
  ];

  const streakHabits = [...habits]
    .filter((h) => h.streak > 0)
    .sort((a, b) => b.streak - a.streak);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <Text style={s.title}>Today's Habits</Text>
        <Text style={s.subtitle}>
          {total === 0
            ? "Add your first habit below."
            : allDone
            ? "All done. Perfect day."
            : `${done} of ${total} complete`}
        </Text>
      </MotiView>

      {/* ── Progress bar ── */}
      {total > 0 && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 300, delay: 60 }}
          style={s.progressWrap}
        >
          <View style={s.progressTrack}>
            <MotiView
              from={{ width: "0%" }}
              animate={{ width: `${Math.round((done / total) * 100)}%` }}
              transition={{ type: "timing", duration: 600, delay: 100 }}
              style={[s.progressFill, allDone && s.progressFillDone]}
            />
          </View>
          <Text style={s.progressLabel}>{Math.round((done / total) * 100)}%</Text>
        </MotiView>
      )}

      {/* ── Habit list ── */}
      {total === 0 ? (
        <View style={s.emptyCard}>
          <Ionicons name="add-circle-outline" size={32} color={MUTED} />
          <Text style={s.emptyTitle}>No habits yet</Text>
          <Text style={s.emptySub}>Add a habit below to start building your daily routine.</Text>
        </View>
      ) : (
        <View style={s.habitList}>
          {sorted.map((h, idx) => (
            <MotiView
              key={h.id}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "spring", damping: 20, delay: idx * 40 }}
            >
              <TouchableOpacity
                style={[s.habitRow, h.completedToday && s.habitRowDone]}
                onPress={() => toggleHabit(h.id)}
                activeOpacity={0.78}
              >
                {/* Left stripe */}
                <View style={[s.stripe, h.completedToday && s.stripeDone]} />

                {/* Checkbox */}
                <View style={[s.check, h.completedToday && s.checkDone]}>
                  {h.completedToday && (
                    <Ionicons name="checkmark" size={15} color="#000" />
                  )}
                </View>

                {/* Name + streak */}
                <View style={s.habitMid}>
                  <Text style={[s.habitName, h.completedToday && s.habitNameDone]}>
                    {h.name}
                  </Text>
                  {h.streak > 0 && (
                    <Text style={[s.habitStreak, h.completedToday && { color: LIME + "99" }]}>
                      {h.streak} day streak
                    </Text>
                  )}
                </View>

                {/* Arrow hint */}
                {!h.completedToday && (
                  <Text style={s.tapHint}>Tap to check</Text>
                )}
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      )}

      {/* ── Streaks ── */}
      {streakHabits.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, delay: 200 }}
          style={s.streaksCard}
        >
          <Text style={s.streaksTitle}>Streaks</Text>
          {streakHabits.map((h, i) => {
            const isTop = i === 0;
            return (
              <View key={h.id} style={s.streakRow}>
                <View style={s.streakLeft}>
                  <View style={[s.rankBadge, isTop && s.rankBadgeTop]}>
                    <Text style={[s.rankNum, isTop && s.rankNumTop]}>#{i + 1}</Text>
                  </View>
                  <Text style={s.streakName}>{h.name}</Text>
                </View>
                <View style={s.streakRight}>
                  <Text style={[s.streakCount, isTop && { color: LIME }]}>{h.streak}</Text>
                  <Text style={s.streakUnit}> days</Text>
                </View>
              </View>
            );
          })}
        </MotiView>
      )}

      {/* ── Add Habit ── */}
      <Text style={s.sectionLabel}>ADD HABIT</Text>
      <View style={s.addRow}>
        <TextInput
          style={s.input}
          placeholder="Read, Walk, Meditate…"
          placeholderTextColor={MUTED}
          value={newHabit}
          onChangeText={setNewHabit}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={s.addBtn} activeOpacity={0.85} onPress={handleAdd}>
          <Text style={s.addBtnTxt}>Add</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: BG },
  content:  { paddingHorizontal: 16, paddingBottom: 120, gap: 0 },

  title:    { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1.2, marginBottom: 6 },
  subtitle: { color: MUTED, fontSize: 13, fontWeight: "500", marginBottom: 20 },

  // Progress bar
  progressWrap:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  progressTrack:  { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" },
  progressFill:   { height: 4, backgroundColor: SOFT, borderRadius: 99 },
  progressFillDone:{ backgroundColor: LIME },
  progressLabel:  { color: MUTED, fontSize: 12, fontWeight: "700", minWidth: 36, textAlign: "right" },

  // Empty state
  emptyCard: {
    backgroundColor: CARD, borderRadius: 20, padding: 36,
    alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: BORDER, marginBottom: 24,
  },
  emptyIcon:  {},
  emptyTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emptySub:   { color: MUTED, fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Habit list
  habitList: { gap: 8, marginBottom: 28 },
  habitRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    overflow: "hidden", paddingVertical: 18, paddingRight: 16, gap: 14,
  },
  habitRowDone: { borderColor: "rgba(255,255,255,0.04)", opacity: 0.7 },

  stripe:     { width: 3, alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.05)" },
  stripeDone: { backgroundColor: LIME },

  check: {
    width: 26, height: 26, borderRadius: 8,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  checkDone: { backgroundColor: LIME, borderColor: LIME },

  habitMid:     { flex: 1, gap: 3 },
  habitName:    { color: "#fff", fontSize: 16, fontWeight: "700" },
  habitNameDone:{ color: SOFT, textDecorationLine: "line-through" },
  habitStreak:  { color: MUTED, fontSize: 11, fontWeight: "600" },
  tapHint:      { color: MUTED, fontSize: 11, fontWeight: "500" },

  // Streaks card
  streaksCard: {
    backgroundColor: CARD, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: BORDER,
    marginBottom: 28, gap: 0,
  },
  streaksTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 18 },

  streakRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  streakLeft:   { flexDirection: "row", alignItems: "center", gap: 12 },
  rankBadge:    { width: 28, height: 28, borderRadius: 8, backgroundColor: CARD_ALT, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER },
  rankBadgeTop: { backgroundColor: LIME_DIM, borderColor: LIME_BORDER },
  rankNum:      { color: MUTED, fontSize: 11, fontWeight: "800" },
  rankNumTop:   { color: LIME },
  streakName:   { color: "#fff", fontSize: 14, fontWeight: "600" },

  streakRight:  { flexDirection: "row", alignItems: "baseline" },
  streakCount:  { color: SOFT, fontSize: 22, fontWeight: "900", letterSpacing: -0.8 },
  streakUnit:   { color: MUTED, fontSize: 12, fontWeight: "600" },

  // Section label
  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: "700",
    letterSpacing: 1.6, marginBottom: 10,
  },

  // Add habit
  addRow:  { flexDirection: "row", gap: 10 },
  input: {
    flex: 1, backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 15,
    color: "#fff", fontSize: 15,
  },
  addBtn:    { backgroundColor: LIME, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 15, justifyContent: "center" },
  addBtnTxt: { color: "#000", fontWeight: "800", fontSize: 14 },
});
