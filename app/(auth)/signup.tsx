import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";

const LIME = "#C8FF00";
const BG   = "#070707";
const CARD = "#101010";

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signup } = useApp();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSignup = async () => {
    if (!email.trim() || !password) { setError("Please fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    const err = await signup(email.trim(), password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.replace("/onboarding");
  };

  return (
    <View style={styles.root}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.brand}>Aurora</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.loginLink}>Log in</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Heading ── */}
        <Text style={styles.heading}>Create{"\n"}account.</Text>

        {/* ── Fields ── */}
        <View style={styles.fields}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password  (min. 6 characters)"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[styles.cta, loading && { opacity: 0.7 }]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.ctaText}>Create Account  →</Text>
          }
        </TouchableOpacity>

        <Text style={styles.footer}>No judgment. Only good vibes.</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 12,
  },
  brand: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  loginLink: {
    color: LIME,
    fontSize: 14,
    fontWeight: "600",
  },

  body: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingBottom: 48,
  },

  heading: {
    color: "#fff",
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2.5,
    lineHeight: 56,
    marginBottom: 40,
  },

  fields: {
    gap: 10,
    marginBottom: 20,
  },

  input: {
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: "#fff",
    fontSize: 16,
  },

  error: {
    color: "#FF6B6B",
    fontSize: 13,
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  cta: {
    backgroundColor: LIME,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  ctaText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },

  footer: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 24,
  },
});
