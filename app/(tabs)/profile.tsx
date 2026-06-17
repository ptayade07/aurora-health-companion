import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G } from "react-native-svg";
import { useApp } from "../../context/AppContext";
import { PERSONALITY_OPTIONS } from "../../lib/personality";
import { getScoreLabel } from "../../lib/healthScore";
import { COMPANIONS } from "../../lib/companion";
import PixelCompanion from "../../components/PixelCompanion";

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
const RED         = "#F87171";

const PERSONALITY_COLOR: Record<string, string> = {
  supportive:      BLUE,
  chaotic:         LIME,
  brutally_honest: AMBER,
};

// ── Score ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const SIZE = 72, CX = 36, CY = 36, R = 28;
  const C = 2 * Math.PI * R;
  const filled = Math.min((score / 100) * C, C - 0.1);
  const col = score >= 70 ? LIME : score >= 50 ? AMBER : RED;
  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
        <G transform={`rotate(-90 ${CX} ${CY})`}>
          <Circle cx={CX} cy={CY} r={R} fill="none" stroke={col} strokeWidth={4}
            strokeLinecap="round" strokeDasharray={`${filled} ${C}`} />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: col, fontSize: 16, fontWeight: "900" }}>{score}</Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, healthScore, logout, setPersonality, setCompanionType, companionMood,
    stats, sleepHistory, habits, hydrationPct,
  } = useApp();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggle = (key: string) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  const avg7Sleep = sleepHistory.length > 0
    ? (sleepHistory.slice(-7).reduce((s, e) => s + e.hours, 0) / Math.min(sleepHistory.length, 7)).toFixed(1)
    : null;
  const longestStreak  = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const habitsComplete = habits.filter((h) => h.completedToday).length;
  const initial        = (profile.name || "A")[0].toUpperCase();

  const activeCompanion = COMPANIONS.find((c) => c.id === (profile.companionType ?? "fox")) ?? COMPANIONS[0];

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>Profile</Text>

      {/* ── Hero card ── */}
      <View style={s.heroCard}>
        <LinearGradient
          colors={["rgba(200,255,0,0.06)", "transparent"]}
          style={StyleSheet.absoluteFill}
          borderRadius={12}
        />
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{initial}</Text>
        </View>
        <View style={s.heroInfo}>
          <Text style={s.heroName}>{profile.name || "Aurora User"}</Text>
          <View style={[s.scoreBadge, {
            borderColor: (healthScore >= 70 ? LIME : AMBER) + "44",
            backgroundColor: (healthScore >= 70 ? LIME : AMBER) + "0E",
          }]}>
            <Text style={[s.scoreBadgeTxt, { color: healthScore >= 70 ? LIME : AMBER }]}>
              {getScoreLabel(healthScore)}
            </Text>
          </View>
        </View>
        <ScoreRing score={healthScore} />
      </View>

      {/* ── Quick stats ── */}
      <View style={s.statsRow}>
        {[
          { label: "WATER",  value: `${Math.round(hydrationPct)}%`, on: hydrationPct >= 80 },
          { label: "SLEEP",  value: avg7Sleep ? `${avg7Sleep}h` : "—", on: avg7Sleep !== null && parseFloat(avg7Sleep ?? "0") >= 7 },
          { label: "STREAK", value: `${longestStreak}d`, on: longestStreak >= 3 },
          { label: "HABITS", value: `${habitsComplete}/${habits.length}`, on: habitsComplete === habits.length && habits.length > 0 },
        ].map((item) => (
          <View key={item.label} style={[s.statCard, item.on && s.statCardOn]}>
            <Text style={[s.statValue, item.on && { color: LIME }]}>{item.value}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Companion — always visible current + tap to change ── */}
      <TouchableOpacity
        style={s.sectionRow}
        onPress={() => toggle("companion")}
        activeOpacity={0.7}
      >
        <View>
          <Text style={s.sectionLabel}>YOUR COMPANION</Text>
          <Text style={[s.sectionSub, { color: activeCompanion.accentColor }]}>
            {activeCompanion.name} · {activeCompanion.description}
          </Text>
        </View>
        <View style={s.sectionRight}>
          <PixelCompanion companionId={activeCompanion.id} mood={companionMood} size={38} />
          <Ionicons
            name={expandedSection === "companion" ? "chevron-up" : "chevron-down"}
            size={14} color={MUTED}
          />
        </View>
      </TouchableOpacity>

      {expandedSection === "companion" && (
        <View style={s.companionGrid}>
          {COMPANIONS.map((c) => {
            const active = (profile.companionType ?? "fox") === c.id;
            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  s.companionCard,
                  active && { borderColor: c.accentColor + "55", backgroundColor: c.accentColor + "0D" },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => {
                  setCompanionType(c.id);
                  setExpandedSection(null);
                }}
              >
                <PixelCompanion companionId={c.id} mood={active ? companionMood : "calm"} size={40} />
                <Text style={[s.companionName, active && { color: c.accentColor }]}>{c.name}</Text>
                {active && <View style={[s.companionDot, { backgroundColor: c.accentColor }]} />}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Aurora's vibe — collapsed by default ── */}
      <TouchableOpacity
        style={[s.sectionRow, { marginTop: 4 }]}
        onPress={() => toggle("vibe")}
        activeOpacity={0.7}
      >
        <View>
          <Text style={s.sectionLabel}>AURORA'S VIBE</Text>
          <Text style={[s.sectionSub, { color: PERSONALITY_COLOR[profile.personality] ?? MUTED }]}>
            {PERSONALITY_OPTIONS.find((p) => p.id === profile.personality)?.label ?? "Chaotic"}
          </Text>
        </View>
        <Ionicons
          name={expandedSection === "vibe" ? "chevron-up" : "chevron-down"}
          size={14} color={MUTED}
        />
      </TouchableOpacity>

      {expandedSection === "vibe" && (
        <View style={s.vibeRow}>
          {PERSONALITY_OPTIONS.map((p) => {
            const active = profile.personality === p.id;
            const col    = PERSONALITY_COLOR[p.id];
            return (
              <Pressable
                key={p.id}
                style={({ pressed }) => [
                  s.vibeChip,
                  active && { borderColor: col + "55", backgroundColor: col + "12" },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => {
                  setPersonality(p.id);
                  setExpandedSection(null);
                }}
              >
                <View style={[s.vibeDot, { backgroundColor: col }]} />
                <View>
                  <Text style={[s.vibeLabel, active && { color: "#fff" }]}>{p.label}</Text>
                  <Text style={s.vibeDesc} numberOfLines={1}>{p.description}</Text>
                </View>
                {active && <View style={[s.vibeCheck, { backgroundColor: col }]} />}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Goals ── */}
      {profile.goals.length > 0 && (
        <>
          <Text style={[s.sectionLabel, { marginTop: 20 }]}>YOUR GOALS</Text>
          <View style={s.goalRow}>
            {profile.goals.map((g) => (
              <View key={g} style={s.goalChip}>
                <Text style={s.goalTxt}>{g}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── Account ── */}
      <Text style={[s.sectionLabel, { marginTop: 20 }]}>ACCOUNT</Text>
      <View style={s.accountCard}>
        <View style={s.accountRow}>
          <Ionicons name="person-circle-outline" size={18} color={MUTED} />
          <Text style={s.accountRowTxt}>{profile.name || "Aurora User"}</Text>
        </View>
        <View style={s.accountDivider} />
        <View style={s.accountRow}>
          <Ionicons name="water-outline" size={18} color={MUTED} />
          <Text style={s.accountRowTxt}>Daily goal: {profile.waterGoalMl} ml</Text>
        </View>
      </View>

      {/* ── Log out ── */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={17} color={RED} />
        <Text style={s.logoutTxt}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: BG },
  content:  { paddingHorizontal: 16, paddingBottom: 120 },

  title: { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1.2, marginBottom: 20 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: LIME_BORDER,
    marginBottom: 10, gap: 14, overflow: "hidden",
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: LIME_DIM, borderWidth: 1.5, borderColor: LIME_BORDER,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  avatarTxt:    { color: LIME, fontSize: 20, fontWeight: "900" },
  heroInfo:     { flex: 1, gap: 6 },
  heroName:     { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  scoreBadge: {
    alignSelf: "flex-start", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
  },
  scoreBadgeTxt: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 10, paddingVertical: 12,
    paddingHorizontal: 6, alignItems: "center", gap: 3,
    borderWidth: 1, borderColor: BORDER,
  },
  statCardOn:  { borderColor: LIME_BORDER, backgroundColor: "#0C120C" },
  statValue:   { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  statLabel:   { color: MUTED, fontSize: 9, fontWeight: "700", letterSpacing: 0.6 },

  // ── Section rows (collapsible) ────────────────────────────────────────────
  sectionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    marginBottom: 8,
  },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLabel: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.4, marginBottom: 2 },
  sectionSub:   { color: SOFT, fontSize: 13, fontWeight: "600" },

  // ── Companion picker ──────────────────────────────────────────────────────
  companionGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8,
  },
  companionCard: {
    width: "30%", backgroundColor: CARD_ALT, borderRadius: 10,
    paddingVertical: 12, alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: BORDER, position: "relative",
  },
  companionName: { color: MUTED, fontSize: 11, fontWeight: "700" },
  companionDot:  { position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: 4 },

  // ── Vibe picker ───────────────────────────────────────────────────────────
  vibeRow: { gap: 6, marginBottom: 8 },
  vibeChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD_ALT, borderRadius: 10,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  vibeDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  vibeLabel: { color: SOFT, fontWeight: "700", fontSize: 14 },
  vibeDesc:  { color: MUTED, fontSize: 12, marginTop: 1 },
  vibeCheck: { width: 8, height: 8, borderRadius: 4, marginLeft: "auto" },

  // ── Goals ─────────────────────────────────────────────────────────────────
  goalRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  goalChip: {
    backgroundColor: LIME_DIM, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: LIME_BORDER,
  },
  goalTxt: { color: LIME, fontSize: 12, fontWeight: "600" },

  // ── Account ───────────────────────────────────────────────────────────────
  accountCard: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, marginBottom: 8, overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  accountRowTxt: { color: SOFT, fontSize: 14, fontWeight: "500" },
  accountDivider: { height: 1, backgroundColor: BORDER },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 16, paddingVertical: 15, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(248,113,113,0.25)",
    backgroundColor: "rgba(248,113,113,0.07)",
  },
  logoutTxt: { color: RED, fontWeight: "700", fontSize: 15 },
});
