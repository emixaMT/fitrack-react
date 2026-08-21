// components/RouteMap.tsx
import React, { useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import { TrackPoint, formatDistance, formatDuration } from '../utils/gpx';
import { useTheme } from '../contexts/ThemeContext';

interface RouteMapProps {
  points: TrackPoint[];
  height?: number;
  showStats?: boolean;
  elevationGain?: number;
  distanceKm?: number;
  durationSec?: number;
}

export default function RouteMap({
  points,
  height = 250,
  showStats = true,
  elevationGain,
  distanceKm,
  durationSec,
}: RouteMapProps) {
  const { colors, isDarkMode } = useTheme();

  const { region, polylineCoords } = useMemo(() => {
    if (points.length === 0) {
      return {
        region: null as Region | null,
        polylineCoords: [] as { latitude: number; longitude: number }[],
      };
    }

    const coords = points.map((p) => ({ latitude: p.lat, longitude: p.lng }));

    // Calculer le centre et le zoom
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.4;
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.4;

    return {
      region: {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
      polylineCoords: coords,
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <View style={{
        height, borderRadius: 16, backgroundColor: colors.card,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: colors.textTertiary, fontSize: 14 }}>Aucun tracé disponible</Text>
      </View>
    );
  }

  // Sur web, react-native-maps ne fonctionne pas — afficher un placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={{
        height, borderRadius: 16, backgroundColor: colors.card,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}>
          Carte non disponible sur web
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
          {points.length} points · {formatDistance(distanceKm ?? 0)}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <MapView
        style={{ width: '100%', height }}
        initialRegion={region ?? undefined}
        region={region ?? undefined}
        showsUserLocation={false}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        customMapStyle={isDarkMode ? darkMapStyle : []}
      >
        <Polyline
          coordinates={polylineCoords}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
        {/* Marqueur de départ */}
        {polylineCoords.length > 0 && (
          <Marker coordinate={polylineCoords[0]} pinColor="#10B981" />
        )}
        {/* Marqueur d'arrivée */}
        {polylineCoords.length > 1 && (
          <Marker coordinate={polylineCoords[polylineCoords.length - 1]} pinColor="#EF4444" />
        )}
      </MapView>

      {showStats && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          flexDirection: 'row', justifyContent: 'space-around',
          paddingVertical: 8, paddingHorizontal: 12,
          backgroundColor: isDarkMode ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.9)',
        }}>
          <Stat label="Distance" value={formatDistance(distanceKm ?? 0)} color={colors.text} />
          {durationSec != null && durationSec > 0 && (
            <Stat label="Durée" value={formatDuration(durationSec)} color={colors.text} />
          )}
          {elevationGain != null && elevationGain > 0 && (
            <Stat label="D+" value={`${Math.round(elevationGain)}m`} color={colors.text} />
          )}
          <Stat label="Points" value={String(points.length)} color={colors.text} />
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color }}>{value}</Text>
    </View>
  );
}

// Style sombre pour la carte
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#666' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
];
