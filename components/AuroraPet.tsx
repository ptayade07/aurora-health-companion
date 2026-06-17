import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../lib/theme";
import { useApp } from "../context/AppContext";
import PixelCompanion from "./PixelCompanion";

type Props = {
  size?: number;
  label?: string;
  message?: string;
  healthScore?: number;
};

export default function AuroraPet({ size = 80, label, message, healthScore }: Props) {
  const { profile, companionMood } = useApp();
  const companionId = profile.companionType ?? "fox";

  return (
    <View style={styles.container}>
      <View style={styles.glow}>
        <PixelCompanion companionId={companionId} mood={companionMood} size={size} />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {healthScore !== undefined ? (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Health {healthScore}/100</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: spacing.md },
  glow: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.purple,
  },
  label: {
    color: colors.purpleLight,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  message: {
    color: colors.textSoft,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  scoreBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.purpleDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  scoreText: { color: colors.text, fontSize: 12, fontWeight: "600" },
});
