import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
  { ml: 250,  label: "250 ml", desc: "Small cup"  },
  { ml: 500,  label: "500 ml", desc: "Bottle"     },
  { ml: 750,  label: "750 ml", desc: "Large cup"  },
  { ml: 1000, label: "1 L",    desc: "Full litre" },
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

export default function WaterScreen() {
  const insets    = useSafeAreaInsets();
  const { stats, profile, hydrationPct, addWater } = useApp();
  const remaining = Math.max(0, profile.waterGoalMl - stats.waterMl);
  const pct       = Math.min(Math.round(hydrationPct), 100);
  const comment   = getComment(pct);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Title ── */}
      <Text style={s.title}>Hydration</Text>
      <Text style={s.subtitle}>{stats.waterMl} / {profile.waterGoalMl} ml today</Text>

      {/* ── Hero card ── */}
      <View style={s.heroCard}>
        <LinearGradient
          colors={pct >= 75
            ? ["rgba(200,255,0,0.07)", "transparent"]
            : ["rgba(255,255,255,0.03)", "transparent"]}
          style={StyleSheet.absoluteFill}
          borderRadius={12}
        />

        {/* Big % */}
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroPct}>
              {pct}<Text style={s.heroPctUnit}>%</Text>
            </Text>
            <Text style={s.heroLabel}>of daily goal</Text>
          </View>
          {/* Circular progress indicator */}
          <View style={s.ringWrap}>
            {/* Track */}
            <View style={[s.ringTrack, { borderColor: "rgba(255,255,255,0.07)" }]} />
            {/* Fill approximation via clip */}
            <View style={[s.ringFill, {
              borderColor: pct >= 75 ? LIME : pct >= 50 ? LIME : AMBER,
              opacity: 0.4 + (pct / 100) * 0.6,
            }]} />
            <View style={s.ringCenter}>
              <View style={[s.ringDot, { backgroundColor: pct >= 50 ? LIME : AMBER }]} />
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.bar}>
          <LinearGradient
            colors={pct >= 75 ? [LIME, "#A0D000"] : [AMBER, "#F59E0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.barFill, { width: `${pct}%` }]}
          />
        </View>

        {/* Stat row */}
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: pct >= 50 ? LIME : "#fff" }]}>
              {stats.waterMl}
              <Text style={s.statUnit}> ml</Text>
            </Text>
            <Text style={s.statLabel}>consumed</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>
              {remaining}
              <Text style={s.statUnit}> ml</Text>
            </Text>
            <Text style={s.statLabel}>remaining</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>
              {profile.waterGoalMl}
              <Text style={s.statUnit}> ml</Text>
            </Text>
            <Text style={s.statLabel}>goal</Text>
          </View>
        </View>
      </View>

      {/* ── Aurora comment ── */}
      <View style={[s.commentCard, { borderColor: comment.color + "28", backgroundColor: comment.color + "0C" }]}>
        <View style={[s.commentDot, { backgroundColor: comment.color }]} />
        <Text style={[s.commentText, { color: comment.color === LIME ? SOFT : "#FDE68A" }]}>
          {comment.text}
        </Text>
      </View>

      {/* ── Quick add ── */}
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
                  <Text style={s.quickBadgeTxt}>+ Add</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

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

  // Hero
  heroCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
    marginBottom: 10,
    gap: 16,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroPct: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -3,
    lineHeight: 76,
  },
  heroPctUnit: { fontSize: 30, fontWeight: "700", letterSpacing: -1 },
  heroLabel:   { color: MUTED, fontSize: 13, fontWeight: "500", marginTop: 2 },

  // Simple ring (decorative, CSS approach)
  ringWrap:   { width: 72, height: 72, position: "relative", alignItems: "center", justifyContent: "center", marginTop: 4 },
  ringTrack:  { position: "absolute", width: 72, height: 72, borderRadius: 36, borderWidth: 5 },
  ringFill:   { position: "absolute", width: 72, height: 72, borderRadius: 36, borderWidth: 5, borderTopColor: LIME, borderRightColor: LIME, borderBottomColor: "transparent", borderLeftColor: "transparent", transform: [{ rotate: "-45deg" }] },
  ringCenter: { alignItems: "center", justifyContent: "center" },
  ringDot:    { width: 10, height: 10, borderRadius: 5 },

  // Progress bar
  bar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },

  // Stat row
  statRow:     { flexDirection: "row", alignItems: "center" },
  statBox:     { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: BORDER },
  statNum:     { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  statUnit:    { color: MUTED, fontSize: 12, fontWeight: "400" },
  statLabel:   { color: MUTED, fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },

  // Comment
  commentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 10,
  },
  commentDot:  { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  commentText: { fontSize: 13, lineHeight: 20, fontStyle: "italic", flex: 1 },

  // Section label
  sectionLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 10,
  },

  // Quick add
  quickGrid: { gap: 8, marginBottom: 20 },
  quickRow:  { flexDirection: "row", gap: 8 },
  quickCard: {
    flex: 1,
    borderRadius: 12,
    padding: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 3,
  },
  quickLabel:    { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.8 },
  quickDesc:     { color: MUTED, fontSize: 12, fontWeight: "500" },
  quickBadge: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: CARD_ALT,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: LIME_BORDER,
  },
  quickBadgeTxt: { color: LIME, fontSize: 11, fontWeight: "700" },

  // Reset
  resetBtn:  { alignItems: "center", paddingVertical: 16 },
  resetText: { color: MUTED, fontSize: 13, fontWeight: "500" },
});
