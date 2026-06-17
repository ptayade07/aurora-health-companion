import { useState, useMemo, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { analyzeNutrition, type NutritionAnalysis } from "../lib/groq";
import type { NutritionEntry } from "../lib/types";

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

const MEAL_COLORS: Record<NutritionEntry["mealType"], string> = {
  breakfast: AMBER,
  lunch:     BLUE,
  dinner:    LIME,
  snack:     PURPLE,
};

const MACROS = [
  { key: "calories" as const, label: "Calories", unit: "kcal", max: 2200, color: AMBER },
  { key: "protein"  as const, label: "Protein",  unit: "g",    max: 150,  color: LIME  },
  { key: "carbs"    as const, label: "Carbs",    unit: "g",    max: 280,  color: BLUE  },
  { key: "fat"      as const, label: "Fat",      unit: "g",    max: 80,   color: PURPLE },
];

const RATING_COLOR: Record<NutritionAnalysis["rating"], string> = {
  Excellent: LIME,
  Good:      LIME,
  Fair:      AMBER,
  Poor:      "#F87171",
};

const WEEKDAYS    = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

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

const CAL_CELL = 44;

export default function DietAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { nutritionLogs } = useApp();

  const todayDate = new Date();
  const todayStr  = toDateStr(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

  const [calExpanded,  setCalExpanded]  = useState(false);
  const [calYear,      setCalYear]      = useState(todayDate.getFullYear());
  const [calMonth,     setCalMonth]     = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [analysisCache, setAnalysisCache] = useState<Record<string, NutritionAnalysis>>({});
  const [analyzing,     setAnalyzing]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const autoRanRef = useRef(false);

  // ── Entry map ─────────────────────────────────────────────────────────────
  const entryMap = useMemo(() => {
    const map: Record<string, NutritionEntry[]> = {};
    nutritionLogs.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [nutritionLogs]);

  // Auto-analyse today on first load if entries exist
  useEffect(() => {
    if (autoRanRef.current) return;
    const entries = entryMap[todayStr];
    if (entries?.length && !analysisCache[todayStr]) {
      autoRanRef.current = true;
      runAnalysis(todayStr, entries);
    }
  }, [entryMap]);

  // ── Calendar cells ────────────────────────────────────────────────────────
  const calCells = useMemo(() => {
    const firstDow    = new Date(calYear, calMonth, 1).getDay();
    const offset      = (firstDow + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };
  const toggleCal = () => {
    setCalExpanded((v) => !v);
  };
  const selectDay = (day: number) => {
    setSelectedDate(toDateStr(calYear, calMonth, day));
    setError(null);
  };

  const runAnalysis = async (date: string, entries: NutritionEntry[]) => {
    if (!entries.length) return;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeNutrition(
        entries.map((e) => ({ mealType: e.mealType, description: e.description }))
      );
      setAnalysisCache((prev) => ({ ...prev, [date]: result }));
    } catch {
      setError("Couldn't reach Aurora. Check your connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyse = () => runAnalysis(selectedDate, selectedEntries);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedEntries  = entryMap[selectedDate] ?? [];
  const selectedAnalysis = analysisCache[selectedDate];
  const isToday          = selectedDate === todayStr;

  const [selY, selM, selD] = selectedDate.split("-").map(Number);
  const selLabel = new Date(selY, selM - 1, selD).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  const uniqueDays = Object.keys(entryMap).length;

  const goToAurora = () => {
    const mealSummary = selectedEntries.length
      ? selectedEntries.map((e) => `${e.mealType}: ${e.description || "logged"}`).join(", ")
      : "my recent meals";
    const prompt =
      `Based on what I've been eating (${mealSummary}), can you suggest a better meal plan ` +
      `for the week? I want to know about protein intake, what to add, what to cut, ` +
      `and some easy meal prep ideas.`;
    router.push({ pathname: "/(tabs)/aurora", params: { initialPrompt: prompt } } as any);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.70)" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Diet Analysis</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* ── Calendar toggle ── */}
      <TouchableOpacity style={s.calToggle} onPress={toggleCal} activeOpacity={0.82}>
        <View style={s.calToggleLeft}>
          <View style={s.calToggleIconBox}>
            <Ionicons name="calendar-outline" size={16} color={LIME} />
          </View>
          <View>
            <Text style={s.calToggleTitle}>Food Calendar</Text>
            <Text style={s.calToggleSub}>
              {nutritionLogs.length} entr{nutritionLogs.length !== 1 ? "ies" : "y"} across {uniqueDays} day{uniqueDays !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <View style={s.calChevron}>
          <Ionicons name={calExpanded ? "chevron-up" : "chevron-down"} size={16} color={MUTED} />
        </View>
      </TouchableOpacity>

      {/* ── Expanded calendar + entries ── */}
      {calExpanded && (
        <View style={s.calCard}>
          {/* Month nav */}
          <View style={s.calHeader}>
            <TouchableOpacity onPress={prevMonth} hitSlop={12} style={s.calNavBtn}>
              <Ionicons name="chevron-back" size={16} color={SOFT} />
            </TouchableOpacity>
            <Text style={s.calMonthLabel}>{MONTH_NAMES[calMonth]} {calYear}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={12} style={s.calNavBtn}>
              <Ionicons name="chevron-forward" size={16} color={SOFT} />
            </TouchableOpacity>
          </View>

          {/* Weekday row */}
          <View style={s.calWeekRow}>
            {WEEKDAYS.map((d, i) => <Text key={i} style={s.calWeekDay}>{d}</Text>)}
          </View>

          {/* Day grid */}
          <View style={s.calGrid}>
            {calCells.map((day, idx) => {
              if (day === null) return <View key={idx} style={s.calCell} />;
              const ds         = toDateStr(calYear, calMonth, day);
              const isSelected = ds === selectedDate;
              const isT        = ds === todayStr;
              const entries    = entryMap[ds] ?? [];
              const mealTypes  = [...new Set(entries.map((e) => e.mealType))];
              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.calCell, isSelected && s.calCellSel, !isSelected && isT && s.calCellToday]}
                  onPress={() => selectDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    s.calDayNum,
                    isSelected && s.calDayNumSel,
                    !isSelected && isT && { color: LIME },
                    !isSelected && !isT && entries.length > 0 && { color: "#fff" },
                  ]}>
                    {day}
                  </Text>
                  {entries.length > 0 && (
                    <View style={s.calDotsRow}>
                      {mealTypes.slice(0, 3).map((mt) => (
                        <View key={mt} style={[s.calDot, { backgroundColor: isSelected ? "#000" : MEAL_COLORS[mt] }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={s.calLegend}>
            {(Object.entries(MEAL_COLORS) as [NutritionEntry["mealType"], string][]).map(([type, color]) => (
              <View key={type} style={s.calLegendItem}>
                <View style={[s.calLegendDot, { backgroundColor: color }]} />
                <Text style={s.calLegendTxt}>{type}</Text>
              </View>
            ))}
          </View>

          {/* Selected day meal entries */}
          <View style={s.calEntriesSection}>
            <View style={s.calEntriesHeader}>
              <Text style={s.calEntriesTitle}>{isToday ? "Today" : selLabel}</Text>
              {selectedEntries.length > 0 && (
                <Text style={s.calEntriesCount}>{selectedEntries.length} item{selectedEntries.length !== 1 ? "s" : ""}</Text>
              )}
            </View>
            {selectedEntries.length === 0 ? (
              <Text style={s.calEmptyTxt}>No meals logged on this day</Text>
            ) : (
              (["breakfast","lunch","dinner","snack"] as NutritionEntry["mealType"][]).map((mt) => {
                const items = selectedEntries.filter((e) => e.mealType === mt);
                if (!items.length) return null;
                return (
                  <View key={mt} style={s.calEntryGroup}>
                    <View style={s.calEntryGroupRow}>
                      <View style={[s.calEntryDot, { backgroundColor: MEAL_COLORS[mt] }]} />
                      <Text style={s.calEntryLabel}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</Text>
                    </View>
                    {items.map((e) => (
                      <View key={e.id} style={s.calEntryItem}>
                        <Text style={s.calEntryText}>{e.description || "Logged"}</Text>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* ── Analysis section ── */}
      <Divider label={isToday ? "TODAY'S ANALYSIS" : `${selLabel.toUpperCase()} ANALYSIS`} />

      {selectedEntries.length === 0 ? (
        <View style={s.noEntriesCard}>
          <View style={s.noEntriesDots}>
            {[AMBER, BLUE, LIME, PURPLE].map((c) => (
              <View key={c} style={[s.noEntriesDot, { backgroundColor: c }]} />
            ))}
          </View>
          <Text style={s.noEntriesTitle}>{isToday ? "Nothing logged today" : "No meals on this day"}</Text>
          <Text style={s.noEntriesSub}>
            {isToday
              ? "Log meals in the Nutrition tab and come back here for analysis."
              : "Tap the calendar to pick a day with food entries."}
          </Text>
        </View>
      ) : !selectedAnalysis ? (
        <TouchableOpacity
          style={[s.analyseBtn, analyzing && { opacity: 0.6 }]}
          onPress={handleAnalyse}
          disabled={analyzing}
          activeOpacity={0.78}
        >
          {analyzing ? (
            <View style={s.analysingRow}>
              <ActivityIndicator size="small" color={LIME} />
              <Text style={s.analyseBtnTxt}>Analysing your meals…</Text>
            </View>
          ) : (
            <Text style={s.analyseBtnTxt}>Analyse {isToday ? "Today" : selLabel}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={s.resultsWrap}>

          {/* Rating */}
          <View style={s.ratingCard}>
            <View style={s.ratingTop}>
              <View>
                <Text style={s.ratingMeta}>DIET RATING</Text>
                <Text style={[s.ratingVal, { color: RATING_COLOR[selectedAnalysis.rating] }]}>
                  {selectedAnalysis.rating}
                </Text>
              </View>
              <View style={[s.ratingBadge, {
                backgroundColor: RATING_COLOR[selectedAnalysis.rating] + "18",
                borderColor:     RATING_COLOR[selectedAnalysis.rating] + "40",
              }]}>
                <Text style={[s.ratingBadgeTxt, { color: RATING_COLOR[selectedAnalysis.rating] }]}>
                  {selectedAnalysis.rating === "Excellent" || selectedAnalysis.rating === "Good" ? "On track" : "Needs work"}
                </Text>
              </View>
            </View>
            <Text style={s.insightTxt}>{selectedAnalysis.insight}</Text>
            <TouchableOpacity onPress={handleAnalyse} disabled={analyzing}>
              <Text style={s.reanalyseTxt}>{analyzing ? "Analysing…" : "Re-analyse"}</Text>
            </TouchableOpacity>
          </View>

          {/* Macro grid */}
          <View style={s.macroGrid}>
            {MACROS.map(({ key, label, unit, max, color }) => {
              const val = selectedAnalysis[key] ?? 0;
              const pct = Math.min((val / max) * 100, 100);
              return (
                <View key={key} style={s.macroCard}>
                  <View style={[s.macroStripe, { backgroundColor: color }]} />
                  <View style={s.macroBody}>
                    <Text style={s.macroLabel}>{label}</Text>
                    <Text style={[s.macroVal, { color }]}>
                      {val}<Text style={s.macroUnit}> {unit}</Text>
                    </Text>
                    <View style={s.macroTrack}>
                      <View style={[s.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={s.macroTarget}>of {max} {unit}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Suggestions */}
          {selectedAnalysis.suggestions.length > 0 && (
            <View style={s.suggestCard}>
              <Text style={s.suggestHeading}>AURORA SUGGESTS</Text>
              {selectedAnalysis.suggestions.map((sug, i) => (
                <View key={i} style={s.suggestRow}>
                  <View style={s.suggestBullet} />
                  <Text style={s.suggestTxt}>{sug}</Text>
                </View>
              ))}
            </View>
          )}

        </View>
      )}

      {error && <Text style={s.errorTxt}>{error}</Text>}

      {/* ── "Need some help?" CTA ── */}
      <TouchableOpacity style={s.ctaCard} onPress={goToAurora} activeOpacity={0.82}>
        <View style={s.ctaLeft}>
          <Text style={s.ctaTitle}>Need some help?</Text>
          <Text style={s.ctaSub}>
            Get a personalised meal plan, macro targets, and prep ideas from Aurora.
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

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.5 },

  // Calendar toggle
  calToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: CARD, borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: LIME_BORDER, marginBottom: 4,
  },
  calToggleLeft:    { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  calToggleIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: LIME_DIM, borderWidth: 1, borderColor: LIME_BORDER,
    alignItems: "center", justifyContent: "center",
  },
  calToggleTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  calToggleSub:   { color: MUTED, fontSize: 11, marginTop: 2 },
  calChevron: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: CARD_ALT,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER,
  },

  // Calendar card
  calCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: BORDER, gap: 12, marginBottom: 4,
  },
  calHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calNavBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: CARD_ALT,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER,
  },
  calMonthLabel: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },

  calWeekRow: { flexDirection: "row" },
  calWeekDay: { width: CAL_CELL, textAlign: "center", color: MUTED, fontSize: 11, fontWeight: "700" },

  calGrid:       { flexDirection: "row", flexWrap: "wrap" },
  calCell:       { width: CAL_CELL, height: CAL_CELL, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 10 },
  calCellSel:    { backgroundColor: LIME },
  calCellToday:  { backgroundColor: LIME_DIM, borderWidth: 1, borderColor: LIME_BORDER },
  calDayNum:     { color: MUTED, fontSize: 13, fontWeight: "600" },
  calDayNumSel:  { color: "#000", fontWeight: "800" },
  calDotsRow:    { flexDirection: "row", gap: 2 },
  calDot:        { width: 4, height: 4, borderRadius: 99 },

  calLegend: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER,
  },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  calLegendDot:  { width: 6, height: 6, borderRadius: 99 },
  calLegendTxt:  { color: MUTED, fontSize: 10, fontWeight: "600" },

  // Entries inside calendar
  calEntriesSection: { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12, gap: 10 },
  calEntriesHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  calEntriesTitle:   { color: SOFT, fontSize: 13, fontWeight: "700" },
  calEntriesCount:   { color: MUTED, fontSize: 11 },
  calEmptyTxt:       { color: MUTED, fontSize: 12, textAlign: "center", paddingVertical: 8 },

  calEntryGroup:    { gap: 5 },
  calEntryGroupRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  calEntryDot:      { width: 6, height: 6, borderRadius: 99 },
  calEntryLabel:    { color: SOFT, fontSize: 12, fontWeight: "700" },
  calEntryItem:     { backgroundColor: CARD_ALT, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: BORDER },
  calEntryText:     { color: "#fff", fontSize: 12 },

  // Analysis
  noEntriesCard:  { backgroundColor: CARD, borderRadius: 12, padding: 32, alignItems: "center", gap: 12, borderWidth: 1, borderColor: BORDER },
  noEntriesDots:  { flexDirection: "row", gap: 8 },
  noEntriesDot:   { width: 10, height: 10, borderRadius: 99 },
  noEntriesTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  noEntriesSub:   { color: MUTED, fontSize: 13, textAlign: "center", lineHeight: 20 },

  analyseBtn:    { backgroundColor: CARD, borderRadius: 14, padding: 18, alignItems: "center", borderWidth: 1, borderColor: LIME_BORDER },
  analysingRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  analyseBtnTxt: { color: LIME, fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  errorTxt:      { color: "#F87171", fontSize: 12, textAlign: "center", marginTop: 8 },

  resultsWrap: { gap: 10 },

  ratingCard:     { backgroundColor: CARD, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: BORDER, gap: 12 },
  ratingTop:      { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  ratingMeta:     { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.4, marginBottom: 4 },
  ratingVal:      { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  ratingBadge:    { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  ratingBadgeTxt: { fontSize: 11, fontWeight: "700" },
  insightTxt:     { color: SOFT, fontSize: 14, lineHeight: 22 },
  reanalyseTxt:   { color: MUTED, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },

  macroGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  macroCard:   { width: "48%", backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BORDER, overflow: "hidden" },
  macroStripe: { height: 3, width: "100%" },
  macroBody:   { padding: 14, gap: 4 },
  macroLabel:  { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  macroVal:    { fontSize: 28, fontWeight: "900", letterSpacing: -1, lineHeight: 32 },
  macroUnit:   { fontSize: 13, fontWeight: "600", color: SOFT },
  macroTrack:  { height: 3, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", marginTop: 4 },
  macroFill:   { height: "100%", borderRadius: 99 },
  macroTarget: { color: MUTED, fontSize: 10, marginTop: 3 },

  suggestCard:    { backgroundColor: CARD, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: BORDER, gap: 12 },
  suggestHeading: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  suggestRow:     { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  suggestBullet:  { width: 5, height: 5, borderRadius: 99, backgroundColor: LIME, marginTop: 8 },
  suggestTxt:     { color: SOFT, fontSize: 14, lineHeight: 22, flex: 1 },

  ctaCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: CARD, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: LIME_BORDER, marginTop: 8, gap: 16,
  },
  ctaLeft:  { flex: 1, gap: 5 },
  ctaTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.4 },
  ctaSub:   { color: MUTED, fontSize: 13, lineHeight: 20 },
  ctaArrow: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
