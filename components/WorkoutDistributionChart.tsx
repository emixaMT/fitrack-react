// FILE: components/WorkoutDistributionChart.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Circle, G, Text as SvgText, Path } from 'react-native-svg';
import { supabase } from '../config/supabaseConfig';
import { SportKey, sportsMeta } from '../constantes/sport';
import { useTheme } from '../contexts/ThemeContext';
import { getMonthlyStats } from '../services/sessionCounterService';

interface WorkoutStats {
  musculation: number;
  crossfit: number;
  running: number;
  velo: number;
}

const SPORT_COLORS = {
  musculation: '#ef476f',  // Indigo
  crossfit: '#ffd166',     // Amber
  running: '#06d6a0',      // Emerald
  velo: '#118ab2',         // Cyan
};

export default function WorkoutDistributionChart({ userId }: { userId: string | null }) {
  const [stats, setStats] = useState<WorkoutStats>({
    musculation: 0,
    crossfit: 0,
    running: 0,
    velo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    if (!userId) return;
    
    loadWorkoutStats();

    // Subscription en temps réel pour écouter les changements de compteurs
    const channel = supabase
      .channel(`workout-distribution-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_counters',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔄 [WorkoutDistribution] Realtime update:', payload.eventType, payload);
          // Recharger les stats immédiatement quand un compteur change
          loadWorkoutStats();
        }
      )
      .subscribe((status) => {
        console.log('📡 [WorkoutDistribution] Subscription status:', status);
      });

    // Cleanup: se désabonner quand le composant est démonté
    return () => {
      console.log('🔌 [WorkoutDistribution] Unsubscribing from realtime');
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadWorkoutStats = async () => {
    if (!userId) return;

    try {
      // Récupérer les statistiques depuis les compteurs de séances
      const monthlyStats = await getMonthlyStats(userId);

      const newStats: WorkoutStats = {
        musculation: monthlyStats.musculation,
        crossfit: monthlyStats.crossfit,
        running: monthlyStats.running,
        velo: monthlyStats.velo,
      };

      setStats(newStats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading workout stats:', error);
      setLoading(false);
    }
  };

  const getTotalWorkouts = () => {
    return stats.musculation + stats.crossfit + stats.running + stats.velo;
  };

  const getPercentage = (count: number): string => {
    const total = getTotalWorkouts();
    if (total === 0) return '0';
    return ((count / total) * 100).toFixed(1);
  };

  // Fonction pour créer les arcs du donut
  const createDonutSlices = () => {
    const total = getTotalWorkouts();
    if (total === 0) return [];

    const size = 260;
    const center = size / 2;
    const radius = 95;
    const innerRadius = 60;
    const slices: React.ReactElement[] = [];

    let currentAngle = -90; // Commencer en haut

    (Object.keys(stats) as SportKey[]).forEach((key) => {
      if (stats[key] === 0) return;

      const percentage = stats[key] / total;
      const angle = percentage * 360;

      // Cas spécial : si c'est 100% (un seul type), on dessine deux demi-cercles
      if (percentage >= 0.999) {
        // Dessiner un cercle complet en deux arcs de 180°
        const firstHalfPath = [
          `M ${center} ${center - radius}`, // Point haut extérieur
          `A ${radius} ${radius} 0 0 1 ${center} ${center + radius}`, // Arc extérieur (180°)
          `L ${center} ${center + innerRadius}`, // Ligne vers intérieur
          `A ${innerRadius} ${innerRadius} 0 0 0 ${center} ${center - innerRadius}`, // Arc intérieur retour
          'Z',
        ].join(' ');

        const secondHalfPath = [
          `M ${center} ${center - radius}`, // Point haut extérieur
          `A ${radius} ${radius} 0 0 0 ${center} ${center + radius}`, // Arc extérieur (180° autre sens)
          `L ${center} ${center + innerRadius}`, // Ligne vers intérieur
          `A ${innerRadius} ${innerRadius} 0 0 1 ${center} ${center - innerRadius}`, // Arc intérieur retour
          'Z',
        ].join(' ');

        slices.push(
          <G key={key}>
            <Path d={firstHalfPath} fill={SPORT_COLORS[key]} />
            <Path d={secondHalfPath} fill={SPORT_COLORS[key]} />
          </G>
        );
        return;
      }

      // Calculer les coordonnées pour l'arc
      const startAngle = (currentAngle * Math.PI) / 180;
      const endAngle = ((currentAngle + angle) * Math.PI) / 180;

      // Points sur le cercle extérieur
      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      // Points sur le cercle intérieur
      const innerX1 = center + innerRadius * Math.cos(startAngle);
      const innerY1 = center + innerRadius * Math.sin(startAngle);
      const innerX2 = center + innerRadius * Math.cos(endAngle);
      const innerY2 = center + innerRadius * Math.sin(endAngle);

      const largeArcFlag = angle > 180 ? 1 : 0;

      // Créer le path pour le segment du donut
      const pathData = [
        `M ${x1} ${y1}`, // Partir du point extérieur de départ
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arc extérieur
        `L ${innerX2} ${innerY2}`, // Ligne vers le cercle intérieur
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`, // Arc intérieur (retour)
        'Z', // Fermer le path
      ].join(' ');

      slices.push(
        <Path
          key={key}
          d={pathData}
          fill={SPORT_COLORS[key]}
        />
      );

      currentAngle += angle;
    });

    return slices;
  };

  if (loading) {
    return (
      <View style={{ 
        backgroundColor: colors.card, 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
      }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Chargement des statistiques...</Text>
      </View>
    );
  }

  const totalWorkouts = getTotalWorkouts();

  if (totalWorkouts === 0) {
    return (
      <View style={{ 
        backgroundColor: colors.card, 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 24,
        alignItems: 'center',
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: colors.indigo,
          marginBottom: 12,
        }}>
          Répartition des séances
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Aucune séance enregistrée pour le moment
        </Text>
      </View>
    );
  }

  return (
    <View style={{ 
      backgroundColor: colors.card, 
      borderRadius: 16, 
      padding: 16, 
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }}>
      <Text style={{ 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: colors.indigo,
        marginBottom: 8,
        textAlign: 'center',
      }}>
        Répartition des séances
      </Text>

      {/* Graphique en donut */}
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Svg width={260} height={260}>
          {createDonutSlices()}
          {/* Cercle blanc au centre pour créer l'effet donut */}
          <Circle cx={130} cy={130} r={60} fill={colors.card} />
          {/* Texte au centre avec le total */}
          <SvgText
            x={130}
            y={122}
            textAnchor="middle"
            fontSize={36}
            fontWeight="bold"
            fill={colors.indigo}
          >
            {totalWorkouts}
          </SvgText>
          <SvgText
            x={130}
            y={145}
            textAnchor="middle"
            fontSize={14}
            fill={colors.textSecondary}
          >
            séances
          </SvgText>
        </Svg>
      </View>

      {/* Légende personnalisée avec tooltips */}
      <View style={{ marginTop: 8 }}>
        {(Object.keys(stats) as SportKey[]).map((key) => {
          if (stats[key] === 0) return null;

          const isSelected = selectedSegment === key;
          
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedSegment(isSelected ? null : key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginVertical: 4,
                borderRadius: 8,
                backgroundColor: isSelected 
                  ? (isDarkMode ? '#2d2d2d' : '#f3f4f6')
                  : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: SPORT_COLORS[key],
                    marginRight: 12,
                  }}
                />
                <Text style={{ 
                  color: colors.text, 
                  fontSize: 14,
                  fontWeight: isSelected ? '600' : '400',
                }}>
                  {sportsMeta[key].label}
                </Text>
              </View>

              {/* Affichage du nombre et pourcentage */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ 
                  color: colors.indigo, 
                  fontWeight: 'bold',
                  fontSize: 14,
                }}>
                  {stats[key]}
                </Text>
                {isSelected && (
                  <View style={{
                    backgroundColor: SPORT_COLORS[key],
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{ 
                      color: 'white', 
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {getPercentage(stats[key])}%
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
