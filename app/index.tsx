import { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useApp } from "../context/AppContext";

const { width, height } = Dimensions.get("window");

const BG   = "#070707";
const LIME = "#C8FF00";

const STARS = [
  { x: 0.12, y: 0.08, size: 2 },
  { x: 0.80, y: 0.06, size: 1.5 },
  { x: 0.92, y: 0.20, size: 2 },
  { x: 0.05, y: 0.30, size: 1.5 },
  { x: 0.94, y: 0.48, size: 2 },
  { x: 0.04, y: 0.60, size: 2.5 },
  { x: 0.88, y: 0.70, size: 1.5 },
  { x: 0.18, y: 0.78, size: 2 },
  { x: 0.72, y: 0.84, size: 2 },
  { x: 0.44, y: 0.07, size: 1.5 },
  { x: 0.58, y: 0.92, size: 2 },
  { x: 0.33, y: 0.88, size: 1.5 },
  { x: 0.62, y: 0.13, size: 2 },
  { x: 0.26, y: 0.17, size: 1.5 },
];

export default function SplashScreen() {
  const router = useRouter();
  const { introSeen, loggedIn, profile } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!introSeen) router.replace("/intro");
      else if (!loggedIn) router.replace("/(auth)/login");
      else if (!profile.onboarded) router.replace("/onboarding");
      else router.replace("/(tabs)");
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      {/* Ambient star field */}
      {STARS.map((s, i) => (
        <MotiView
          key={i}
          from={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ loop: true, type: "timing", duration: 1600 + i * 180, delay: i * 100 }}
          style={[
            styles.star,
            { top: s.y * height, left: s.x * width, width: s.size, height: s.size, borderRadius: s.size },
          ]}
        />
      ))}

      {/* Lime glow behind wordmark */}
      <MotiView
        from={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 1400 }}
        style={styles.glowWrap}
      >
        <View style={styles.glow} />
      </MotiView>

      {/* Center */}
      <View style={styles.center}>
        {/* Lime diamond */}
        <MotiView
          from={{ opacity: 0, scale: 0.2, rotate: "-60deg" }}
          animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
          transition={{ type: "spring", damping: 11, delay: 200 }}
        >
          <View style={styles.sparkle} />
        </MotiView>

        {/* Wordmark */}
        <MotiView
          from={{ opacity: 0, translateY: 28 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 130, delay: 360 }}
        >
          <Text style={styles.wordmark}>Aurora</Text>
        </MotiView>

        {/* Tagline */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 600, delay: 860 }}
        >
          <Text style={styles.tagline}>your wellness companion</Text>
        </MotiView>
      </View>

      {/* Lime loading dots */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 1500 }}
        style={styles.dotsRow}
      >
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.2, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ loop: true, type: "timing", duration: 650, delay: i * 200 }}
            style={styles.dot}
          />
        ))}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    position: "absolute",
    backgroundColor: "#fff",
  },

  glowWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: LIME,
    opacity: 0.07,
  },

  center: {
    alignItems: "center",
    gap: 4,
  },
  sparkle: {
    width: 10,
    height: 10,
    backgroundColor: LIME,
    transform: [{ rotate: "45deg" }],
    marginBottom: 16,
  },
  wordmark: {
    color: "#FFFFFF",
    fontSize: 68,
    fontWeight: "800",
    letterSpacing: -3.5,
  },
  tagline: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginTop: 6,
  },

  dotsRow: {
    position: "absolute",
    bottom: 88,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIME,
  },
});
