import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const QUICK_HOURS = [5.5, 6, 7, 7.5, 8, 9];

type Quality = { label: string; color: string };
function sleepQuality(h: number): Quality {
  if (h >= 8) return { label: "Excellent", color: LIME  };
  if (h >= 7) return { label: "Good",      color: LIME  };
  if (h >= 6) return { label: "Fair",      color: AMBER };
  return         { label: "Low",           color: "#F87171" };
}

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

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const { stats, sleepHistory, logSleep } = useApp();
  const [custom, setCustom] = useState("");

  const last7 = sleepHistory.slice(-7);
  const avg =
    last7.length > 0
      ? (last7.reduce((s, e) => s + e.hours, 0) / last7.length).toFixed(1)
      : null;

  const handleCustom = () => {
    const h = parseFloat(custom);
    if (!isNaN(h) && h > 0 && h <= 24) { logSleep(h); setCustom(""); }
  };

  const maxH = last7.length > 0 ? Math.max(...last7.map((e) => e.hours), 9) : 9;
  const q    = stats.sleepHours !== null ? sleepQuality(stats.sleepHours) : null;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>Sleep</Text>
      <Text style={s.subtitle}>
        {stats.sleepHours !== null
          ? `You slept ${stats.sleepHours}h last night.`
          : "Log last night's sleep to track your rest."}
      </Text>

      {/* ── Hero card ── */}
      <View style={s.heroCard}>
        <LinearGradient
          colors={["rgba(200,255,0,0.06)", "transparent"]}
          style={StyleSheet.absoluteFill}
          borderRadius={20}
        />

        <View style={s.heroTop}>
          <View>
            <Text style={s.heroEyebrow}>LAST NIGHT</Text>
            {stats.sleepHours !== null ? (
              <Text style={s.heroNum}>
                {stats.sleepHours}<Text style={s.heroUnit}>h</Text>
              </Text>
            ) : (
              <Text style={s.heroEmpty}>—</Text>
            )}
          </View>

          <View style={s.heroRight}>
            {q && (
              <View style={[s.qualityBadge, {
                backgroundColor: q.color + "18",
                borderColor:     q.color + "40",
              }]}>
                <Text style={[s.qualityTxt, { color: q.color }]}>{q.label}</Text>
              </View>
            )}
            {avg && (
              <View style={s.avgBox}>
                <Text style={s.avgLabel}>7-DAY AVG</Text>
                <Text style={s.avgVal}>{avg}h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mini sleep meter */}
        {stats.sleepHours !== null && (
          <View style={s.meter}>
            <View style={s.meterTrack}>
              <View style={[s.meterFill, {
                width: `${Math.min((stats.sleepHours / 9) * 100, 100)}%`,
                backgroundColor: q!.color,
              }]} />
              {/* Recommended zone marker at 7-9h */}
              <View style={[s.meterZone, { left: `${(7 / 9) * 100}%`, width: `${(2 / 9) * 100}%` }]} />
            </View>
            <View style={s.meterLabels}>
              <Text style={s.meterHint}>0h</Text>
              <Text style={[s.meterHint, { color: LIME }]}>7–9h recommended</Text>
              <Text style={s.meterHint}>9h</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Log sleep ── */}
      <Divider label="LOG SLEEP" />

      <View style={s.quickGrid}>
        {QUICK_HOURS.map((h) => {
          const active = stats.sleepHours === h;
          const qh     = sleepQuality(h);
          return (
            <TouchableOpacity
              key={h}
              style={[s.quickBtn, active && { borderColor: qh.color + "66", backgroundColor: qh.color + "12" }]}
              onPress={() => logSleep(h)}
              activeOpacity={0.75}
            >
              <Text style={[s.quickBtnNum, active && { color: qh.color }]}>{h}h</Text>
              <Text style={[s.quickBtnLabel, active && { color: qh.color + "AA" }]}>{qh.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom input */}
      <View style={s.customRow}>
        <TextInput
          style={s.input}
          placeholder="Custom hours (e.g. 6.5)"
          placeholderTextColor={MUTED}
          value={custom}
          onChangeText={setCustom}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={handleCustom}
        />
        <TouchableOpacity onPress={handleCustom} activeOpacity={0.85}>
          <LinearGradient
            colors={[LIME, "#A0D000"]}
            style={s.logBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.logBtnTxt}>Log</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── 7-day bar chart ── */}
      {last7.length > 0 && (
        <>
          <Divider label="LAST 7 DAYS" />
          <View style={s.chartCard}>
            <View style={s.bars}>
              {last7.map((entry, i) => {
                const day  = new Date(entry.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" });
                const qBar = sleepQuality(entry.hours);
                const barH = Math.max(12, (entry.hours / maxH) * 96);
                const isLatest = i === last7.length - 1;
                return (
                  <View key={i} style={s.barCol}>
                    <Text style={[s.barNum, isLatest && { color: qBar.color }]}>{entry.hours}h</Text>
                    <View style={s.barTrack}>
                      <LinearGradient
                        colors={[qBar.color, qBar.color + "88"]}
                        style={[s.bar, { height: barH }]}
                      />
                    </View>
                    <Text style={[s.barDay, isLatest && { color: SOFT }]}>{day}</Text>
                  </View>
                );
              })}
            </View>
            {/* 8h guideline */}
            <View style={[s.guideline, { bottom: 36 + (8 / maxH) * 96 }]}>
              <Text style={s.guidelineTxt}>8h</Text>
            </View>
          </View>
        </>
      )}

      {/* ── Insight card ── */}
      <View style={s.insightCard}>
        <View style={s.insightHeader}>
          <View style={s.insightDot} />
          <Text style={s.insightTitle}>Sleep Insight</Text>
        </View>
        <Text style={s.insightTxt}>
          {stats.sleepHours !== null && stats.sleepHours < 7
            ? `You got ${stats.sleepHours}h last night — below the 7–9h recommendation. Try going to bed 30 min earlier tonight.`
            : avg && parseFloat(avg) < 7
            ? `Your 7-day average is ${avg}h. Consistent bedtimes matter more than duration alone.`
            : "Great work on your sleep. Consistent sleep and wake times help your body's rhythm the most."}
        </Text>
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

  // Hero
  heroCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: LIME_BORDER, overflow: "hidden", gap: 16,
  },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroEyebrow: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  heroNum: {
    color: "#fff", fontSize: 64, fontWeight: "900",
    letterSpacing: -3, lineHeight: 68,
  },
  heroUnit:  { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  heroEmpty: { color: MUTED, fontSize: 64, fontWeight: "800", letterSpacing: -3 },

  heroRight:    { alignItems: "flex-end", gap: 10, paddingTop: 4 },
  qualityBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  qualityTxt:   { fontSize: 12, fontWeight: "700" },
  avgBox:       { alignItems: "flex-end", gap: 2 },
  avgLabel:     { color: MUTED, fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  avgVal:       { color: SOFT, fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },

  // Sleep meter
  meter:       { gap: 8 },
  meterTrack:  { height: 4, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", position: "relative" },
  meterFill:   { height: "100%", borderRadius: 99 },
  meterZone:   { position: "absolute", top: 0, height: "100%", backgroundColor: "rgba(200,255,0,0.15)" },
  meterLabels: { flexDirection: "row", justifyContent: "space-between" },
  meterHint:   { color: MUTED, fontSize: 10, fontWeight: "500" },

  // Quick grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  quickBtn: {
    flex: 1, minWidth: "30%", backgroundColor: CARD,
    borderRadius: 10, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: BORDER, gap: 4,
  },
  quickBtnNum:   { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  quickBtnLabel: { color: MUTED, fontSize: 10, fontWeight: "600" },

  // Custom row
  customRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  input: {
    flex: 1, backgroundColor: CARD, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14,
    color: "#fff", fontSize: 15,
  },
  logBtn:    { borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14, justifyContent: "center", alignItems: "center" },
  logBtnTxt: { color: "#000", fontWeight: "800", fontSize: 15 },

  // Chart
  chartCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: BORDER, position: "relative",
  },
  bars: { flexDirection: "row", alignItems: "flex-end", height: 140, gap: 6 },
  barCol:   { flex: 1, alignItems: "center", gap: 4 },
  barNum:   { color: MUTED, fontSize: 9, fontWeight: "600" },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar:      { width: "72%", borderRadius: 6 },
  barDay:   { color: MUTED, fontSize: 10, fontWeight: "500" },

  guideline: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  guidelineTxt: { color: "rgba(255,255,255,0.15)", fontSize: 9, fontWeight: "700" },

  // Insight
  insightCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: BORDER, gap: 12, marginTop: 4,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  insightDot:    { width: 6, height: 6, borderRadius: 99, backgroundColor: LIME },
  insightTitle:  { color: "#fff", fontSize: 14, fontWeight: "700" },
  insightTxt:    { color: SOFT, fontSize: 14, lineHeight: 22 },
});
