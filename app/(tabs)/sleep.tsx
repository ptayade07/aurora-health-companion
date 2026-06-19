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
const LIME_BORDER = "rgba(200,255,0,0.18)";
const BG          = "#070707";
const CARD        = "#101010";
const MUTED       = "rgba(255,255,255,0.30)";
const SOFT        = "rgba(255,255,255,0.65)";
const BORDER      = "rgba(255,255,255,0.07)";
const AMBER       = "#FBBF24";
const RED         = "#F87171";

const QUICK_HOURS = [5.5, 6, 7, 7.5, 8, 9];

type Quality = { label: string; color: string };
function sleepQuality(h: number): Quality {
  if (h >= 8) return { label: "Excellent", color: LIME  };
  if (h >= 7) return { label: "Good",      color: LIME  };
  if (h >= 6) return { label: "Fair",      color: AMBER };
  return         { label: "Low",           color: RED   };
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

// ── 7-day chart ───────────────────────────────────────────────────────────────
function Chart7({ data }: { data: { date: string; hours: number }[] }) {
  if (data.length === 0) return null;
  const maxH = Math.max(...data.map((e) => e.hours), 9);
  return (
    <View style={chart.card}>
      <Text style={chart.title}>7 Day Chart</Text>
      <View style={chart.bars}>
        {data.map((entry, i) => {
          const day  = new Date(entry.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" });
          const qBar = sleepQuality(entry.hours);
          const barH = Math.max(12, (entry.hours / maxH) * 96);
          const isLatest = i === data.length - 1;
          return (
            <View key={i} style={chart.col}>
              <Text style={[chart.num, isLatest && { color: qBar.color }]}>{entry.hours}h</Text>
              <View style={chart.track}>
                <LinearGradient
                  colors={[qBar.color, qBar.color + "88"]}
                  style={[chart.bar, { height: barH }]}
                />
              </View>
              <Text style={[chart.day, isLatest && { color: SOFT }]}>{day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── 30-day chart ──────────────────────────────────────────────────────────────
function Chart30({ data }: { data: { date: string; hours: number }[] }) {
  if (data.length < 8) return null;
  const maxH = Math.max(...data.map((e) => e.hours), 9);
  return (
    <View style={chart.card}>
      <Text style={chart.title}>30 Day Chart</Text>
      <View style={[chart.bars, { height: 60, gap: 2 }]}>
        {data.map((entry, i) => {
          const q    = sleepQuality(entry.hours);
          const barH = Math.max(4, (entry.hours / maxH) * 56);
          const isLatest = i === data.length - 1;
          return (
            <View key={i} style={[chart.col, { flex: 0, width: undefined, minWidth: 0 }]}>
              <View style={[chart.track, { height: 56 }]}>
                <View style={[
                  chart.bar,
                  { height: barH, backgroundColor: isLatest ? LIME : q.color + "66", borderRadius: 2 }
                ]} />
              </View>
            </View>
          );
        })}
      </View>
      <View style={chart30.legend}>
        <Text style={chart30.hint}>30 nights · most recent →</Text>
        <View style={chart30.avg}>
          <Text style={chart30.avgLbl}>avg </Text>
          <Text style={chart30.avgVal}>
            {(data.reduce((s, e) => s + e.hours, 0) / data.length).toFixed(1)}h
          </Text>
        </View>
      </View>
    </View>
  );
}
const chart30 = StyleSheet.create({
  legend:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  hint:    { color: MUTED, fontSize: 10, fontWeight: "500" },
  avg:     { flexDirection: "row", alignItems: "baseline" },
  avgLbl:  { color: MUTED, fontSize: 10, fontWeight: "500" },
  avgVal:  { color: LIME, fontSize: 14, fontWeight: "800" },
});

const chart = StyleSheet.create({
  card:  { backgroundColor: CARD, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER },
  title: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 16 },
  bars:  { flexDirection: "row", alignItems: "flex-end", height: 140, gap: 6 },
  col:   { flex: 1, alignItems: "center", gap: 4 },
  num:   { color: MUTED, fontSize: 9, fontWeight: "600" },
  track: { flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar:   { width: "72%", borderRadius: 6 },
  day:   { color: MUTED, fontSize: 10, fontWeight: "500" },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const { stats, sleepHistory, logSleep } = useApp();
  const [custom, setCustom] = useState("");

  const last7  = sleepHistory.slice(-7);
  const last30 = sleepHistory.slice(-30);

  const avg7 = last7.length > 0
    ? (last7.reduce((s, e) => s + e.hours, 0) / last7.length).toFixed(1)
    : null;

  const handleCustom = () => {
    const h = parseFloat(custom);
    if (!isNaN(h) && h > 0 && h <= 24) { logSleep(h); setCustom(""); }
  };

  const q = stats.sleepHours !== null ? sleepQuality(stats.sleepHours) : null;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>Tonight's Sleep</Text>
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
            {avg7 && (
              <View style={s.avgBox}>
                <Text style={s.avgLabel}>7-DAY AVG</Text>
                <Text style={s.avgVal}>{avg7}h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sleep meter */}
        {stats.sleepHours !== null && (
          <View style={s.meter}>
            <View style={s.meterTrack}>
              <View style={[s.meterFill, {
                width: `${Math.min((stats.sleepHours / 9) * 100, 100)}%`,
                backgroundColor: q!.color,
              }]} />
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
      <Divider label="TONIGHT'S SLEEP" />

      {/* Hours quick select */}
      <Text style={s.sectionLabel}>HOURS</Text>
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

      {/* Quality indicator */}
      {stats.sleepHours !== null && q && (
        <View style={[s.qualityCard, { borderColor: q.color + "30", backgroundColor: q.color + "0A" }]}>
          <View style={[s.qualityDot, { backgroundColor: q.color }]} />
          <Text style={s.qualityCardTxt}>
            Quality: <Text style={{ color: q.color, fontWeight: "700" }}>{q.label}</Text>
            {" · "}{stats.sleepHours}h logged
          </Text>
        </View>
      )}

      {/* Custom input */}
      <Text style={s.sectionLabel}>CUSTOM</Text>
      <View style={s.customRow}>
        <TextInput
          style={s.input}
          placeholder="Hours (e.g. 6.5)"
          placeholderTextColor={MUTED}
          value={custom}
          onChangeText={setCustom}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={handleCustom}
        />
        <TouchableOpacity onPress={handleCustom} activeOpacity={0.85} style={s.saveBtn}>
          <Text style={s.saveBtnTxt}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ── Charts ── */}
      {last7.length > 0 && (
        <>
          <Divider label="SLEEP HISTORY" />
          <View style={{ gap: 14 }}>
            <Chart7 data={last7} />
            <Chart30 data={last30} />

            {/* Average sleep */}
            {avg7 && (
              <View style={s.avgCard}>
                <View>
                  <Text style={s.avgCardLabel}>Average Sleep</Text>
                  <Text style={s.avgCardSub}>Past 7 nights</Text>
                </View>
                <Text style={s.avgCardVal}>{avg7}h</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* ── Insight ── */}
      <View style={s.insightCard}>
        <View style={s.insightHeader}>
          <View style={s.insightDot} />
          <Text style={s.insightTitle}>Sleep Insight</Text>
        </View>
        <Text style={s.insightTxt}>
          {stats.sleepHours !== null && stats.sleepHours < 7
            ? `You got ${stats.sleepHours}h last night — below the 7–9h recommendation. Try going to bed 30 min earlier tonight.`
            : avg7 && parseFloat(avg7) < 7
            ? `Your 7-day average is ${avg7}h. Consistent bedtimes matter more than duration alone.`
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
    backgroundColor: CARD, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: LIME_BORDER, overflow: "hidden", gap: 16,
  },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroEyebrow: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  heroNum: { color: "#fff", fontSize: 64, fontWeight: "900", letterSpacing: -3, lineHeight: 68 },
  heroUnit:  { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  heroEmpty: { color: MUTED, fontSize: 64, fontWeight: "800", letterSpacing: -3 },
  heroRight: { alignItems: "flex-end", gap: 10, paddingTop: 4 },
  qualityBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  qualityTxt:   { fontSize: 12, fontWeight: "700" },
  avgBox:    { alignItems: "flex-end", gap: 2 },
  avgLabel:  { color: MUTED, fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  avgVal:    { color: SOFT, fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },

  // Sleep meter
  meter:       { gap: 8 },
  meterTrack:  { height: 4, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", position: "relative" },
  meterFill:   { height: "100%", borderRadius: 99 },
  meterZone:   { position: "absolute", top: 0, height: "100%", backgroundColor: "rgba(200,255,0,0.15)" },
  meterLabels: { flexDirection: "row", justifyContent: "space-between" },
  meterHint:   { color: MUTED, fontSize: 10, fontWeight: "500" },

  // Section labels
  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: "700",
    letterSpacing: 1.6, marginBottom: 10,
  },

  // Quick grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1, minWidth: "30%", backgroundColor: CARD,
    borderRadius: 12, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: BORDER, gap: 4,
  },
  quickBtnNum:   { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  quickBtnLabel: { color: MUTED, fontSize: 10, fontWeight: "600" },

  // Quality card
  qualityCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20,
  },
  qualityDot:    { width: 6, height: 6, borderRadius: 99 },
  qualityCardTxt:{ color: SOFT, fontSize: 13 },

  // Custom row
  customRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  input: {
    flex: 1, backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14,
    color: "#fff", fontSize: 15,
  },
  saveBtn:    { backgroundColor: LIME, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, justifyContent: "center" },
  saveBtnTxt: { color: "#000", fontWeight: "800", fontSize: 15 },

  // Average card
  avgCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: CARD, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: BORDER,
  },
  avgCardLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },
  avgCardSub:   { color: MUTED, fontSize: 11, marginTop: 2 },
  avgCardVal:   { color: LIME, fontSize: 36, fontWeight: "900", letterSpacing: -1.5 },

  // Insight
  insightCard: {
    backgroundColor: CARD, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: BORDER, gap: 12, marginTop: 14,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  insightDot:    { width: 6, height: 6, borderRadius: 99, backgroundColor: LIME },
  insightTitle:  { color: "#fff", fontSize: 14, fontWeight: "700" },
  insightTxt:    { color: SOFT, fontSize: 14, lineHeight: 22 },
});
