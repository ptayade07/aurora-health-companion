import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";

const { width } = Dimensions.get("window");

const LIME = "#C8FF00";
const BG   = "#070707";

const SLIDES = [
  {
    num: "01",
    title: "Understand\nyourself better\nevery day.",
    subtitle: "Meet Aurora — your slightly unhinged health best friend.",
  },
  {
    num: "02",
    title: "Track water,\nsleep, habits\n& more.",
    subtitle: "Not boring charts. Actual vibes.",
  },
  {
    num: "03",
    title: "Talk to Aurora.\nShe actually\nlistens.",
    subtitle: "Voice AI that logs your health and roasts you lovingly.",
  },
  {
    num: "04",
    title: "Build routines\nthat actually\nstick.",
    subtitle: "Quests, streaks, and a companion that cares.",
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setIntroSeen } = useApp();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const finish = () => {
    setIntroSeen();
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 24 }]}>
      {/* ── Slide counter top-right ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.brand}>Aurora</Text>
        {index < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Slides ── */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Slide number */}
            <Text style={styles.slideNum}>{item.num}</Text>
            {/* Large editorial title */}
            <Text style={styles.title}>{item.title}</Text>
            {/* Subtitle */}
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.button} onPress={next} activeOpacity={0.85}>
          <Text style={styles.buttonText}>
            {index < SLIDES.length - 1 ? "Next" : "Get Started"}
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
    paddingBottom: 8,
  },
  brand: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  skip: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 14,
    fontWeight: "500",
  },

  slide: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingBottom: 40,
  },
  slideNum: {
    color: LIME,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -2,
    lineHeight: 50,
    marginBottom: 20,
  },
  subtitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },

  footer: {
    paddingHorizontal: 28,
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dotActive: {
    width: 24,
    backgroundColor: LIME,
    borderRadius: 3,
  },
  button: {
    backgroundColor: LIME,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
