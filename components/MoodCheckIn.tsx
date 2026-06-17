import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../lib/theme";
import type { Mood } from "../lib/types";

const MOODS: { id: Mood; emoji: string; label: string }[] = [
  { id: "dead_inside", emoji: "😭", label: "Dead Inside" },
  { id: "sleepy", emoji: "😴", label: "Sleepy" },
  { id: "fine", emoji: "🙂", label: "Fine" },
  { id: "slaying", emoji: "😎", label: "Slaying" },
  { id: "unstoppable", emoji: "🔥", label: "Unstoppable" },
];

type Props = {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
};

export default function MoodCheckIn({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are we feeling today?</Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.chip, selected === m.id && styles.chipActive]}
            onPress={() => onSelect(m.id)}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={styles.label}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    alignItems: "center",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 64,
  },
  chipActive: {
    borderWidth: 2,
    borderColor: colors.purple,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
});
