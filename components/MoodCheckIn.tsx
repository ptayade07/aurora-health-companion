import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Mood } from "../lib/types";
import React from "react";

const CARD  = "#101010";
const LIME  = "#C8FF00";
const MUTED = "rgba(255,255,255,0.38)";
const BORDER = "rgba(255,255,255,0.08)";

const MOODS: { id: Mood; icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }[] = [
  { id: "dead_inside", icon: "remove-circle-outline", label: "Dead Inside" },
  { id: "sleepy",      icon: "moon-outline",          label: "Sleepy" },
  { id: "fine",        icon: "happy-outline",          label: "Fine" },
  { id: "slaying",     icon: "flash-outline",          label: "Slaying" },
  { id: "unstoppable", icon: "flame-outline",          label: "Unstoppable" },
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
            <Ionicons
              name={m.icon}
              size={22}
              color={selected === m.id ? LIME : MUTED}
            />
            <Text style={styles.label}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minWidth: 64,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: {
    borderWidth: 1,
    borderColor: "rgba(200,255,0,0.40)",
    backgroundColor: "rgba(200,255,0,0.08)",
  },
  label: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
});
