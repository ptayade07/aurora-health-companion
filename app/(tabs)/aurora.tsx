import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Animated, Platform,
  KeyboardAvoidingView, Dimensions, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from "expo-audio";
import { useApp } from "../../context/AppContext";
import { chatWithAurora, transcribeAudio } from "../../lib/groq";
import type { NutritionEntry } from "../../lib/types";

const { width } = Dimensions.get("window");
const LIME   = "#C8FF00";
const BG     = "#070707";
const CARD   = "#101010";
const MUTED  = "rgba(255,255,255,0.36)";
const BORDER = "rgba(255,255,255,0.07)";

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

const QUICK_PROMPTS = [
  { label: "How am I doing today?", lime: false },
  { label: "Log 500ml water",       lime: true  },
  { label: "I slept 7 hours",       lime: false },
  { label: "Build a new habit",     lime: false },
];

// ── Waveform bars ─────────────────────────────────────────────────────────────
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

// ── Sphere ────────────────────────────────────────────────────────────────────
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
  const { profile, stats, habits, addWater, logSleep, addHabit, addNutrition, setMood } = useApp();

  const [mode,        setMode]        = useState<Mode>("home");
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [sessions,    setSessions]    = useState<ChatSession[]>([]);
  const [sessionId,   setSessionId]   = useState<string | null>(null);
  const [status,    setStatus]  = useState<Status>("idle");
  const [inputText, setInputText] = useState("");

  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();
  const handledPromptRef  = useRef<string | null>(null);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const scrollRef  = useRef<ScrollView>(null);
  const inputRef   = useRef<TextInput>(null);
  const statusRef  = useRef<Status>("idle");

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // keep statusRef in sync for cleanup callbacks
  useEffect(() => { statusRef.current = status; }, [status]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  // Handle incoming prompt from other screens (e.g. diet-analysis "Need some help?")
  useEffect(() => {
    if (initialPrompt && initialPrompt !== handledPromptRef.current) {
      handledPromptRef.current = String(initialPrompt);
      setMode("chat");
      // Small delay so the chat UI mounts before sending
      const t = setTimeout(() => processMessage(String(initialPrompt), false), 350);
      return () => clearTimeout(t);
    }
  }, [initialPrompt]);

  // Cleanup audio when leaving voice mode
  useEffect(() => {
    if (mode !== "voice") {
      Speech.stop();
      if (statusRef.current === "recording") {
        recorder.stop().catch(() => {});
        setStatus("idle");
      }
    }
  }, [mode]);

  // Sphere pulse animation
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
        // Update existing
        updated = prev.map((s) =>
          s.id === sessionId ? { ...s, messages: msgs } : s
        );
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
      const history = messages; // capture before state update
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
            language: "en-US",
            rate: 1.1,
            onDone:  () => setStatus("idle"),
            onError: () => setStatus("idle"),
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

      const history = messages; // capture before state update
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
        language: "en-US",
        rate: 1.1,
        onDone:  () => setStatus("idle"),
        onError: () => setStatus("idle"),
      });
    } catch (e) {
      console.warn("stopRecording error:", e);
      setMessages((m) => [...m, { role: "aurora", text: "Couldn't catch that. Try again?" }]);
      setStatus("idle");
    }
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (mode === "home") {
    return (
      <View style={[s.home, { paddingTop: insets.top + 12 }]}>

        {/* Top bar */}
        <View style={[s.topBar, { paddingHorizontal: 24, justifyContent: "flex-end" }]}>
          <TouchableOpacity style={s.newBtn} onPress={startNewChat} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={LIME} />
            <Text style={s.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable: hero + sessions + quick prompts */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={s.hero}>
            <View style={s.spherePos}>
              <AuroraSphere pulse={pulseAnim} />
            </View>
            <Text style={s.heroHeading}>{"Ask\nanything."}</Text>
          </View>

          {/* Past sessions */}
          {sessions.length > 0 && (
            <View style={s.sessionsWrap}>
              <View style={s.sessionsHeader}>
                <Text style={s.sectionLabel}>RECENT</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSessions([]);
                    persistSessions([]);
                  }}
                  hitSlop={8}
                >
                  <Text style={s.clearAll}>Clear all</Text>
                </TouchableOpacity>
              </View>

              {sessions.slice(0, 6).map((session) => {
                const preview = session.messages.find((m) => m.role === "user")?.text ?? "Chat";
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={s.sessionRow}
                    onPress={() => openSession(session)}
                    activeOpacity={0.75}
                  >
                    <View style={s.sessionIcon}>
                      <Ionicons name="chatbubble-outline" size={14} color="rgba(255,255,255,0.45)" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sessionPreview} numberOfLines={1}>{preview}</Text>
                      <Text style={s.sessionTime}>{timeAgo(session.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteSession(session.id)}
                      hitSlop={10}
                      style={{ paddingLeft: 12 }}
                    >
                      <Ionicons name="close" size={14} color="rgba(255,255,255,0.25)" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Quick prompts */}
          <Text style={[s.sectionLabel, { paddingHorizontal: 24, marginTop: sessions.length > 0 ? 24 : 8 }]}>
            QUICK START
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.cardsRow}
          >
            {QUICK_PROMPTS.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={[s.card, q.lime && s.cardLime]}
                onPress={() => openChat(q.label)}
                activeOpacity={0.8}
              >
                <Text style={[s.cardLabel, q.lime && s.cardLabelDark]}>{q.label}</Text>
                <Text style={[s.cardArrow, q.lime && s.cardArrowDark]}>→</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>

        {/* Sticky input bar */}
        <View style={[s.homeBottom, { paddingBottom: insets.bottom + 10, paddingHorizontal: 24 }]}>
          <TouchableOpacity style={s.homeInputTap} onPress={() => openChat()} activeOpacity={0.9}>
            <Text style={s.homeInputHint}>
              Message <Text style={s.homeInputAccent}>Aurora</Text>…
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.voiceCallBtn} onPress={() => setMode("voice")} activeOpacity={0.85}>
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
              status === "recording"                              && { backgroundColor: "#FF5F5F" },
              (status === "thinking" || status === "speaking")   && { backgroundColor: LIME },
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
      {/* Header */}
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

      {/* Messages */}
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
            <Text style={s.chatEmptyHint}>
              Chat about your health, life, or whatever's on your mind.
            </Text>
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

      {/* Input */}
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

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // Sphere
  sphereWrap: { width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  lineH: { position: "absolute", width: 220, height: 0.5, backgroundColor: "rgba(255,255,255,0.07)" },
  lineV: { position: "absolute", width: 0.5, height: 220, backgroundColor: "rgba(255,255,255,0.07)" },

  // ── HOME ──────────────────────────────────
  home: { flex: 1, backgroundColor: BG },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: CARD,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { color: "#fff", fontSize: 13, fontWeight: "700" },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(202,255,0,0.10)",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(202,255,0,0.20)",
  },
  newBtnText: { color: LIME, fontSize: 13, fontWeight: "700" },

  hero: {
    height: 220,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    overflow: "hidden",
  },
  heroHeading: {
    color: "#fff",
    fontSize: 68,
    fontWeight: "800",
    letterSpacing: -3,
    lineHeight: 72,
    zIndex: 2,
  },
  spherePos: {
    position: "absolute",
    right: -50,
    top: -10,
    opacity: 0.38,
    zIndex: 1,
  },

  // Sessions
  sessionsWrap: { paddingHorizontal: 24, marginTop: 8 },
  sessionsHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  sectionLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  clearAll: { color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: "500" },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sessionIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: CARD,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: BORDER,
  },
  sessionPreview: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  sessionTime: { color: MUTED, fontSize: 11, fontWeight: "400" },

  // Cards
  cardsRow: {
    paddingLeft: 24, paddingRight: 12, gap: 10, paddingVertical: 4,
  },
  card: {
    width: width * 0.44,
    height: width * 0.40,
    backgroundColor: CARD,
    borderRadius: 6,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1, borderColor: BORDER,
  },
  cardLime: { backgroundColor: LIME, borderColor: "transparent" },
  cardLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13, fontWeight: "600", lineHeight: 19, flex: 1,
  },
  cardLabelDark: { color: "#000" },
  cardArrow: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 16, fontWeight: "700", alignSelf: "flex-end",
  },
  cardArrowDark: { color: "rgba(0,0,0,0.45)" },

  // Input bar
  homeBottom: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  homeInputTap: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  homeInputHint: { color: "rgba(255,255,255,0.28)", fontSize: 14 },
  homeInputAccent: { color: "rgba(255,255,255,0.55)", fontWeight: "500" },
  voiceCallBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: BG,
    borderWidth: 1, borderColor: LIME,
    alignItems: "center", justifyContent: "center",
  },

  // ── VOICE ─────────────────────────────────
  voiceScreen: { flex: 1, backgroundColor: BG, paddingHorizontal: 24 },
  voiceHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  voiceBack:        { color: "rgba(255,255,255,0.50)", fontSize: 14, fontWeight: "600" },
  voiceHeaderTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  voiceSwitchChat:  { color: LIME, fontSize: 14, fontWeight: "600" },
  voiceCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  voiceName: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  voiceStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  voiceStatusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "rgba(255,255,255,0.20)" },
  voiceStatusText: { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "500" },
  voiceBubble: {
    backgroundColor: CARD, borderRadius: 6, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: BORDER,
  },
  voiceBubbleUser: {
    backgroundColor: "rgba(202,255,0,0.07)",
    borderColor: "rgba(202,255,0,0.14)",
  },
  voiceBubbleMeta: {
    color: "rgba(255,255,255,0.30)", fontSize: 10, fontWeight: "700",
    letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase",
  },
  voiceBubbleText: { color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 22 },
  voiceMicRow: { alignItems: "center", gap: 12 },
  voiceMicBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(202,255,0,0.08)",
    borderWidth: 2, borderColor: LIME,
    alignItems: "center", justifyContent: "center",
  },
  voiceMicBtnActive: { backgroundColor: LIME, borderColor: LIME },
  voiceMicHint: { color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: "500" },

  // ── CHAT ──────────────────────────────────
  chatScreen: { flex: 1, backgroundColor: BG },
  chatHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  chatBack:   { color: "rgba(255,255,255,0.50)", fontSize: 20, fontWeight: "400", paddingRight: 4 },
  chatTitle:  { color: "#fff", fontSize: 16, fontWeight: "700" },
  chatNewBtn: { color: LIME, fontSize: 13, fontWeight: "700" },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 100 },

  // Empty state
  chatEmptyWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 14 },
  chatEmptyOrb: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(202,255,0,0.08)",
    borderWidth: 1, borderColor: "rgba(202,255,0,0.18)",
    marginBottom: 4,
  },
  chatEmptyTitle: {
    color: "#fff", fontSize: 20, fontWeight: "800",
    letterSpacing: -0.5, textAlign: "center",
  },
  chatEmptyHint: {
    color: MUTED, fontSize: 14, lineHeight: 22,
    textAlign: "center", fontWeight: "400",
  },

  // Message rows
  userRow:   { flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 },
  auroraRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
  auroraAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(202,255,0,0.12)",
    borderWidth: 1, borderColor: "rgba(202,255,0,0.22)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  auroraAvatarTxt: { color: LIME, fontSize: 12, fontWeight: "800" },

  bubble: { borderRadius: 10, padding: 13, maxWidth: "78%" },
  userBubble: {
    backgroundColor: LIME, borderRadius: 10,
    borderBottomRightRadius: 4,
  },
  auroraBubble: {
    backgroundColor: CARD, borderRadius: 10,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: BORDER,
    minWidth: 52, minHeight: 40,
  },
  bubbleText: { color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: "#000" },
  thinkingBubble: { alignItems: "center", justifyContent: "center", paddingVertical: 14 },

  // Input bar
  chatInputBar: {
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
    backgroundColor: BG,
  },
  suggestRow: { gap: 8, paddingBottom: 10 },
  suggest: {
    backgroundColor: CARD,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: BORDER,
  },
  suggestText: { color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: "500" },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  input: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 12,
    color: "#fff", fontSize: 15,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: LIME,
    alignItems: "center", justifyContent: "center",
  },
});
