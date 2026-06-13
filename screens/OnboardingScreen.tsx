import { View, Text } from "react-native";

export default function OnboardingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 38,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Meet Aurora
      </Text>

      <Text
        style={{
          color: "#A855F7",
          fontSize: 18,
          textAlign: "center",
          marginTop: 20,
        }}
      >
        Your slightly chaotic health companion.
      </Text>
    </View>
  );
}