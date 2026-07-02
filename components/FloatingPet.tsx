import { useRef, useEffect, useState, useCallback } from "react";
import {
  Animated,
  PanResponder,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import * as Speech from "expo-speech";
import { useApp } from "../context/AppContext";
import { BOUNCE_PARAMS, MOVE_INTERVAL } from "../lib/companion";
import PixelCompanion from "./PixelCompanion";

const { width, height } = Dimensions.get("window");

const SAFE_X = { min: 16, max: width - 100 };
const SAFE_Y = { min: 80,  max: height - 220 };

const ROASTS: Record<string, string[]> = {
  chaotic: [
    "Hi bestie. Still hydrated? No? Thought so.",
    "Your sleep schedule filed a missing persons report.",
    "One habit done. Your ancestors are somewhat proud.",
    "Water called. It said you've been ignoring it.",
    "We're thriving. Sort of. Mostly vibing.",
  ],
  supportive: [
    "You're doing great! Keep it up!",
    "Every sip of water is a win. I see you.",
    "Your consistency is actually inspiring.",
    "Rest is productive too. You're doing amazing.",
    "Small steps add up. I'm proud of you!",
  ],
  brutal: [
    "Be honest. Did water even exist today?",
    "Your habits called. They went to voicemail.",
    "Decorative cactus energy, hydration-wise.",
    "Sleep schedule? Never heard of her.",
    "Bold of you to open this app.",
  ],
};

function randomSafePos() {
  return {
    x: SAFE_X.min + Math.random() * (SAFE_X.max - SAFE_X.min),
    y: SAFE_Y.min + Math.random() * (SAFE_Y.max - SAFE_Y.min),
  };
}

export default function FloatingPet() {
  const { profile, healthScore, companionMood } = useApp();
  const companionId = profile.companionType ?? "fox";

  // ── position ──────────────────────────────────────────────────────────────
  const posX = useRef(new Animated.Value(width - 96)).current;
  const posY = useRef(new Animated.Value(height - 260)).current;
  const curX = useRef(width - 96);
  const curY = useRef(height - 260);

  useEffect(() => {
    const lX = posX.addListener(({ value }) => { curX.current = value; });
    const lY = posY.addListener(({ value }) => { curY.current = value; });
    return () => { posX.removeListener(lX); posY.removeListener(lY); };
  }, []);

  // ── bounce ────────────────────────────────────────────────────────────────
  const bounceY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const { amplitude, duration } = BOUNCE_PARAMS[companionMood];
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -amplitude, duration, useNativeDriver: false }),
        Animated.timing(bounceY, { toValue: 0,          duration, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [companionMood]);

  // ── glow pulse ────────────────────────────────────────────────────────────
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // ── scale on tap ──────────────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── autonomous movement ───────────────────────────────────────────────────
  const isDragging = useRef(false);
  const autoAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const moveToPos = useCallback((x: number, y: number, duration = 2500) => {
    autoAnimRef.current?.stop();
    autoAnimRef.current = Animated.parallel([
      Animated.timing(posX, { toValue: x, duration, useNativeDriver: false }),
      Animated.timing(posY, { toValue: y, duration, useNativeDriver: false }),
    ]);
    autoAnimRef.current.start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging.current) {
        const { x, y } = randomSafePos();
        moveToPos(x, y);
      }
    }, MOVE_INTERVAL[companionMood]);
    return () => clearInterval(interval);
  }, [companionMood, moveToPos]);

  // ── drag ──────────────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = true;
        autoAnimRef.current?.stop();
        posX.setOffset(curX.current);
        posY.setOffset(curY.current);
        posX.setValue(0);
        posY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: posX, dy: posY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        posX.flattenOffset();
        posY.flattenOffset();
        isDragging.current = false;
      },
    })
  ).current;

  // ── speech bubble ─────────────────────────────────────────────────────────
  const [isTalking, setIsTalking] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    if (isTalking) return;
    const lines = ROASTS[profile.personality] ?? ROASTS.chaotic;
    const line = lines[Math.floor(Math.random() * lines.length)];

    setBubble(line);
    setIsTalking(true);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.25, duration: 100, useNativeDriver: false }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: false }),
    ]).start();

    Speech.speak(line, {
      rate: 0.9,
      onDone: () => setIsTalking(false),
      onError: () => setIsTalking(false),
    });

    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 4200);
  };

  // ── glow color ────────────────────────────────────────────────────────────
  const glowColor =
    healthScore >= 80 ? "#C8FF00"
    : healthScore >= 60 ? "#A3E635"
    : healthScore >= 40 ? "#FACC15"
    : "#F87171";

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [
            { translateX: posX },
            { translateY: Animated.add(posY, bounceY) },
            { scale: scaleAnim },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {bubble && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{bubble}</Text>
          <View style={styles.bubbleTail} />
        </View>
      )}

      <TouchableOpacity onPress={handleTap} activeOpacity={0.85}>
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: glowColor, opacity: glowAnim, shadowColor: glowColor },
          ]}
        />
        <View style={[styles.petCircle, { borderColor: glowColor }]}>
          <PixelCompanion
            companionId={companionId}
            mood={companionMood}
            size={52}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    width: 72,
    alignItems: "center",
    zIndex: 999,
  },
  glow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
  },
  petCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    margin: 4,
  },
  bubble: {
    backgroundColor: "#141414",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    maxWidth: 180,
    borderWidth: 1,
    borderColor: "rgba(200,255,0,0.25)",
    alignSelf: "center",
    position: "relative",
  },
  bubbleText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  bubbleTail: {
    position: "absolute",
    bottom: -7,
    left: "50%",
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: "#141414",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(200,255,0,0.25)",
    transform: [{ rotate: "45deg" }],
  },
});
