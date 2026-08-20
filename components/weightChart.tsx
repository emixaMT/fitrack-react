import { LineChart } from "react-native-chart-kit";
import { Dimensions, View, Text } from "react-native";
import { useWeightHistory } from "../hooks/useWeightHistory";
import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const screenWidth = Dimensions.get("window").width;

export default function WeightChart() {
  const { weights, error } = useWeightHistory();
  const { colors, isDarkMode } = useTheme();

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => isDarkMode
      ? `rgba(129, 140, 248, ${opacity})`
      : `rgba(99, 102, 241, ${opacity})`,
    labelColor: () => colors.textSecondary,
    strokeWidth: 2,
    propsForDots: { r: "3", strokeWidth: "2", stroke: colors.primary },
    propsForBackgroundLines: { stroke: colors.divider, strokeDasharray: "" },
  };

  const data = {
    labels: weights.map((w) => w.date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })),
    datasets: [{ data: weights.map((w) => w.value) }],
  };

  return (
    <View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
        Évolution du poids (kg)
      </Text>
      {error ? (
        <Text style={{ color: colors.warning, marginTop: 20, fontSize: 14 }}>{error}</Text>
      ) : weights.length > 0 ? (
        <LineChart
          data={data}
          width={screenWidth - 76}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 8, marginHorizontal: -8 }}
        />
      ) : (
        <Text style={{ color: colors.textTertiary, marginTop: 20, fontSize: 14 }}>Pas encore de données</Text>
      )}
    </View>
  );
}
