import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius, spacing } from "../lib/theme";

type Props = {
  title: string;
  value?: string;
  subtitle?: string;
  emoji?: string;
  onPress?: () => void;
  accent?: boolean;
};

export default function HealthCard({
  title,
  value,
  subtitle,
  emoji,
  onPress,
  accent,
}: Props) {
  const content = (
    <View style={[styles.card, accent && styles.accent]}>
      <View style={styles.header}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  accent: {
    borderWidth: 1,
    borderColor: colors.purple,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    color: colors.purpleLight,
    fontSize: 28,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
});
