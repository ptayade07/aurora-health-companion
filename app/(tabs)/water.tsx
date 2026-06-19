import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { MotiView } from "moti";
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

const QUICK_ADD = [
  { ml: 250,  label: "+250",  desc: "Small cup"  },
  { ml: 500,  label: "+500",  desc: "Bottle"     },
  { ml: 750,  label: "+750",  desc: "Large cup"  },
  { ml: 1000, label: "+1000", desc: "Full litre" },
];

const COMMENTS: Record<number, { text: string; color: string }> = {
  0:   { text: "Water called. It misses you.",              color: AMBER },
  25:  { text: "Progress. Sort of.",                        color: AMBER },
  50:  { text: "Halfway there. Your kidneys approve.",      color: LIME  },
  75:  { text: "Almost. Your glow is loading…",            color: LIME  },
  100: { text: "Goal crushed. Hydration queen behavior.",   color: LIME  },
};

function getComment(pct: number) {
  const key = [100, 75, 50, 25, 0].find((k) => pct >= k) ?? 0;
  return COMMENTS[key];
}

// ── Progress Ring ─────────────────────────────────────────────────────────────
function ProgressRing({ pct }: { pct: number }) {
  const SIZE = 200;
  const CX = 100, CY = 100, R = 80;
  const C = 2 * Math.PI * R;
  const filled = Math.min((pct / 100) * C, C - 0.5);
  const color  = pct >= 50 ? LIME : AMBER;

  return (
    <View style={ring.wrap}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={CX} cy={CY} r={R}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
        <G transform={`rotate(-90 ${CX} ${CY})`}>
          <Circle cx={CX} cy={CY} r={R}
            fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
            strokeDasharray={`${filled} ${C}`} />
        </G>
      </Svg>
      <View style={ring.center}>
        <Text style={[ring.pct, { color }]}>{pct}<Text style={ring.pctUnit}>%</Text></Text>
        <Text style={ring.sub}>of goal</Text>
      </View>
    </View>
  );
}
const ring = StyleSheet.create({
  wrap:    { width: 200, height: 200, alignSelf: "center", alignItems: "center", justifyContent: "center" },
  center:  { alignItems: "center" },
  pct:     { fontSize: 56, fontWeight: "900", letterSpacing: -2, lineHeight: 60 },
  pctUnit: { fontSize: 24, fontWeight: "700" },
  sub:     { color: MUTED, fontSize: 12, fontWeight: "600", marginTop: 2 },
});

