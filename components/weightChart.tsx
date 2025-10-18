import { LineChart } from "react-native-chart-kit";
import { Dimensions, View, Text } from "react-native";
import { useWeightHistory } from "../hooks/useWeightHistory";
import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const screenWidth = Dimensions.get("window").width;

export default function WeightChart() {
  const weights = useWeightHistory();
  const { colors, isDarkMode } = useTheme();
  
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(79, 70, 229, ${opacity})`,
    labelColor: () => colors.textSecondary,
    strokeWidth: 2,
    propsForDots: {
      r: "2",
      strokeWidth: "2",
      stroke: isDarkMode ? "#ffffff" : "#4f46e5",
    },
  };

  // ⚡ transformer en data compatible chart-kit
  const data = {
    labels: weights.map((w) =>
      w.date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
    ),
    datasets: [
      {
        data: weights.map((w) => w.value),
      },
    ],
  };

  return (
    <View className="items-center mt-4">
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.indigo, marginBottom: 8 }}>
        Évolution du poids (kg)
      </Text>
      {weights.length > 0 ? (
        <LineChart
          data={data}
          width={screenWidth - 45}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 16 }}
        />
      ) : (
        <Text style={{ color: colors.textSecondary, marginTop: 24 }}>
          Pas encore de données enregistrées
        </Text>
      )}
    </View>
  );
}
