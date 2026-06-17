import { Redirect } from "expo-router";
import { useApp } from "../context/AppContext";
import { colors } from "../lib/theme";

export default function Index() {
  const { introSeen, loggedIn, profile } = useApp();

  if (!introSeen) {
    return <Redirect href="/intro" />;
  }
  if (!loggedIn) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!profile.onboarded) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