// ── History milestones ─────────────────────────────────────────────────────────
function History({ waterMl, goal }: { waterMl: number; goal: number }) {
  const milestones = [
    { label: "First sip",   ml: Math.round(goal * 0.10) },
    { label: "Quarter",     ml: Math.round(goal * 0.25) },
    { label: "Halfway",     ml: Math.round(goal * 0.50) },
    { label: "Almost there",ml: Math.round(goal * 0.75) },
    { label: "Goal hit",    ml: goal                    },
  ];

  return (
    <View style={hist.card}>
      <Text style={hist.title}>History</Text>
      {milestones.map((m, i) => {
        const hit = waterMl >= m.ml;
        return (
          <View key={i} style={hist.row}>
            <View style={[hist.dot, hit && hist.dotHit]} />
            {i < milestones.length - 1 && (
              <View style={[hist.line, hit && milestones[i + 1] && waterMl >= milestones[i + 1].ml && hist.lineHit]} />
            )}
            <View style={hist.info}>
              <Text style={[hist.label, hit && hist.labelHit]}>{m.label}</Text>
              <Text style={hist.ml}>{m.ml} ml</Text>
            </View>
            {hit && <Text style={hist.check}>✓</Text>}
          </View>
        );
      })}
    </View>
  );
}
const hist = StyleSheet.create({
  card:     { backgroundColor: CARD, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER },
  title:    { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 20 },
  row:      { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18, position: "relative" },
  dot:      { width: 10, height: 10, borderRadius: 99, borderWidth: 1.5, borderColor: MUTED, backgroundColor: "transparent" },
  dotHit:   { backgroundColor: LIME, borderColor: LIME },
  line:     { position: "absolute", left: 4.5, top: 10, width: 1, height: 28, backgroundColor: BORDER },
  lineHit:  { backgroundColor: LIME },
  info:     { flex: 1, gap: 1 },
  label:    { color: MUTED, fontSize: 13, fontWeight: "600" },
  labelHit: { color: "#fff" },
  ml:       { color: MUTED, fontSize: 11, fontWeight: "500" },
  check:    { color: LIME, fontSize: 14, fontWeight: "800" },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function WaterScreen() {
  const insets    = useSafeAreaInsets();
  const { stats, profile, hydrationPct, addWater } = useApp();
  const [custom, setCustom] = useState("");

  const remaining = Math.max(0, profile.waterGoalMl - stats.waterMl);
  const pct       = Math.min(Math.round(hydrationPct), 100);
  const comment   = getComment(pct);

  const handleCustom = () => {
    const ml = parseInt(custom, 10);
    if (!isNaN(ml) && ml > 0 && ml <= 5000) {
      addWater(ml);
      setCustom("");
    }
  };

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Title ── */}
      <Text style={s.title}>Hydration</Text>
      <Text style={s.subtitle}>{stats.waterMl} / {profile.waterGoalMl} ml today</Text>

      {/* ── Progress Ring ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 16, delay: 60 }}
        style={s.ringCard}
      >
        <ProgressRing pct={pct} />

        {/* Stat row */}
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: pct >= 50 ? LIME : "#fff" }]}>
              {stats.waterMl}<Text style={s.statUnit}> ml</Text>
            </Text>
            <Text style={s.statLabel}>consumed</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>
              {remaining}<Text style={s.statUnit}> ml</Text>
            </Text>
            <Text style={s.statLabel}>remaining</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>
              {profile.waterGoalMl}<Text style={s.statUnit}> ml</Text>
            </Text>
            <Text style={s.statLabel}>goal</Text>
          </View>
        </View>
      </MotiView>

      {/* ── Aurora comment ── */}
      <View style={[s.commentCard, { borderColor: comment.color + "28", backgroundColor: comment.color + "0C" }]}>
        <View style={[s.commentDot, { backgroundColor: comment.color }]} />
        <Text style={[s.commentText, { color: comment.color === LIME ? SOFT : "#FDE68A" }]}>
          {comment.text}
        </Text>
      </View>

      {/* ── Quick Add ── */}
      <Text style={s.sectionLabel}>QUICK ADD</Text>
      <View style={s.quickGrid}>
        {[QUICK_ADD.slice(0, 2), QUICK_ADD.slice(2)].map((row, ri) => (
          <View key={ri} style={s.quickRow}>
            {row.map((item) => (
              <TouchableOpacity
                key={item.ml}
                style={s.quickCard}
                onPress={() => addWater(item.ml)}
                activeOpacity={0.72}
              >
                <Text style={s.quickLabel}>{item.label}</Text>
                <Text style={s.quickDesc}>{item.desc}</Text>
                <View style={s.quickBadge}>
                  <Text style={s.quickBadgeTxt}>ml</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* ── Custom Input ── */}
      <Text style={s.sectionLabel}>CUSTOM AMOUNT</Text>
      <View style={s.customRow}>
        <TextInput
          style={s.input}
          placeholder="Enter ml (e.g. 350)"
          placeholderTextColor={MUTED}
          value={custom}
          onChangeText={setCustom}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={handleCustom}
        />
        <TouchableOpacity onPress={handleCustom} activeOpacity={0.85} style={s.addBtn}>
          <Text style={s.addBtnTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── History ── */}
      <Text style={s.sectionLabel}>HISTORY</Text>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 200 }}
      >
        <History waterMl={stats.waterMl} goal={profile.waterGoalMl} />
      </MotiView>

      {/* ── Reset ── */}
      {stats.waterMl > 0 && (
        <TouchableOpacity
          style={s.resetBtn}
          onPress={() => addWater(-stats.waterMl)}
          activeOpacity={0.6}
        >
          <Text style={s.resetText}>Reset today's water</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: BG },
  content:  { paddingHorizontal: 16, paddingBottom: 120 },

  title:    { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1.2, marginBottom: 4 },
  subtitle: { color: MUTED, fontSize: 13, fontWeight: "500", marginBottom: 20 },

  // Ring card
  ringCard: {
    backgroundColor: CARD, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12, gap: 24,
    alignItems: "center",
  },

  // Stat row
  statRow:     { flexDirection: "row", alignItems: "center", width: "100%" },
  statBox:     { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: BORDER },
  statNum:     { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  statUnit:    { color: MUTED, fontSize: 12, fontWeight: "400" },
  statLabel:   { color: MUTED, fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },

  // Comment
  commentCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 24, gap: 10,
  },
  commentDot:  { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  commentText: { fontSize: 13, lineHeight: 20, fontStyle: "italic", flex: 1 },

  // Section label
  sectionLabel: {
    color: MUTED, fontSize: 10, fontWeight: "700",
    letterSpacing: 1.6, marginBottom: 10,
  },

  // Quick add
  quickGrid: { gap: 8, marginBottom: 24 },
  quickRow:  { flexDirection: "row", gap: 8 },
  quickCard: {
    flex: 1, borderRadius: 14, padding: 18,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, gap: 3,
  },
  quickLabel:    { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.8 },
  quickDesc:     { color: MUTED, fontSize: 12, fontWeight: "500" },
  quickBadge: {
    marginTop: 12, alignSelf: "flex-start",
    backgroundColor: CARD_ALT, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: LIME_BORDER,
  },
  quickBadgeTxt: { color: LIME, fontSize: 10, fontWeight: "700" },

  // Custom input
  customRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  input: {
    flex: 1, backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14,
    color: "#fff", fontSize: 15,
  },
  addBtn:    { backgroundColor: LIME, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14, justifyContent: "center" },
  addBtnTxt: { color: "#000", fontWeight: "800", fontSize: 15 },

  // Reset
  resetBtn:  { alignItems: "center", paddingVertical: 20 },
  resetText: { color: MUTED, fontSize: 13, fontWeight: "500" },
});
