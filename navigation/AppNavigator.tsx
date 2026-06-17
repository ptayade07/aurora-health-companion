import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "../screens/OnboardingScreen";
import DashboardScreen from "../screens/DashboardScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen
    name="Onboarding"
    component={OnboardingScreen}
  />

  <Stack.Screen
    name="Dashboard"
    component={DashboardScreen}
  />

  <Stack.Screen
    name="Hydration"
    component={HydrationScreen}
  />

  <Stack.Screen
    name="Sleep"
    component={SleepScreen}
  />

  <Stack.Screen
    name="Habits"
    component={HabitsScreen}
  />

  <Stack.Screen
    name="Companion"
    component={CompanionScreen}
  />
</Stack.Navigator>