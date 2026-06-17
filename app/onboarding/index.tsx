import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { PERSONALITY_OPTIONS } from "../../lib/personality";
import type { PersonalityMode } from "../../lib/personality";
import { COMPANIONS } from "../../lib/companion";
import type { CompanionType } from "../../lib/companion";
import { colors, spacing, radius } from "../../lib/theme";
import PixelCompanion from "../../components/PixelCompanion";

const GOALS = [
  "Improve Hydration",
  "Sleep Better",
  "Build Better Habits",
  "Eat Healthier",
  "Improve Energy",
  "Improve Consistency",
];

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [waterGoal, setWaterGoal] = useState("2500");
  const [companion, setCompanion] = useState<CompanionType>("fox");
  const [personality, setPersonality] = useState<PersonalityMode>("chaotic");
  const [saving, setSaving] = useState(false);

  const toggleGoal = (g: string) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const finish = async () => {
    setSaving(true);
    await completeOnboarding({
      name: name.trim() || "Bestie",
      goals,
      waterGoalMl: parseInt(waterGoal, 10) || 2500,
      personality,
      companionType: companion,
    });
    setSaving(false);
    router.replace("/(tabs)");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.progress}>Step {step + 1} of {TOTAL_STEPS}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {step === 0 && (
        <>
          <Text style={styles.title}>What should Aurora call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.title}>Pick your goals</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, goals.includes(g) && styles.chipActive]}
                onPress={() => toggleGoal(g)}
              >
                <Text style={[styles.chipText, goals.includes(g) && styles.chipTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.title, { marginTop: spacing.lg }]}>Daily water goal (ml)</Text>
          <TextInput
            style={styles.input}
            placeholder="2500"
            placeholderTextColor={colors.textMuted}
            value={waterGoal}
            onChangeText={setWaterGoal}
            keyboardType="numeric"
          />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.title}>Choose your companion</Text>
          <Text style={styles.subtitle}>
            They'll follow you everywhere and reflect your progress.
          </Text>
          <View style={styles.companionGrid}>
            {COMPANIONS.map((c) => {
              const selected = companion === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.companionCard, selected && styles.companionCardActive]}
                  onPress={() => setCompanion(c.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.companionPreview, selected && { borderColor: c.accentColor }]}>
                    <PixelCompanion companionId={c.id} mood="happy" size={52} />
                  </View>
                  <Text style={[styles.companionName, selected && { color: c.accentColor }]}>
                    {c.name}
                  </Text>
                  <Text style={styles.companionDesc}>{c.description}</Text>
                  {selected && (
                    <View style={[styles.selectedDot, { backgroundColor: c.accentColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.title}>Choose Aurora's vibe</Text>
          <Text style={styles.subtitle}>This controls how she talks to you.</Text>
          {PERSONALITY_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.personalityCard, personality === p.id && styles.personalityActive]}
              onPress={() => setPersonality(p.id)}
            >
              <Text style={styles.personalityEmoji}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.personalityLabel}>{p.label}</Text>
                <Text style={styles.personalityDesc}>{p.description}</Text>
              </View>
              {personality === p.id && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </>
      )}

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        disabled={saving}
        onPress={() => {
          if (step < TOTAL_STEPS - 1) setStep(step + 1);
          else finish();
        }}
      >
        {saving ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>
            {step < TOTAL_STEPS - 1 ? "Continue" : "Let's Go ✨"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { padding: spacing.xl, paddingTop: 60, paddingBottom: 40 },
  progress:  { color: colors.textMuted, marginBottom: spacing.sm, fontSize: 13 },
  progressBar: {
    height: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 2,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.purple, borderRadius: 2 },
  title:    { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: spacing.md },
  subtitle: { color: colors.textMuted, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bgElevated,
  },
  chipActive:     { borderColor: colors.purple, backgroundColor: colors.purpleDark },
  chipText:       { color: colors.textMuted, fontSize: 14 },
  chipTextActive: { color: colors.text },

  companionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  companionCard: {
    width: "30%",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: spacing.sm,
    position: "relative",
  },
  companionCardActive: { borderColor: colors.purple },
  companionPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: spacing.xs,
  },
  companionName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 2,
  },
  companionDesc: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: "center",
  },
  selectedDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  personalityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  personalityActive:  { borderColor: colors.purple },
  personalityEmoji:   { fontSize: 28 },
  personalityLabel:   { color: colors.text, fontWeight: "700", fontSize: 16 },
  personalityDesc:    { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  check: { color: colors.purple, fontSize: 20, fontWeight: "800" },

  button: {
    backgroundColor: colors.purple,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
    height: 52,
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.text, fontWeight: "700", fontSize: 16 },
});
