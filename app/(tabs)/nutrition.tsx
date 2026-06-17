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
import type { NutritionEntry } from "../../lib/types";

// ── Palette — matches home page ───────────────────────────────────────────────
const LIME        = "#C8FF00";
const LIME_BORDER = "rgba(200,255,0,0.18)";
const BG          = "#070707";
const CARD        = "#101010";
const CARD_ALT    = "#181818";
const MUTED       = "rgba(255,255,255,0.30)";
const SOFT        = "rgba(255,255,255,0.65)";
const BORDER      = "rgba(255,255,255,0.07)";
const AMBER       = "#FBBF24";
const BLUE        = "#60C8FF";

// ── Meal type config ──────────────────────────────────────────────────────────
const MEAL_TYPES: {
  type: NutritionEntry["mealType"];
  abbr: string;
  label: string;
  time: string;
  color: string;
}[] = [
  { type: "breakfast", abbr: "AM", label: "Breakfast", time: "Morning",  color: AMBER },
  { type: "lunch",     abbr: "PM", label: "Lunch",     time: "Midday",   color: BLUE  },
  { type: "dinner",    abbr: "DN", label: "Dinner",    time: "Evening",  color: LIME  },
  { type: "snack",     abbr: "SN", label: "Snack",     time: "Anytime",  color: "#A78BFA" },
];

