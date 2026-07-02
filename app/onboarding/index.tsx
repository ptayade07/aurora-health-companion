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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { PERSONALITY_OPTIONS } from "../../lib/personality";
import type { PersonalityMode } from "../../lib/personality";
import { COMPANIONS } from "../../lib/companion";
import type { CompanionType } from "../../lib/companion";
import PixelCompanion from "../../components/PixelCompanion";

// ── Palette ───────────────────────────────────────────────────────────────────
const BG          = "#070707";
const CARD        = "#101010";
const BORDER      = "rgba(255,255,255,0.08)";
const LIME        = "#C8FF00";
const LIME_DIM    = "rgba(200,255,0,0.10)";
const LIME_BORDER = "rgba(200,255,0,0.25)";
const WHITE       = "#FFFFFF";
const MUTED       = "rgba(255,255,255,0.38)";
const SOFT        = "rgba(255,255,255,0.65)";

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
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Progress */}
      <Text style={s.progress}>Step {step + 1} of {TOTAL_STEPS}</Text>
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* Step 0 — Name */}
      {step === 0 && (
        <>
          <Text style={s.title}>What should Aurora{"\n"}call you?</Text>
          <TextInput
            style={s.input}
            placeholder="Your name"
            placeholderTextColor={MUTED}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </>
      )}

      {/* Step 1 — Goals + Water */}
      {step === 1 && (
        <>
          <Text style={s.title}>Pick your goals</Text>
          <View style={s.chips}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[s.chip, goals.includes(g) && s.chipActive]}
                onPress={() => toggleGoal(g)}
              >
                <Text style={[s.chipText, goals.includes(g) && s.chipTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.title, { marginTop: 24, fontSize: 18 }]}>Daily water goal (ml)</Text>
          <TextInput
            style={s.input}
            placeholder="2500"
            placeholderTextColor={MUTED}
            value={waterGoal}
            onChangeText={setWaterGoal}
            keyboardType="numeric"
          />
        </>
      )}

      {/* Step 2 — Companion */}
      {step === 2 && (
        <>
          <Text style={s.title}>Choose your{"\n"}companion</Text>
          <Text style={s.subtitle}>They'll follow you everywhere and reflect your progress.</Text>
          <View style={s.companionGrid}>
            {COMPANIONS.map((c) => {
              const selected = companion === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[s.companionCard, selected && s.companionCardActive]}
                  onPress={() => setCompanion(c.id)}
                  activeOpacity={0.75}
                >
                  <View style={[s.companionPreview, selected && { borderColor: LIME }]}>
                    <PixelCompanion companionId={c.id} mood="happy" size={52} />
                  </View>
                  <Text style={[s.companionName, selected && { color: LIME }]}>
                    {c.name}
                  </Text>
                  <Text style={s.companionDesc}>{c.description}</Text>
                  {selected && <View style={s.selectedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Step 3 — Personality */}
      {step === 3 && (
        <>
          <Text style={s.title}>Choose Aurora's{"\n"}vibe</Text>
          <Text style={s.subtitle}>This controls how she talks to you.</Text>
          {PERSONALITY_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[s.personalityCard, personality === p.id && s.personalityActive]}
              onPress={() => setPersonality(p.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.personalityLabel}>{p.label}</Text>
                <Text style={s.personalityDesc}>{p.description}</Text>
              </View>
              {personality === p.id && <Ionicons name="checkmark" size={20} color={LIME} />}
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={[s.button, saving && s.buttonDisabled]}
        disabled={saving}
        onPress={() => {
          if (step < TOTAL_STEPS - 1) setStep(step + 1);
          else finish();
        }}
      >
        {saving ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={s.buttonText}>
            {step < TOTAL_STEPS - 1 ? "Continue" : "Let's Go"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content:   { padding: 32, paddingTop: 60, paddingBottom: 48 },

  progress: { color: MUTED, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 },
  progressBar: {
    height: 3,
    backgroundColor: BORDER,
    borderRadius: 2,
    marginBottom: 36,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: LIME, borderRadius: 2 },

  title:    { color: WHITE, fontSize: 32, fontWeight: "800", letterSpacing: -1.2, lineHeight: 38, marginBottom: 16 },
  subtitle: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 20 },

  input: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: WHITE,
    fontSize: 16,
  },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive:     { borderColor: LIME, backgroundColor: LIME_DIM },
  chipText:       { color: MUTED, fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: LIME, fontWeight: "600" },

  companionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  companionCard: {
    width: "30%",
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
    position: "relative",
  },
  companionCardActive: { borderColor: LIME, backgroundColor: LIME_DIM },
  companionPreview: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 6,
  },
  companionName: { color: SOFT, fontWeight: "700", fontSize: 12, marginBottom: 2 },
  companionDesc: { color: MUTED, fontSize: 9, textAlign: "center" },
  selectedDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LIME,
  },

  personalityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  personalityActive: { borderColor: LIME_BORDER, backgroundColor: LIME_DIM },
  personalityLabel:  { color: WHITE, fontWeight: "700", fontSize: 15 },
  personalityDesc:   { color: MUTED, fontSize: 13, marginTop: 2 },

  button: {
    backgroundColor: LIME,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#000", fontWeight: "800", fontSize: 16 },
});
