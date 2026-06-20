import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useApp } from "../../context/AppContext";
import PixelCompanion from "../../components/PixelCompanion";
import { COMPANIONS, getMoodFromScore } from "../../lib/companion";

const BG    = "#070707";
const LIME  = "#C8FF00";
const CARD  = "#101010";
const MUTED = "rgba(255,255,255,0.38)";
const SOFT  = "rgba(255,255,255,0.72)";

// ── XP / Level ────────────────────────────────────────────────────────────────
const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

function getLevelInfo(xp: number) {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const start = XP_THRESHOLDS[level - 1] ?? 0;
  const end   = XP_THRESHOLDS[level]     ?? start + 1000;
  const current = xp - start;
  const needed  = end - start;
  return { level, current, needed, pct: (current / needed) * 100 };
}

// ── Evolution stages per companion ────────────────────────────────────────────
const EVOLUTIONS: Record<string, { label: string; minLevel: number }[]> = {
  fox:     [{ label: "Baby Fox", minLevel: 1 }, { label: "Young Fox", minLevel: 4 }, { label: "Adult Fox", minLevel: 8 }, { label: "Legend Fox", minLevel: 13 }],
  cat:     [{ label: "Kitten", minLevel: 1 }, { label: "Young Cat", minLevel: 4 }, { label: "Adult Cat", minLevel: 8 }, { label: "Legend Cat", minLevel: 13 }],
  deer:    [{ label: "Fawn", minLevel: 1 }, { label: "Young Deer", minLevel: 4 }, { label: "Stag", minLevel: 8 }, { label: "Legend Deer", minLevel: 13 }],
  shark:   [{ label: "Pup", minLevel: 1 }, { label: "Young Shark", minLevel: 4 }, { label: "Great White", minLevel: 8 }, { label: "Legend Shark", minLevel: 13 }],
  owl:     [{ label: "Owlet", minLevel: 1 }, { label: "Young Owl", minLevel: 4 }, { label: "Wise Owl", minLevel: 8 }, { label: "Legend Owl", minLevel: 13 }],
  rabbit:  [{ label: "Bunny", minLevel: 1 }, { label: "Young Rabbit", minLevel: 4 }, { label: "Swift Rabbit", minLevel: 8 }, { label: "Legend Rabbit", minLevel: 13 }],
  wolf:    [{ label: "Pup", minLevel: 1 }, { label: "Young Wolf", minLevel: 4 }, { label: "Pack Leader", minLevel: 8 }, { label: "Legend Wolf", minLevel: 13 }],
  dragon:  [{ label: "Hatchling", minLevel: 1 }, { label: "Drake", minLevel: 4 }, { label: "Dragon", minLevel: 8 }, { label: "Legend Dragon", minLevel: 13 }],
  unicorn: [{ label: "Foal", minLevel: 1 }, { label: "Young Unicorn", minLevel: 4 }, { label: "Unicorn", minLevel: 8 }, { label: "Legend Unicorn", minLevel: 13 }],
};

// ── Unlockables ───────────────────────────────────────────────────────────────
const UNLOCKABLES = [
  {
    category: "Hats",
    icon: "🎩",
    items: [
      { name: "Cap",        unlockLevel: 2  },
      { name: "Wizard Hat", unlockLevel: 6  },
      { name: "Crown",      unlockLevel: 10 },
    ],
  },
  {
    category: "Glasses",
    icon: "🕶️",
    items: [
      { name: "Shades",      unlockLevel: 5 },
      { name: "Cyber Visor", unlockLevel: 9 },
    ],
  },
  {
    category: "Backgrounds",
    icon: "🌌",
    items: [
      { name: "Forest",    unlockLevel: 3  },
      { name: "Neon City", unlockLevel: 7  },
      { name: "Space",     unlockLevel: 12 },
    ],
  },
  {
    category: "Effects",
    icon: "✨",
    items: [
      { name: "Sparkles",  unlockLevel: 4  },
      { name: "Lightning", unlockLevel: 8  },
      { name: "Rainbow",   unlockLevel: 15 },
    ],
  },
];

const XP_SOURCES = [
  { icon: "water-outline" as const,             label: "Water Goal",      xp: "+5 XP"  },
  { icon: "moon-outline" as const,              label: "Sleep Goal",      xp: "+10 XP" },
  { icon: "checkmark-circle-outline" as const,  label: "Habit Complete",  xp: "+5 XP"  },
  { icon: "trophy-outline" as const,            label: "Weekly Quest",    xp: "+15 XP" },
];

const LEVEL_REWARDS: Record<number, string> = {
  2:  "Hat: Cap",
  3:  "Background: Forest",
  4:  "Effect: Sparkles",
  5:  "Glasses: Shades",
  6:  "Hat: Wizard Hat",
  7:  "Background: Neon City",
  8:  "Effect: Lightning",
  9:  "Glasses: Cyber Visor",
  10: "Hat: Crown",
};