// ── Section divider ───────────────────────────────────────────────────────────
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
  row:  { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: BORDER },
  text: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { todayNutrition, addNutrition, removeNutrition } = useApp();
  const [selected, setSelected] = useState<NutritionEntry["mealType"]>("breakfast");
  const [desc, setDesc]         = useState("");

  const handleAdd = () => {
    addNutrition(selected, desc.trim());
    setDesc("");
  };

  const byType = (t: NutritionEntry["mealType"]) =>
    todayNutrition.filter((n) => n.mealType === t);

  const selectedMeta = MEAL_TYPES.find((m) => m.type === selected)!;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* ── Header ── */}
      <Text style={s.title}>Nutrition</Text>
      <Text style={s.subtitle}>
        {todayNutrition.length === 0
          ? "Log what you eat to build awareness."
          : `${todayNutrition.length} item${todayNutrition.length !== 1 ? "s" : ""} logged today`}
      </Text>

      {/* ── Meal summary strip — 4 cards ── */}
      <View style={s.summaryRow}>
        {MEAL_TYPES.map(({ type, abbr, label, color }) => {
          const count  = byType(type).length;
          const logged = count > 0;
          return (
            <View key={type} style={[s.summaryCard, logged && { borderColor: color + "44" }]}>
              <View style={[s.summaryStripe, { backgroundColor: color, opacity: logged ? 0.75 : 0.2 }]} />
              <View style={s.summaryBody}>
                <Text style={[s.summaryAbbr, logged && { color }]}>{abbr}</Text>
                <Text style={s.summaryLabel}>{label}</Text>
                {logged && (
                  <View style={[s.countBadge, { backgroundColor: color + "22", borderColor: color + "44" }]}>
                    <Text style={[s.countBadgeTxt, { color }]}>{count}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Log a meal ── */}
      <Divider label="LOG A MEAL" />

      {/* Type selector — 2×2 grid */}
      <View style={s.typeGrid}>
        {MEAL_TYPES.map(({ type, abbr, label, time, color }) => {
          const active = selected === type;
          return (
            <Pressable
              key={type}
              style={[s.typeBtn, active && { borderColor: color + "55", backgroundColor: color + "12" }]}
              onPress={() => setSelected(type)}
            >
              <View style={[s.typeAbbrBox, { backgroundColor: color + (active ? "22" : "11") }]}>
                <Text style={[s.typeAbbrTxt, { color: active ? color : MUTED }]}>{abbr}</Text>
              </View>
              <View>
                <Text style={[s.typeName, active && { color: "#fff" }]}>{label}</Text>
                <Text style={s.typeTime}>{time}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Description input */}
      <TextInput
        style={s.input}
        placeholder={`What did you have for ${selectedMeta.label.toLowerCase()}?`}
        placeholderTextColor={MUTED}
        value={desc}
        onChangeText={setDesc}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
      />

      {/* Add button */}
      <TouchableOpacity activeOpacity={0.85} onPress={handleAdd}>
        <LinearGradient
          colors={[LIME, "#A0D000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.addBtn}
        >
          <Text style={s.addBtnTxt}>Log {selectedMeta.label}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Today's entries by meal type ── */}
      {MEAL_TYPES.map(({ type, label, color }) => {
        const entries = byType(type);
        if (!entries.length) return null;
        return (
          <View key={type} style={s.mealGroup}>
            <View style={s.mealGroupHeader}>
              <View style={[s.mealGroupDot, { backgroundColor: color }]} />
              <Text style={s.mealGroupTitle}>{label}</Text>
              <Text style={s.mealGroupCount}>{entries.length}</Text>
            </View>
            {entries.map((e) => (
              <View key={e.id} style={s.entryRow}>
                <Text style={s.entryDesc}>{e.description || "Logged"}</Text>
                <TouchableOpacity
                  onPress={() => removeNutrition(e.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={s.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}

      {/* ── Diet analysis CTA ── */}
      {todayNutrition.length > 0 && (
        <>
          <Divider label="DIET ANALYSIS" />
          <TouchableOpacity
            style={s.analysisNavBtn}
            onPress={() => router.push("/diet-analysis")}
            activeOpacity={0.82}
          >
            <View style={s.analysisNavLeft}>
              <Text style={s.analysisNavTitle}>View Full Analysis</Text>
              <Text style={s.analysisNavSub}>
                Macros, ratings, calendar history, and AI suggestions
              </Text>
            </View>
            <View style={s.analysisNavArrow}>
              <Ionicons name="chevron-forward" size={20} color={LIME} />
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* ── Empty state ── */}
      {todayNutrition.length === 0 && (
        <View style={s.emptyCard}>
          <View style={s.emptyDots}>
            {[AMBER, BLUE, LIME, "#A78BFA"].map((c) => (
              <View key={c} style={[s.emptyDot, { backgroundColor: c }]} />
            ))}
          </View>
          <Text style={s.emptyTitle}>Nothing logged yet</Text>
          <Text style={s.emptyText}>Focus on awareness, not perfection.</Text>
        </View>
      )}

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  title:    { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1.2, marginBottom: 6 },
  subtitle: { color: MUTED, fontSize: 13, marginBottom: 24 },

  // Summary row
  summaryRow:   { flexDirection: "row", gap: 8 },
  summaryCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, overflow: "hidden", minHeight: 82,
  },
  summaryStripe: { height: 3, width: "100%" },
  summaryBody:   { padding: 10, alignItems: "center", gap: 4 },
  summaryAbbr:   { color: MUTED, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  summaryLabel:  { color: MUTED, fontSize: 9,  fontWeight: "600", textAlign: "center" },
  countBadge:  {
    borderRadius: 999, minWidth: 20, height: 20,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
    borderWidth: 1, marginTop: 2,
  },
  countBadgeTxt: { fontSize: 10, fontWeight: "800" },

  // Type grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeBtn: {
    width: "48%", flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  typeAbbrBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  typeAbbrTxt: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  typeName:    { color: SOFT, fontSize: 13, fontWeight: "700" },
  typeTime:    { color: MUTED, fontSize: 10, marginTop: 1 },

  // Input + add
  input: {
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14,
    color: "#fff", fontSize: 15, marginBottom: 10,
  },
  addBtn:    { borderRadius: 999, paddingVertical: 16, alignItems: "center", marginBottom: 24 },
  addBtnTxt: { color: "#000", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },

  // Meal groups
  mealGroup:       { marginBottom: 18 },
  mealGroupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  mealGroupDot:    { width: 6, height: 6, borderRadius: 99 },
  mealGroupTitle:  { color: SOFT, fontSize: 13, fontWeight: "700", flex: 1 },
  mealGroupCount: {
    color: MUTED, fontSize: 11, fontWeight: "600",
    backgroundColor: CARD_ALT, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: BORDER,
  },
  entryRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD, borderRadius: 12, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: BORDER,
  },
  entryDesc: { flex: 1, color: "#fff", fontSize: 13 },
  removeBtn: { color: MUTED, fontSize: 14, paddingLeft: 12 },

  // Diet analysis nav button
  analysisNavBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: CARD, borderRadius: 10, padding: 18,
    borderWidth: 1, borderColor: LIME_BORDER, gap: 12,
  },
  analysisNavLeft:  { flex: 1, gap: 4 },
  analysisNavTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  analysisNavSub:   { color: MUTED, fontSize: 12, lineHeight: 18 },
  analysisNavArrow: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(200,255,0,0.08)",
    borderWidth: 1, borderColor: LIME_BORDER,
    alignItems: "center", justifyContent: "center",
  },

  // Empty state
  emptyCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 32,
    alignItems: "center", marginTop: 12, gap: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  emptyDots:  { flexDirection: "row", gap: 8 },
  emptyDot:   { width: 10, height: 10, borderRadius: 99 },
  emptyTitle: { color: "#fff", fontWeight: "700", fontSize: 17 },
  emptyText:  { color: MUTED, textAlign: "center", lineHeight: 20, fontSize: 13 },
});
