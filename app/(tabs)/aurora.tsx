import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Animated, Platform,
  KeyboardAvoidingView, Dimensions, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from "expo-audio";
import { MotiView } from "moti";
import { useApp } from "../../context/AppContext";
import { chatWithAurora, transcribeAudio } from "../../lib/groq";
import { COMPANIONS } from "../../lib/companion";
import PixelCompanion from "../../components/PixelCompanion";
import type { NutritionEntry, SleepEntry } from "../../lib/types";

const { width } = Dimensions.get("window");
const LIME   = "#C8FF00";
const BG     = "#070707";
const CARD   = "#101010";
const CARD2  = "#141414";
const MUTED  = "rgba(255,255,255,0.36)";
const SOFT   = "rgba(255,255,255,0.65)";
const BORDER = "rgba(255,255,255,0.07)";
const LIME_DIM    = "rgba(200,255,0,0.08)";
const LIME_BORDER = "rgba(200,255,0,0.22)";

// ── Types ─────────────────────────────────────────────────────────────────────
type Message     = { role: "user" | "aurora"; text: string };
type Status      = "idle" | "thinking" | "speaking" | "recording";
type Mode        = "home" | "chat" | "voice";
type ChatSession = { id: string; createdAt: number; messages: Message[] };

const SESSIONS_KEY = "aurora_chat_sessions";

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 2)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function loadSessions(): Promise<ChatSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function persistSessions(sessions: ChatSession[]) {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {}
}

// ── Insight generator ─────────────────────────────────────────────────────────
function generateInsights(
  sleepHistory: SleepEntry[],
  waterMl: number,
  waterGoalMl: number,
  habitsCompleted: number,
  habitsTotal: number,
  habits: { streak: number; name: string }[],
): string[] {
  const out: string[] = [];

  // Sleep trend: this week vs prior week
  const last7  = sleepHistory.slice(-7);
  const prior7 = sleepHistory.slice(-14, -7);
  if (last7.length >= 3 && prior7.length >= 3) {
    const avg7     = last7.reduce((s, e) => s + e.hours, 0) / last7.length;
    const avgPrior = prior7.reduce((s, e) => s + e.hours, 0) / prior7.length;
    const diff     = ((avg7 - avgPrior) / avgPrior) * 100;
    if (Math.abs(diff) >= 5) {
      const dir = diff > 0 ? "improved" : "down";
      out.push(`Sleep ${dir} ${Math.abs(Math.round(diff))}% this week`);
    } else if (avg7 >= 7) {
      out.push(`Averaging ${avg7.toFixed(1)}h sleep — right in the zone`);
    }
  } else if (last7.length >= 1) {
    const avg = last7.reduce((s, e) => s + e.hours, 0) / last7.length;
    out.push(`Sleep average: ${avg.toFixed(1)}h over ${last7.length} night${last7.length > 1 ? "s" : ""}`);
  }

  // Water
  const waterPct = Math.round((waterMl / waterGoalMl) * 100);
  const hour     = new Date().getHours();
  if (waterPct < 40 && hour >= 12) {
    out.push(`Water down — only ${waterPct}% of goal hit so far`);
  } else if (waterPct >= 100) {
    out.push(`Hydration goal crushed today`);
  } else if (waterPct >= 60) {
    out.push(`Water at ${waterPct}% — almost there`);
  }

  // Sleep–mood correlation (static data insight)
  const goodSleepDays = last7.filter((e) => e.hours >= 7);
  if (goodSleepDays.length >= 3) {
    out.push(`Mood highest on days with 7h+ sleep`);
  }

  // Best habit streak
  const best = habits.reduce((m, h) => (h.streak > m.streak ? h : m), { streak: 0, name: "" });
  if (best.streak >= 5) {
    out.push(`${best.name}: ${best.streak}-day streak`);
  }

  // Habits today
  if (habitsTotal > 0 && habitsCompleted === habitsTotal) {
    out.push(`All ${habitsTotal} habits done today`);
  } else if (habitsTotal > 0 && habitsCompleted > 0) {
    out.push(`${habitsCompleted} of ${habitsTotal} habits complete`);
  }

  return out.slice(0, 3);
}

