import { Tabs, Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import FloatingPet from "../../components/FloatingPet";

const LIME   = "#C8FF00";
const BG     = "#070707";
const MUTED  = "rgba(255,255,255,0.30)";

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
    <View style={ic.wrap}>
      <Ionicons
        name={focused ? icon : iconOutline}
        size={22}
        color={focused ? LIME : MUTED}
      />
      {/* Lime pill indicator below icon */}
      <View style={[ic.pill, focused && ic.pillActive]} />
    </View>
  );
}

const ic = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  pill: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  pillActive: {
    width: 18,
    backgroundColor: LIME,
  },
});

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
          tabBarInactiveTintColor: MUTED,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="home" iconOutline="home-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="water"
          options={{
            title: "Water",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="water" iconOutline="water-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="quests"
          options={{
            title: "Habits",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="checkmark-circle" iconOutline="checkmark-circle-outline" focused={focused} />
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
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="person" iconOutline="person-outline" focused={focused} />
            ),
          }}
        />
        {/* Hidden routes */}
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
    height: 68,
    paddingTop: 10,
    paddingBottom: 12,
  },
});