const MOOD_LABEL: Record<string, string> = {
  sleeping:    "Sleeping",
  tired:       "Tired",
  calm:        "Calm",
  curious:     "Curious",
  happy:       "Happy",
  excited:     "Excited",
  celebrating: "Celebrating",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CompanionScreen() {
  const insets = useSafeAreaInsets();
  const { profile, healthScore, habits, sleepHistory, hydrationPct, setCompanionType } = useApp();

  const mood      = getMoodFromScore(healthScore);
  const companion = COMPANIONS.find((c) => c.id === profile.companionType) ?? COMPANIONS[0];
  const evolutions = EVOLUTIONS[profile.companionType] ?? EVOLUTIONS.fox;

  // XP earned from real user data
  const totalXP = useMemo(() => {
    const habitXP = habits.reduce((sum, h) => sum + h.streak * 5, 0);
    const sleepXP = sleepHistory.length * 10;
    const waterXP = hydrationPct >= 100 ? 5 : 0;
    return habitXP + sleepXP + waterXP;
  }, [habits, sleepHistory, hydrationPct]);

  const { level, current, needed, pct } = getLevelInfo(totalXP);
  const nextReward = LEVEL_REWARDS[level + 1];

  // Current evolution stage
  const evoIdx = evolutions.reduce(
    (best, stage, i) => (level >= stage.minLevel ? i : best),
    0
  );
  const trackPct = evolutions.length > 1
    ? `${(evoIdx / (evolutions.length - 1)) * 100}%`
    : "0%";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18 }}
      >
        <Text style={styles.eyebrow}>Your companion</Text>
        <Text style={styles.heading}>{companion.name}</Text>
      </MotiView>

      {/* ── Main companion card ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 14, delay: 60 }}
        style={styles.companionCard}
      >
        {/* Accent glow */}
        <View style={[styles.glow, { backgroundColor: companion.accentColor + "22" }]} />

        {/* Level badge */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv {level}</Text>
        </View>

        {/* Floating companion */}
        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: -10 }}
          transition={{ type: "timing", duration: 1800, loop: true, repeatReverse: true }}
        >
          <PixelCompanion companionId={profile.companionType} mood={mood} size={160} />
        </MotiView>

        {/* Mood pill */}
        <View style={styles.moodPill}>
          <Text style={styles.moodText}>
            {companion.emoji} {MOOD_LABEL[mood] ?? mood}
          </Text>
        </View>

        {/* XP progress */}
        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpCount}>
              {current} / {needed}
            </Text>
          </View>
          <View style={styles.xpBarBg}>
            <View
              style={[
                styles.xpBarFill,
                { width: `${Math.min(Math.round(pct), 100)}%` },
              ]}
            />
          </View>
          {nextReward && (
            <Text style={styles.rewardHint}>
              Level {level + 1} Reward: {nextReward}
            </Text>
          )}
        </View>
      </MotiView>

      {/* ── XP Sources ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 140 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>XP Sources</Text>
        {XP_SOURCES.map((src) => (
          <View key={src.label} style={styles.xpRow}>
            <View style={styles.xpRowLeft}>
              <Ionicons name={src.icon} size={15} color={MUTED} />
              <Text style={styles.xpRowLabel}>{src.label}</Text>
            </View>
            <Text style={styles.xpRowVal}>{src.xp}</Text>
          </View>
        ))}
      </MotiView>

      {/* ── Evolution ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 200 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Evolution</Text>

        <View style={styles.evoWrap}>
          {/* Full track */}
          <View style={styles.evoTrack} />
          {/* Active fill */}
          {evoIdx > 0 && (
            <View style={[styles.evoTrackFill, { width: trackPct as any }]} />
          )}
          {/* Dots + labels */}
          <View style={styles.evoStages}>
            {evolutions.map((stage, i) => {
              const reached  = i <= evoIdx;
              const isCurrent = i === evoIdx;
              return (
                <View key={stage.label} style={styles.evoStage}>
                  <View
                    style={[
                      styles.evoDot,
                      reached && styles.evoDotReached,
                      isCurrent && styles.evoDotCurrent,
                    ]}
                  >
                    {isCurrent && <View style={styles.evoDotCore} />}
                  </View>
                  <Text
                    style={[styles.evoName, isCurrent && styles.evoNameCurrent]}
                    numberOfLines={2}
                  >
                    {stage.label}
                  </Text>
                  <Text style={styles.evoMinLv}>Lv {stage.minLevel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </MotiView>

      {/* ── Unlockables ── */}
      <Text style={styles.sectionTitle}>Unlockables</Text>
      {UNLOCKABLES.map((cat, ci) => (
        <MotiView
          key={cat.category}
          from={{ opacity: 0, translateX: -10 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "spring", damping: 18, delay: 260 + ci * 55 }}
          style={styles.unlockCard}
        >
          <View style={styles.unlockHeader}>
            <Text style={styles.unlockCatIcon}>{cat.icon}</Text>
            <Text style={styles.unlockCatName}>{cat.category}</Text>
          </View>
          <View style={styles.unlockItems}>
            {cat.items.map((item) => {
              const unlocked = level >= item.unlockLevel;
              return (
                <View
                  key={item.name}
                  style={[styles.unlockItem, unlocked && styles.unlockItemOn]}
                >
                  <Ionicons
                    name={unlocked ? "checkmark-circle" : "lock-closed"}
                    size={unlocked ? 14 : 12}
                    color={unlocked ? LIME : MUTED}
                  />
                  <Text
                    style={[styles.unlockItemText, unlocked && styles.unlockItemTextOn]}
                  >
                    {item.name}
                  </Text>
                  {!unlocked && (
                    <Text style={styles.unlockLvHint}>Lv {item.unlockLevel}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </MotiView>
      ))}

      {/* ── Choose companion ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 480 }}
      >
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Choose companion</Text>
        <View style={styles.grid}>
          {COMPANIONS.map((c) => {
            const active = c.id === profile.companionType;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.gridItem, active && styles.gridItemActive]}
                onPress={() => setCompanionType(c.id)}
                activeOpacity={0.75}
              >
                <PixelCompanion companionId={c.id} mood="happy" size={52} />
                <Text style={[styles.gridName, active && styles.gridNameActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </MotiView>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20 },

  eyebrow: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heading: { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1, marginBottom: 20 },

  // ── Companion card ──
  companionCard: {
    backgroundColor: CARD,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    marginBottom: 16,
    overflow: "hidden",
    gap: 14,
  },
  glow: {
    position: "absolute",
    top: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  levelBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: LIME,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  levelText: { color: "#000", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },

  moodPill: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  moodText: { color: SOFT, fontSize: 13, fontWeight: "600" },

  xpSection: { width: "100%", gap: 7 },
  xpLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  xpLabel:  { color: MUTED, fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  xpCount:  { color: SOFT, fontSize: 11, fontWeight: "700" },
  xpBarBg: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    overflow: "hidden",
  },
  xpBarFill: { height: 5, backgroundColor: LIME, borderRadius: 999 },
  rewardHint: { color: MUTED, fontSize: 10, textAlign: "center", marginTop: 2 },

  // ── Generic card ──
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 20,
    marginBottom: 16,
    gap: 13,
  },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // ── XP Sources ──
  xpRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpRowLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  xpRowLabel: { color: SOFT, fontSize: 13 },
  xpRowVal:   { color: LIME, fontSize: 13, fontWeight: "700" },

  // ── Evolution timeline ──
  evoWrap: { position: "relative", paddingTop: 4, paddingBottom: 2 },
  evoTrack: {
    position: "absolute",
    top: 14,
    left: "12.5%",
    right: "12.5%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 1,
  },
  evoTrackFill: {
    position: "absolute",
    top: 14,
    left: "12.5%",
    height: 2,
    backgroundColor: LIME,
    borderRadius: 1,
  },
  evoStages: { flexDirection: "row", justifyContent: "space-between" },
  evoStage:  { width: "25%", alignItems: "center", gap: 5 },
  evoDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  evoDotReached: {
    backgroundColor: "rgba(200,255,0,0.12)",
    borderColor: LIME,
  },
  evoDotCurrent: { backgroundColor: LIME },
  evoDotCore:    { width: 8, height: 8, borderRadius: 4, backgroundColor: "#000" },
  evoName: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 13,
  },
  evoNameCurrent: { color: "#fff", fontWeight: "700" },
  evoMinLv: { color: "rgba(255,255,255,0.22)", fontSize: 9 },

  // ── Unlockables ──
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  unlockCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  unlockHeader:  { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockCatIcon: { fontSize: 17 },
  unlockCatName: { color: "#fff", fontSize: 13, fontWeight: "700" },
  unlockItems:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unlockItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  unlockItemOn: {
    backgroundColor: "rgba(200,255,0,0.06)",
    borderColor: "rgba(200,255,0,0.28)",
  },
  unlockItemText:   { color: MUTED, fontSize: 12, fontWeight: "500" },
  unlockItemTextOn: { color: "#fff" },
  unlockLvHint:     { color: "rgba(255,255,255,0.2)", fontSize: 10 },

  // ── Companion picker grid ──
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: {
    width: "30%",
    backgroundColor: CARD,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  gridItemActive: {
    borderColor: LIME,
    backgroundColor: "rgba(200,255,0,0.05)",
  },
  gridName:       { color: MUTED, fontSize: 11, fontWeight: "500" },
  gridNameActive: { color: LIME },
});