// ── VoiceWave ─────────────────────────────────────────────────────────────────
function VoiceWave({ active }: { active: boolean }) {
  const anims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    if (active) {
      const loops = anims.map((a, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 90),
            Animated.timing(a, { toValue: 1,   duration: 300, useNativeDriver: true }),
            Animated.timing(a, { toValue: 0.2, duration: 300, useNativeDriver: true }),
          ])
        )
      );
      loops.forEach((l) => l.start());
      return () => loops.forEach((l) => l.stop());
    }
    anims.forEach((a) =>
      Animated.timing(a, { toValue: 0.2, duration: 180, useNativeDriver: true }).start()
    );
  }, [active]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, height: 36 }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: LIME, transform: [{ scaleY: a }] }}
        />
      ))}
    </View>
  );
}

// ── AuroraSphere (voice mode only) ────────────────────────────────────────────
function AuroraSphere({ pulse }: { pulse: Animated.Value }) {
  return (
    <Animated.View style={[s.sphereWrap, { transform: [{ scale: pulse }] }]}>
      <View style={[s.ring, { width: 220, height: 220, borderRadius: 110 }]} />
      <View style={[s.ring, { width: 160, height: 160, borderRadius: 80,  borderColor: "rgba(255,255,255,0.10)" }]} />
      <View style={[s.ring, { width: 96,  height: 96,  borderRadius: 48,  borderColor: "rgba(255,255,255,0.14)" }]} />
      <View style={[s.ring, { width: 36,  height: 36,  borderRadius: 12,  borderColor: LIME, opacity: 0.45 }]} />
      <View style={s.lineH} />
      <View style={s.lineV} />
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function AuroraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    profile, stats, habits, sleepHistory, healthScore, companionMood,
    addWater, logSleep, addHabit, addNutrition, setMood,
  } = useApp();

  const [mode,      setMode]      = useState<Mode>("home");
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [sessions,  setSessions]  = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status,    setStatus]    = useState<Status>("idle");
  const [inputText, setInputText] = useState("");

  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();
  const handledPromptRef  = useRef<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const inputRef  = useRef<TextInput>(null);
  const statusRef = useRef<Status>("idle");

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => { statusRef.current = status; }, [status]);

  useEffect(() => { loadSessions().then(setSessions); }, []);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== handledPromptRef.current) {
      handledPromptRef.current = String(initialPrompt);
      setMode("chat");
      const t = setTimeout(() => processMessage(String(initialPrompt), false), 350);
      return () => clearTimeout(t);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (mode !== "voice") {
      Speech.stop();
      if (statusRef.current === "recording") {
        recorder.stop().catch(() => {});
        setStatus("idle");
      }
    }
  }, [mode]);

  useEffect(() => {
    if (status === "thinking" || status === "speaking" || status === "recording") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.07, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [status]);

  // ── Session management ────────────────────────────────────────────────────
  const saveCurrentSession = useCallback((msgs: Message[]) => {
    if (msgs.length === 0) return;
    setSessions((prev) => {
      let updated: ChatSession[];
      if (sessionId) {
        updated = prev.map((s) => s.id === sessionId ? { ...s, messages: msgs } : s);
        if (!updated.find((s) => s.id === sessionId)) {
          updated = [{ id: sessionId, createdAt: Date.now(), messages: msgs }, ...prev];
        }
      } else {
        const newId = Date.now().toString();
        updated = [{ id: newId, createdAt: Date.now(), messages: msgs }, ...prev];
        setSessionId(newId);
      }
      persistSessions(updated);
      return updated.slice(0, 20);
    });
  }, [sessionId]);

  const goHome = useCallback(() => {
    saveCurrentSession(messages);
    setMode("home");
  }, [messages, saveCurrentSession]);

  const startNewChat = useCallback(() => {
    saveCurrentSession(messages);
    setMessages([]);
    setSessionId(null);
    setInputText("");
    setMode("chat");
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [messages, saveCurrentSession]);

  const openSession = (session: ChatSession) => {
    setMessages(session.messages);
    setSessionId(session.id);
    setMode("chat");
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persistSessions(updated);
      return updated;
    });
  };

  // ── AI pipeline ───────────────────────────────────────────────────────────
  const buildCtx = () => ({
    name:            profile.name || "friend",
    personality:     profile.personality,
    waterMl:         stats.waterMl,
    waterGoalMl:     profile.waterGoalMl,
    sleepHours:      stats.sleepHours,
    habitsCompleted: stats.habitsCompleted,
    habitsTotal:     stats.habitsTotal,
    habits:          habits.map((h) => ({ name: h.name, completedToday: h.completedToday })),
    mealsLogged:     stats.mealsLogged,
    mood:            stats.mood,
  });

  const applyAction = (res: any) => {
    const a = res.action;
    if (a.type === "add_water"    && a.ml)      addWater(a.ml);
    if (a.type === "log_sleep"    && a.hours)    logSleep(a.hours);
    if (a.type === "create_habit" && a.name)     addHabit(a.name, a.icon ?? "⭐");
    if (a.type === "log_meal"     && a.mealType) addNutrition(a.mealType as NutritionEntry["mealType"], a.description);
    if (a.type === "set_mood"     && a.mood)     setMood(a.mood);
  };

  const processMessage = useCallback(
    async (text: string, speakBack = false) => {
      if (!text.trim() || status !== "idle") return;
      const history = messages;
      const userMsg: Message = { role: "user", text: text.trim() };
      setMessages((m) => [...m, userMsg]);
      setInputText("");
      setStatus("thinking");
      try {
        const res = await chatWithAurora(text.trim(), buildCtx(), history);
        applyAction(res);
        const auroraMsg: Message = { role: "aurora", text: res.message };
        setMessages((m) => {
          const updated = [...m, auroraMsg];
          saveCurrentSession(updated);
          return updated;
        });
        if (speakBack) {
          setStatus("speaking");
          Speech.speak(res.message, {
            language: "en-US", rate: 1.1,
            onDone: () => setStatus("idle"), onError: () => setStatus("idle"),
          });
        } else {
          setStatus("idle");
        }
      } catch {
        setMessages((m) => [...m, { role: "aurora", text: "Couldn't connect right now. Try again?" }]);
        setStatus("idle");
      }
    },
    [profile, stats, habits, status, sessionId, messages]
  );

  const openChat = (prompt?: string) => {
    setMode("chat");
    if (prompt) {
      processMessage(prompt, false);
    } else {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    if (status !== "idle") return;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission denied", "Allow microphone access in Settings to use voice mode.");
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus("recording");
    } catch (e) {
      console.warn("startRecording error:", e);
      setStatus("idle");
    }
  };

  const stopRecording = async () => {
    if (status !== "recording") return;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setMessages((m) => [...m, { role: "aurora", text: "Couldn't save that recording. Try again?" }]);
        setStatus("idle");
        return;
      }
      setStatus("thinking");
      const transcript = await transcribeAudio(uri);
      if (!transcript.trim()) {
        setMessages((m) => [...m, { role: "aurora", text: "I didn't catch that — make sure you're speaking clearly, then try again." }]);
        setStatus("idle");
        return;
      }
      const history = messages;
      setMessages((m) => [...m, { role: "user", text: transcript }]);
      const res = await chatWithAurora(transcript, buildCtx(), history);
      applyAction(res);
      const auroraMsg: Message = { role: "aurora", text: res.message };
      setMessages((m) => {
        const updated = [...m, auroraMsg];
        saveCurrentSession(updated);
        return updated;
      });
      setStatus("speaking");
      Speech.speak(res.message, {
        language: "en-US", rate: 1.1,
        onDone: () => setStatus("idle"), onError: () => setStatus("idle"),
      });
    } catch (e) {
      console.warn("stopRecording error:", e);
      setMessages((m) => [...m, { role: "aurora", text: "Couldn't catch that. Try again?" }]);
      setStatus("idle");
    }
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (mode === "home") {
    const companion = COMPANIONS.find((c) => c.id === profile.companionType) ?? COMPANIONS[0];
    const level     = Math.max(1, Math.floor(healthScore / 20) + 1);
    const moodLabel = companionMood.charAt(0).toUpperCase() + companionMood.slice(1).replace("_", " ");
    const insights  = generateInsights(
      sleepHistory,
      stats.waterMl, profile.waterGoalMl,
      stats.habitsCompleted, stats.habitsTotal,
      habits,
    );

    const ACTIONS = [
      {
        icon: "water-outline"   as const,
        label: "Log Water",
        onPress: () => router.push("/(tabs)/water"),
      },
      {
        icon: "moon-outline"    as const,
        label: "Log Sleep",
        onPress: () => router.push("/(tabs)/sleep"),
      },
      {
        icon: "nutrition-outline" as const,
        label: "Analyze Diet",
        onPress: () => router.push("/diet-analysis"),
      },
      {
        icon: "add-circle-outline" as const,
        label: "Create Habit",
        onPress: () => openChat("Help me create a new habit"),
      },
    ];

    return (
      <View style={[h.root, { paddingTop: insets.top + 12 }]}>

        {/* ── Top bar ── */}
        <View style={h.topBar}>
          <Text style={h.topTitle}>Aurora</Text>
          <TouchableOpacity style={h.newBtn} onPress={startNewChat} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={LIME} />
            <Text style={h.newBtnTxt}>New chat</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Companion Card ── */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18 }}
            style={h.companionCard}
          >
            {/* Glow */}
            <View style={[h.glow, { backgroundColor: companion.accentColor + "14" }]} />

            {/* Companion */}
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: [-5, 5, -5] }}
              transition={{ loop: true, type: "timing", duration: 2400 }}
            >
              <PixelCompanion
                companionId={profile.companionType}
                mood={companionMood}
                size={110}
              />
            </MotiView>

            {/* Info */}
            <View style={h.companionInfo}>
              <View style={h.companionNameRow}>
                <Text style={h.companionName}>{companion.name}</Text>
                <View style={h.lvBadge}>
                  <Text style={h.lvTxt}>Lv. {level}</Text>
                </View>
              </View>
              <View style={h.moodBadge}>
                <View style={h.moodDot} />
                <Text style={h.moodTxt}>{moodLabel}</Text>
              </View>
            </View>
          </MotiView>

          {/* ── Aurora Insights ── */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18, delay: 80 }}
            style={h.insightCard}
          >
            <View style={h.insightHeader}>
              <View style={h.insightDot} />
              <Text style={h.insightTitle}>Aurora Insights</Text>
            </View>

            {insights.length === 0 ? (
              <Text style={h.insightEmpty}>
                Log more data and I'll surface patterns for you.
              </Text>
            ) : (
              insights.map((txt, i) => (
                <View key={i} style={h.insightRow}>
                  <Text style={h.bullet}>•</Text>
                  <Text style={h.insightTxt}>{txt}</Text>
                </View>
              ))
            )}

            <Text style={h.insightSub}>Generated from your data</Text>
          </MotiView>

          {/* ── Suggested Actions ── */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18, delay: 140 }}
          >
            <Text style={h.sectionLabel}>SUGGESTED ACTIONS</Text>
            <View style={h.actionsGrid}>
              {ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={h.actionBtn}
                  onPress={a.onPress}
                  activeOpacity={0.78}
                >
                  <View style={h.actionIcon}>
                    <Ionicons name={a.icon} size={20} color={LIME} />
                  </View>
                  <Text style={h.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>

          {/* ── Chat Section ── */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 300, delay: 200 }}
          >
            {sessions.length > 0 && (
              <View style={h.sessionsWrap}>
                <View style={h.sessionsHeader}>
                  <Text style={h.sectionLabel}>RECENT CHATS</Text>
                  <TouchableOpacity
                    onPress={() => { setSessions([]); persistSessions([]); }}
                    hitSlop={8}
                  >
                    <Text style={h.clearAll}>Clear all</Text>
                  </TouchableOpacity>
                </View>

                {sessions.slice(0, 5).map((session) => {
                  const preview = session.messages.find((m) => m.role === "user")?.text ?? "Chat";
                  return (
                    <TouchableOpacity
                      key={session.id}
                      style={h.sessionRow}
                      onPress={() => openSession(session)}
                      activeOpacity={0.75}
                    >
                      <View style={h.sessionIcon}>
                        <Ionicons name="chatbubble-outline" size={13} color="rgba(255,255,255,0.40)" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={h.sessionPreview} numberOfLines={1}>{preview}</Text>
                        <Text style={h.sessionTime}>{timeAgo(session.createdAt)}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteSession(session.id)}
                        hitSlop={10}
                        style={{ paddingLeft: 12 }}
                      >
                        <Ionicons name="close" size={13} color="rgba(255,255,255,0.22)" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </MotiView>

        </ScrollView>

        {/* ── Sticky bottom input ── */}
        <View style={[h.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={h.inputTap} onPress={() => openChat()} activeOpacity={0.9}>
            <Text style={h.inputHint}>
              Message <Text style={h.inputAccent}>Aurora</Text>…
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={h.micBtn} onPress={() => setMode("voice")} activeOpacity={0.85}>
            <Ionicons name="mic" size={20} color={LIME} />
          </TouchableOpacity>
        </View>

      </View>
    );
  }

  // ── VOICE ────────────────────────────────────────────────────────────────
  if (mode === "voice") {
    const lastMsg     = messages.length > 0 ? messages[messages.length - 1] : null;
    const statusLabel =
      status === "recording" ? "Listening…" :
      status === "thinking"  ? "Thinking…"  :
      status === "speaking"  ? "Speaking…"  : "Tap mic to speak";

    return (
      <View style={[s.voiceScreen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}>
        <View style={s.voiceHeader}>
          <TouchableOpacity onPress={goHome} hitSlop={12}>
            <Text style={s.voiceBack}>← End</Text>
          </TouchableOpacity>
          <Text style={s.voiceHeaderTitle}>Voice call</Text>
          <TouchableOpacity onPress={() => setMode("chat")} hitSlop={12}>
            <Text style={s.voiceSwitchChat}>Chat →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.voiceCenter}>
          <AuroraSphere pulse={pulseAnim} />
          <Text style={s.voiceName}>Aurora</Text>
          <View style={s.voiceStatusRow}>
            <View style={[
              s.voiceStatusDot,
              status === "recording"                            && { backgroundColor: "#FF5F5F" },
              (status === "thinking" || status === "speaking") && { backgroundColor: LIME },
            ]} />
            <Text style={s.voiceStatusText}>{statusLabel}</Text>
          </View>
        </View>
        <View style={{ height: 44, alignItems: "center", justifyContent: "center" }}>
          {status === "recording" && <VoiceWave active={true} />}
        </View>
        {lastMsg && (
          <View style={[s.voiceBubble, lastMsg.role === "user" && s.voiceBubbleUser]}>
            <Text style={s.voiceBubbleMeta}>{lastMsg.role === "user" ? "You" : "Aurora"}</Text>
            <Text style={s.voiceBubbleText}>{lastMsg.text}</Text>
          </View>
        )}
        <View style={s.voiceMicRow}>
          <TouchableOpacity
            style={[s.voiceMicBtn, status === "recording" && s.voiceMicBtnActive]}
            onPress={status === "recording" ? stopRecording : startRecording}
            disabled={status === "thinking" || status === "speaking"}
            activeOpacity={0.8}
          >
            {status === "thinking"
              ? <ActivityIndicator color={LIME} size="large" />
              : <Ionicons
                  name={status === "recording" ? "stop" : "mic"}
                  size={32}
                  color={status === "recording" ? "#000" : LIME}
                />
            }
          </TouchableOpacity>
          <Text style={s.voiceMicHint}>
            {status === "recording" ? "Tap to stop" : status === "idle" ? "Tap to speak" : ""}
          </Text>
        </View>
      </View>
    );
  }

  // ── CHAT ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.chatScreen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[s.chatHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={goHome} hitSlop={12}>
          <Text style={s.chatBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.chatTitle}>Aurora</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity onPress={startNewChat} hitSlop={10}>
            <Text style={s.chatNewBtn}>+ New</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode("voice")} hitSlop={10}>
            <Ionicons name="mic-outline" size={20} color={LIME} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={s.chatEmptyWrap}>
            <View style={s.chatEmptyOrb} />
            <Text style={s.chatEmptyTitle}>Ask Aurora anything</Text>
            <Text style={s.chatEmptyHint}>Chat about your health, life, or whatever's on your mind.</Text>
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} style={m.role === "user" ? s.userRow : s.auroraRow}>
            {m.role === "aurora" && (
              <View style={s.auroraAvatar}>
                <Text style={s.auroraAvatarTxt}>A</Text>
              </View>
            )}
            <View style={[s.bubble, m.role === "user" ? s.userBubble : s.auroraBubble]}>
              <Text style={[s.bubbleText, m.role === "user" && s.userBubbleText]}>{m.text}</Text>
            </View>
          </View>
        ))}
        {status === "thinking" && (
          <View style={s.auroraRow}>
            <View style={s.auroraAvatar}>
              <Text style={s.auroraAvatarTxt}>A</Text>
            </View>
            <View style={[s.auroraBubble, s.thinkingBubble]}>
              <ActivityIndicator color={LIME} size="small" />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[s.chatInputBar, { paddingBottom: insets.bottom + 10 }]}>
        {status === "idle" && messages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestRow}>
            {["How am I doing?", "What should I focus on?", "Log 500ml water"].map((q) => (
              <TouchableOpacity key={q} style={s.suggest} onPress={() => processMessage(q, false)}>
                <Text style={s.suggestText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <View style={s.inputRow}>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Message Aurora…"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => processMessage(inputText, false)}
            returnKeyType="send"
            multiline
            editable={status === "idle"}
          />
          <TouchableOpacity
            style={[s.sendBtn, (status !== "idle" || !inputText.trim()) && { opacity: 0.3 }]}
            onPress={() => processMessage(inputText, false)}
            disabled={status !== "idle" || !inputText.trim()}
          >
            {status === "thinking"
              ? <ActivityIndicator color="#000" size="small" />
              : <Ionicons name="arrow-up" size={18} color="#000" />
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Home styles ───────────────────────────────────────────────────────────────
const h = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },

  topBar:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  topTitle:  { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.8 },
  newBtn:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: LIME_DIM, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: LIME_BORDER },
  newBtnTxt: { color: LIME, fontSize: 13, fontWeight: "700" },

  // Companion card
  companionCard: {
    flexDirection: "row", alignItems: "center", gap: 18,
    backgroundColor: CARD, borderRadius: 24, padding: 20,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER, overflow: "hidden",
  },
  glow: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    left: -30, top: -30,
  },
  companionInfo:    { flex: 1, gap: 8 },
  companionNameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  companionName:    { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.7 },
  lvBadge:          { backgroundColor: LIME_DIM, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: LIME_BORDER },
  lvTxt:            { color: LIME, fontSize: 11, fontWeight: "800" },
  moodBadge:        { flexDirection: "row", alignItems: "center", gap: 7 },
  moodDot:          { width: 6, height: 6, borderRadius: 99, backgroundColor: LIME },
  moodTxt:          { color: "rgba(255,255,255,0.60)", fontSize: 13, fontWeight: "500" },

  // Insights card
  insightCard: {
    backgroundColor: CARD, borderRadius: 22, padding: 20,
    marginHorizontal: 16, marginBottom: 14,
    borderWidth: 1, borderColor: BORDER, gap: 0,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  insightDot:    { width: 6, height: 6, borderRadius: 99, backgroundColor: LIME },
  insightTitle:  { color: "#fff", fontSize: 15, fontWeight: "700" },
  insightRow:    { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  bullet:        { color: LIME, fontSize: 14, fontWeight: "800", lineHeight: 21, width: 10 },
  insightTxt:    { color: "rgba(255,255,255,0.70)", fontSize: 14, lineHeight: 21, flex: 1 },
  insightEmpty:  { color: MUTED, fontSize: 13, lineHeight: 20, fontStyle: "italic", marginBottom: 10 },
  insightSub:    { color: MUTED, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, marginTop: 4 },

  // Suggested actions
  sectionLabel: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, paddingHorizontal: 16 },
  actionsGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 24 },
  actionBtn: {
    width: (width - 48) / 2,
    backgroundColor: CARD2, borderRadius: 18,
    padding: 18, gap: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  actionIcon:  { width: 36, height: 36, borderRadius: 12, backgroundColor: LIME_DIM, borderWidth: 1, borderColor: LIME_BORDER, alignItems: "center", justifyContent: "center" },
  actionLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Sessions
  sessionsWrap:   { paddingHorizontal: 16 },
  sessionsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  clearAll:       { color: "rgba(255,255,255,0.22)", fontSize: 12, fontWeight: "500" },
  sessionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sessionIcon:    { width: 28, height: 28, borderRadius: 8, backgroundColor: CARD, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER },
  sessionPreview: { color: "rgba(255,255,255,0.68)", fontSize: 13, fontWeight: "500", marginBottom: 2 },
  sessionTime:    { color: MUTED, fontSize: 11 },

  // Bottom input
  bottomBar: {
    flexDirection: "row", gap: 10, alignItems: "center",
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  inputTap:   { flex: 1, backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1, borderColor: BORDER },
  inputHint:  { color: "rgba(255,255,255,0.28)", fontSize: 14 },
  inputAccent:{ color: "rgba(255,255,255,0.50)", fontWeight: "500" },
  micBtn:     { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: LIME, alignItems: "center", justifyContent: "center" },
});

// ── Shared styles (voice + chat) ──────────────────────────────────────────────
const s = StyleSheet.create({
  // Sphere
  sphereWrap: { width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  lineH: { position: "absolute", width: 220, height: 0.5, backgroundColor: "rgba(255,255,255,0.07)" },
  lineV: { position: "absolute", width: 0.5, height: 220, backgroundColor: "rgba(255,255,255,0.07)" },

  // ── VOICE ──
  voiceScreen: { flex: 1, backgroundColor: BG, paddingHorizontal: 24 },
  voiceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  voiceBack:        { color: "rgba(255,255,255,0.50)", fontSize: 14, fontWeight: "600" },
  voiceHeaderTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  voiceSwitchChat:  { color: LIME, fontSize: 14, fontWeight: "600" },
  voiceCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  voiceName: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  voiceStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  voiceStatusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "rgba(255,255,255,0.20)" },
  voiceStatusText: { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "500" },
  voiceBubble: { backgroundColor: CARD, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  voiceBubbleUser: { backgroundColor: "rgba(202,255,0,0.07)", borderColor: "rgba(202,255,0,0.14)" },
  voiceBubbleMeta: { color: "rgba(255,255,255,0.30)", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" },
  voiceBubbleText: { color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 22 },
  voiceMicRow: { alignItems: "center", gap: 12 },
  voiceMicBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(202,255,0,0.08)", borderWidth: 2, borderColor: LIME, alignItems: "center", justifyContent: "center" },
  voiceMicBtnActive: { backgroundColor: LIME, borderColor: LIME },
  voiceMicHint: { color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: "500" },

  // ── CHAT ──
  chatScreen: { flex: 1, backgroundColor: BG },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  chatBack:   { color: "rgba(255,255,255,0.50)", fontSize: 20, fontWeight: "400", paddingRight: 4 },
  chatTitle:  { color: "#fff", fontSize: 16, fontWeight: "700" },
  chatNewBtn: { color: LIME, fontSize: 13, fontWeight: "700" },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 100 },
  chatEmptyWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 14 },
  chatEmptyOrb: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(202,255,0,0.08)", borderWidth: 1, borderColor: "rgba(202,255,0,0.18)", marginBottom: 4 },
  chatEmptyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" },
  chatEmptyHint: { color: MUTED, fontSize: 14, lineHeight: 22, textAlign: "center" },
  userRow:   { flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 },
  auroraRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
  auroraAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(202,255,0,0.12)", borderWidth: 1, borderColor: "rgba(202,255,0,0.22)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  auroraAvatarTxt: { color: LIME, fontSize: 12, fontWeight: "800" },
  bubble: { borderRadius: 10, padding: 13, maxWidth: "78%" },
  userBubble: { backgroundColor: LIME, borderRadius: 10, borderBottomRightRadius: 4 },
  auroraBubble: { backgroundColor: CARD, borderRadius: 10, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER, minWidth: 52, minHeight: 40 },
  bubbleText: { color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: "#000" },
  thinkingBubble: { alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  chatInputBar: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG },
  suggestRow: { gap: 8, paddingBottom: 10 },
  suggest: { backgroundColor: CARD, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: BORDER },
  suggestText: { color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: "500" },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  input: { flex: 1, backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: LIME, alignItems: "center", justifyContent: "center" },
});
