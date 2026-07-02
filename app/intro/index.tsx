import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useApp } from "../../context/AppContext";

const { width } = Dimensions.get("window");

// ── Theme ──────────────────────────────────────────────────────────────────────
const BG   = "#070707";
const LIME = "#C8FF00";

type Slide = {
  num: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    num: "01",
    icon: "planet-outline",
    title: "Understand\nyourself better\nevery day.",
    subtitle: "Meet Aurora — your slightly unhinged health best friend.",
  },
  {
    num: "02",
    icon: "water-outline",
    title: "Track water,\nsleep, habits\n& more.",
    subtitle: "Not boring charts. Actual vibes.",
  },
  {
    num: "03",
    icon: "mic-outline",
    title: "Talk to Aurora.\nShe actually\nlistens.",
    subtitle: "Voice AI that logs your health and roasts you lovingly.",
  },
  {
    num: "04",
    icon: "trending-up-outline",
    title: "Build routines\nthat actually\nstick.",
    subtitle: "Quests, streaks, and a companion that cares.",
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setIntroSeen } = useApp();
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    setIntroSeen();
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  };

  const prev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>Aurora</Text>
        <TouchableOpacity onPress={finish} hitSlop={12} activeOpacity={0.6}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots — lime active, muted inactive */}
      <View style={styles.progressTrack}>
        {SLIDES.map((_, i) => (
          <MotiView
            key={i}
            animate={{
              width: i === index ? 28 : 6,
              backgroundColor: i <= index ? LIME : "rgba(255,255,255,0.16)",
            }}
            transition={{ type: "spring", damping: 18 }}
            style={styles.progressDot}
          />
        ))}
      </View>

      {/* Slide content — key change forces remount + from/animate replay */}
      <View style={styles.slideArea} pointerEvents="none">
        <MotiView
          key={`slide-${index}`}
          from={{ opacity: 0, translateY: 22 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 140 }}
          style={styles.slideContent}
        >
          {/* Slide number */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 280, delay: 60 }}
          >
            <Text style={styles.slideNum}>{slide.num}</Text>
          </MotiView>

          {/* Icon */}
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 13, stiffness: 160, delay: 60 }}
            style={styles.iconWrap}
          >
            <Ionicons name={slide.icon} size={48} color={LIME} />
          </MotiView>

          {/* Title */}
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 160, delay: 90 }}
          >
            <Text style={styles.title}>{slide.title}</Text>
          </MotiView>

          {/* Subtitle */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 380, delay: 200 }}
          >
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </MotiView>
        </MotiView>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        {index > 0 && (
          <Pressable onPress={prev} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        )}

        <TouchableOpacity
          style={styles.cta}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isLast ? "Get Started →" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 1,
  },
  brand: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  skip: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 14,
    fontWeight: "500",
  },

  progressTrack: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 6,
    marginBottom: 4,
    zIndex: 1,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },

  slideArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 1,
  },
  slideContent: {
    gap: 0,
  },
  slideNum: {
    color: LIME,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 20,
    textTransform: "uppercase",
  },
  iconWrap: {
    marginBottom: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -2,
    lineHeight: 50,
    marginBottom: 18,
  },
  subtitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },

  footer: {
    paddingHorizontal: 28,
    gap: 14,
    zIndex: 1,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 18,
    fontWeight: "600",
  },
  cta: {
    backgroundColor: LIME,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
