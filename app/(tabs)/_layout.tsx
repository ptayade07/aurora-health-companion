import { Tabs, Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import FloatingPet from "../../components/FloatingPet";

const LIME  = "#C8FF00";
const BG    = "#070707";
const GREY  = "#5A5A5A";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  icon,
  iconOutline,
  focused,
}: {
  icon: IconName;
  iconOutline: IconName;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? icon : iconOutline}
      size={23}
      color={focused ? LIME : GREY}
    />
  );
}


export default function TabLayout() {
  const { loggedIn } = useApp();
  if (!loggedIn) return <Redirect href="/(auth)/login" />;

  return (
    <View style={s.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: s.tabBar,
          tabBarActiveTintColor: LIME,
          tabBarInactiveTintColor: GREY,
        }}
      >
        {/* ── 5 visible tabs ───────────────────────────────────────────────── */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Today",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="home" iconOutline="home-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="aurora"
          options={{
            title: "Aurora",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="planet" iconOutline="planet-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="trending-up" iconOutline="trending-up-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="companion"
          options={{
            title: "Companion",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="heart" iconOutline="heart-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="person" iconOutline="person-outline" focused={focused} />
            ),
          }}
        />

        {/* ── Hidden — now modules inside Today ────────────────────────────── */}
        <Tabs.Screen name="water"     options={{ href: null }} />
        <Tabs.Screen name="quests"    options={{ href: null }} />
        <Tabs.Screen name="sleep"     options={{ href: null }} />
        <Tabs.Screen name="nutrition" options={{ href: null }} />
      </Tabs>

      <FloatingPet />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
  },
});
