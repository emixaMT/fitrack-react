import { LineChart } from "react-native-chart-kit";
import { Dimensions, View, Text } from "react-native";
import { useWeightHistory } from "../hooks/useWeightHistory";
import React from "react";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // indigo-600
  labelColor: () => "#6b7280", // gray-500
  strokeWidth: 2,
  propsForDots: {
    r: "2",
    strokeWidth: "2",
    stroke: "#4f46e5",
  },
};

export default function WeightChart() {
  const weights = useWeightHistory();

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
      <Text className="text-lg font-bold text-indigo-600 mb-2">
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
        <Text className="text-gray-400 mt-6">
          Pas encore de données enregistrées
        </Text>
      )}
    </View>
  );
}
