import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useApp } from "../../context/AppContext";
import PixelCompanion from "../../components/PixelCompanion";
import { COMPANIONS, getMoodFromScore } from "../../lib/companion";

const BG    = "#070707";
const LIME  = "#C8FF00";
const CARD  = "#101010";
const MUTED = "rgba(255,255,255,0.38)";
const SOFT  = "rgba(255,255,255,0.72)";

const MOOD_LABELS: Record<string, string> = {
  sleeping:    "Sleeping 😴",
  tired:       "Tired 😪",
  calm:        "Calm 😌",
  curious:     "Curious 👀",
  happy:       "Happy 😊",
  excited:     "Excited 🤩",
  celebrating: "Celebrating 🎉",
};

const MOOD_DESC: Record<string, string> = {
  sleeping:    "Your companion needs some love. Log water, sleep, and habits to wake them up.",
  tired:       "They're hanging in there. A few good habits will lift their spirits.",
  calm:        "Steady energy. Keep the routines going.",
  curious:     "Your companion is engaged and ready to explore with you.",
  happy:       "Great momentum! They're feeling the good vibes.",
  excited:     "On fire! Your consistency is really showing.",
  celebrating: "Peak form. You and your companion are absolutely crushing it.",
};

export default function CompanionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, healthScore, setCompanionType } = useApp();

  const mood = getMoodFromScore(healthScore);
  const companion = COMPANIONS.find((c) => c.id === profile.companionType) ?? COMPANIONS[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18 }}
      >
        <Text style={styles.eyebrow}>Your buddy</Text>
        <Text style={styles.heading}>{companion.name}</Text>
      </MotiView>

      {/* Companion display */}
      <MotiView
        from={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 14, delay: 80 }}
        style={styles.companionCard}
      >
        {/* Lime glow behind */}
        <View style={[styles.companionGlow, { backgroundColor: companion.accentColor + "18" }]} />

        <PixelCompanion
          companionId={profile.companionType}
          mood={mood}
          size={140}
        />

        {/* Mood badge */}
        <View style={styles.moodBadge}>
          <Text style={styles.moodText}>{MOOD_LABELS[mood]}</Text>
        </View>
      </MotiView>

      {/* Mood description */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 160 }}
        style={styles.moodCard}
      >
        <Text style={styles.moodDesc}>{MOOD_DESC[mood]}</Text>
      </MotiView>

      {/* Health score → mood link */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 200 }}
        style={styles.scoreRow}
      >
        <Text style={styles.scoreLabel}>Aura Score</Text>
        <Text style={styles.scoreVal}>{healthScore}<Text style={styles.scoreMax}>/100</Text></Text>
      </MotiView>

      {/* Pick a different companion */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 240 }}
      >
        <Text style={styles.sectionTitle}>Choose companion</Text>
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

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 24 },

  eyebrow: { color: MUTED, fontSize: 12, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  heading: { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1, marginBottom: 24 },

  companionCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD,
    borderRadius: 28,
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 16,
    overflow: "hidden",
    gap: 20,
  },
  companionGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  moodBadge: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  moodText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  moodCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 16,
  },
  moodDesc: { color: SOFT, fontSize: 14, lineHeight: 22 },

  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 28,
  },
  scoreLabel: { color: SOFT, fontSize: 14, fontWeight: "500" },
  scoreVal:   { color: LIME, fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  scoreMax:   { color: MUTED, fontSize: 14, fontWeight: "500" },

  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 16 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
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
  gridName: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "500",
  },
  gridNameActive: {
    color: LIME,
  },
});
