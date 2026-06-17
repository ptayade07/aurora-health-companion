import { View, StyleSheet } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop, ClipPath } from "react-native-svg";
import { colors, radius } from "../lib/theme";

type Props = {
  progress: number; // 0-100
  width?: number;
  height?: number;
};

export default function WaterBottle({
  progress,
  width = 100,
  height = 180,
}: Props) {
  const clamped = Math.min(100, Math.max(0, progress));
  const fillHeight = (clamped / 100) * (height - 40);

  return (
    <View style={styles.wrapper}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.purpleLight} />
            <Stop offset="1" stopColor={colors.purple} />
          </LinearGradient>
          <ClipPath id="bottleClip">
            <Rect x={20} y={10} width={width - 40} height={height - 20} rx={16} />
          </ClipPath>
        </Defs>
        <Rect
          x={20}
          y={10}
          width={width - 40}
          height={height - 20}
          rx={16}
          fill={colors.bgElevated}
          stroke={colors.purple}
          strokeWidth={2}
        />
        <Rect
          x={20}
          y={height - 10 - fillHeight}
          width={width - 40}
          height={fillHeight}
          fill="url(#water)"
          clipPath="url(#bottleClip)"
          opacity={0.9}
        />
        <Rect
          x={width / 2 - 12}
          y={2}
          width={24}
          height={12}
          rx={4}
          fill={colors.purpleDark}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
