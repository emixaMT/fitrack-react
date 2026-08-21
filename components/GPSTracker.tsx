// components/GPSTracker.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Polyline, Marker } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { TrackPoint, formatDistance, formatDuration, generateGPX } from '../utils/gpx';
import * as Haptics from 'expo-haptics';

interface GPSTrackerProps {
  visible: boolean;
  onClose: (points: TrackPoint[] | null) => void;
}

export default function GPSTracker({ visible, onClose }: GPSTrackerProps) {
  const { colors, isDarkMode } = useTheme();
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pointsRef = useRef<TrackPoint[]>([]);

  // Demander la permission au montage
  useEffect(() => {
    if (!visible) return;
    requestPermission();
  }, [visible]);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionGranted(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Active la localisation pour utiliser le tracking GPS.',
        );
      } else {
        // Obtenir la position initiale
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(loc);
      }
    } catch {
      setPermissionGranted(false);
    }
  };

  // Garder pointsRef synchronisé
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const startTracking = useCallback(async () => {
    if (!permissionGranted) {
      await requestPermission();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTracking(true);
    setPoints([]);
    setElapsed(0);
    startTimeRef.current = Date.now();

    // Timer pour le chronomètre
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Souscription GPS
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 5, // Au moins 5m entre chaque point
        },
        (location) => {
          setCurrentLocation(location);
          const newPoint: TrackPoint = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            ele: location.coords.altitude ?? undefined,
            time: new Date(location.timestamp).toISOString(),
          };
          setPoints((prev) => [...prev, newPoint]);
        }
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de démarrer le tracking GPS.');
      setTracking(false);
    }
  }, [permissionGranted]);

  const stopTracking = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTracking(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  const handleFinish = useCallback(() => {
    stopTracking();
    const finalPoints = pointsRef.current;
    if (finalPoints.length < 2) {
      Alert.alert('Trace trop courte', 'Il faut au moins 2 points GPS pour enregistrer une trace.');
      return;
    }
    onClose(finalPoints);
    // Reset
    setPoints([]);
    setElapsed(0);
    setCurrentLocation(null);
  }, [stopTracking, onClose]);

  const handleCancel = useCallback(() => {
    stopTracking();
    setPoints([]);
    setElapsed(0);
    setCurrentLocation(null);
    onClose(null);
  }, [stopTracking, onClose]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, []);

  // Stats en temps réel
  const liveStats = React.useMemo(() => {
    if (points.length < 2) return { distance: 0, speed: 0 };
    const gpx = generateGPX(points, 'live');
    const speed = gpx.durationSec > 0 ? (gpx.distanceKm / gpx.durationSec) * 3600 : 0;
    return { distance: gpx.distanceKm, speed };
  }, [points]);

  const polylineCoords = points.map((p) => ({ latitude: p.lat, longitude: p.lng }));

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 12,
        }}>
          <Pressable
            onPress={handleCancel}
            hitSlop={12}
            style={{ padding: 8, borderRadius: 12, backgroundColor: colors.divider }}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            Tracking GPS
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Carte */}
        {Platform.OS !== 'web' ? (
          <MapView
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            region={currentLocation ? {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            } : undefined}
            showsUserLocation
            followsUserLocation={tracking}
            customMapStyle={isDarkMode ? [
              { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
              { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            ] : []}
          >
            {polylineCoords.length > 0 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor={colors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>Tracking GPS non disponible sur web</Text>
          </View>
        )}

        {/* Stats overlay */}
        <View style={{
          position: 'absolute', top: Platform.OS === 'ios' ? 110 : 70, left: 16, right: 16,
          flexDirection: 'row', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
          backgroundColor: isDarkMode ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.95)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
          elevation: 4,
        }}>
          <StatBlock label="Temps" value={formatDuration(elapsed)} color={colors.text} />
          <StatBlock label="Distance" value={formatDistance(liveStats.distance)} color={colors.text} />
          <StatBlock label="Vitesse" value={`${liveStats.speed.toFixed(1)} km/h`} color={colors.text} />
          <StatBlock label="Points" value={String(points.length)} color={colors.text} />
        </View>

        {/* Boutons de contrôle */}
        <View style={{
          paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16,
          backgroundColor: colors.background,
        }}>
          {!tracking ? (
            <Pressable
              onPress={startTracking}
              style={{
                borderRadius: 16, paddingVertical: 18, alignItems: 'center',
                backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', gap: 8,
              }}
            >
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
                {points.length > 0 ? 'Reprendre' : 'Démarrer'}
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={stopTracking}
                style={{
                  flex: 1, borderRadius: 16, paddingVertical: 18, alignItems: 'center',
                  backgroundColor: colors.divider, flexDirection: 'row', justifyContent: 'center', gap: 8,
                }}
              >
                <Ionicons name="pause" size={22} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Pause</Text>
              </Pressable>
              <Pressable
                onPress={handleFinish}
                style={{
                  flex: 1, borderRadius: 16, paddingVertical: 18, alignItems: 'center',
                  backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', gap: 8,
                }}
              >
                <Ionicons name="checkmark-done" size={22} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Terminer</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color }}>{value}</Text>
    </View>
  );
}
