import { useState, useMemo } from "react";
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

// ── Palette ────────────────────────────────────────────────────────────────────
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
const PURPLE      = "#A78BFA";

// ── Meal type config ──────────────────────────────────────────────────────────
const MEAL_TYPES: {
  type: NutritionEntry["mealType"];
  abbr: string;
  label: string;
  time: string;
  color: string;
}[] = [
  { type: "breakfast", abbr: "AM", label: "Breakfast", time: "Morning",  color: AMBER  },
  { type: "lunch",     abbr: "PM", label: "Lunch",     time: "Midday",   color: BLUE   },
  { type: "dinner",    abbr: "DN", label: "Dinner",    time: "Evening",  color: LIME   },
  { type: "snack",     abbr: "SN", label: "Snack",     time: "Anytime",  color: PURPLE },
];

const MEAL_COLOR: Record<NutritionEntry["mealType"], string> = {
  breakfast: AMBER, lunch: BLUE, dinner: LIME, snack: PURPLE,
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
  row:  { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: BORDER },
  text: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
});

// ── Monthly Calendar ──────────────────────────────────────────────────────────
function MonthCalendar({ nutritionLogs }: { nutritionLogs: NutritionEntry[] }) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const datesWithLogs = useMemo(() => {
    const set = new Set<string>();
    nutritionLogs.forEach((n) => set.add(n.date));
    return set;
  }, [nutritionLogs]);

  const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr  = new Date().toISOString().split("T")[0];

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const DOW = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <View style={cal.card}>
      {/* Nav */}
      <View style={cal.nav}>
        <TouchableOpacity onPress={prevMonth} hitSlop={12}>
          <Ionicons name="chevron-back" size={18} color={SOFT} />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={12}>
          <Ionicons name="chevron-forward" size={18} color={SOFT} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={cal.dowRow}>
        {DOW.map((d, i) => (
          <Text key={i} style={cal.dowLabel}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={cal.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e-${i}`} style={cal.cell} />;

          const mm  = String(month + 1).padStart(2, "0");
          const dd  = String(day).padStart(2, "0");
          const str = `${year}-${mm}-${dd}`;
          const has = datesWithLogs.has(str);
          const isToday = str === todayStr;

          return (
            <View
              key={str}
              style={[
                cal.cell,
                isToday && cal.cellToday,
              ]}
            >
              <Text style={[
                cal.dayNum,
                isToday && cal.dayNumToday,
                has && !isToday && cal.dayNumLogged,
              ]}>
                {day}
              </Text>
              {has && <View style={[cal.dot, isToday && cal.dotToday]} />}
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={cal.legend}>
        <View style={cal.legendItem}>
          <View style={[cal.dot, { position: "relative", top: 0 }]} />
          <Text style={cal.legendTxt}>Meal logged</Text>
        </View>
        <View style={cal.legendItem}>
          <View style={cal.legendToday} />
          <Text style={cal.legendTxt}>Today</Text>
        </View>
      </View>
    </View>
  );
}
const cal = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: BORDER, marginBottom: 4,
  },
  nav: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
  },
  monthLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },

  dowRow: { flexDirection: "row", marginBottom: 6 },
  dowLabel: { flex: 1, textAlign: "center", color: MUTED, fontSize: 10, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: "center", justifyContent: "center", gap: 2,
  },
  cellToday: {
    backgroundColor: "rgba(200,255,0,0.12)",
    borderRadius: 8,
  },
  dayNum:        { color: MUTED, fontSize: 12, fontWeight: "500" },
  dayNumLogged:  { color: "#fff", fontWeight: "700" },
  dayNumToday:   { color: LIME,  fontWeight: "800" },

  dot:       { width: 4, height: 4, borderRadius: 99, backgroundColor: LIME },
  dotToday:  { backgroundColor: LIME },

  legend:     { flexDirection: "row", gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendTxt:  { color: MUTED, fontSize: 11, fontWeight: "500" },
  legendToday:{ width: 12, height: 12, borderRadius: 3, backgroundColor: "rgba(200,255,0,0.12)", borderWidth: 1, borderColor: "rgba(200,255,0,0.30)" },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { todayNutrition, nutritionLogs, addNutrition, removeNutrition } = useApp();
  const [selected, setSelected] = useState<NutritionEntry["mealType"]>("breakfast");
  const [desc, setDesc]         = useState("");

  const handleAdd = () => {
    if (!desc.trim()) return;
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

      {/* ── Meal summary strip ── */}
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

      {/* ── Monthly Calendar ── */}
      <Divider label="MONTHLY CALENDAR" />
      <MonthCalendar nutritionLogs={nutritionLogs} />

      {/* ── Log a meal ── */}
      <Divider label="LOG A MEAL" />

      {/* Type selector */}
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

      {/* Log button */}
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

      {/* ── Today's entries by meal ── */}
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

      {/* ── Analyze Diet CTA ── */}
      {todayNutrition.length > 0 && (
        <>
          <Divider label="AI ANALYSIS" />
          <TouchableOpacity
            style={s.analysisBtn}
            onPress={() => router.push("/diet-analysis")}
            activeOpacity={0.82}
          >
            <View style={s.analysisBtnLeft}>
              <Text style={s.analysisBtnTitle}>Analyze Diet</Text>
              <Text style={s.analysisBtnSub}>
                AI breakdown of your meals — macros, ratings & suggestions
              </Text>
            </View>
            <View style={s.analysisBtnArrow}>
              <Ionicons name="sparkles" size={18} color={LIME} />
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* ── Empty state ── */}
      {todayNutrition.length === 0 && (
        <View style={s.emptyCard}>
          <View style={s.emptyDots}>
            {[AMBER, BLUE, LIME, PURPLE].map((c) => (
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
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, overflow: "hidden", minHeight: 82,
  },
  summaryStripe: { height: 3, width: "100%" },
  summaryBody:   { padding: 10, alignItems: "center", gap: 4 },
  summaryAbbr:   { color: MUTED, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  summaryLabel:  { color: MUTED, fontSize: 9,  fontWeight: "600", textAlign: "center" },
  countBadge: {
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

  // Analyze Diet button
  analysisBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: CARD, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "rgba(200,255,0,0.22)", gap: 12,
  },
  analysisBtnLeft:  { flex: 1, gap: 4 },
  analysisBtnTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  analysisBtnSub:   { color: MUTED, fontSize: 12, lineHeight: 18 },
  analysisBtnArrow: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(200,255,0,0.08)",
    borderWidth: 1, borderColor: "rgba(200,255,0,0.22)",
    alignItems: "center", justifyContent: "center",
  },

  // Empty state
  emptyCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 32,
    alignItems: "center", marginTop: 12, gap: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  emptyDots:  { flexDirection: "row", gap: 8 },
  emptyDot:   { width: 10, height: 10, borderRadius: 99 },
  emptyTitle: { color: "#fff", fontWeight: "700", fontSize: 17 },
  emptyText:  { color: MUTED, textAlign: "center", lineHeight: 20, fontSize: 13 },
});
