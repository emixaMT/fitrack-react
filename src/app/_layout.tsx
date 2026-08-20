import "../global.css";
import { Slot } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useEffect } from "react";
import React from "react";

import { checkAndUnlockBadges } from "../../services/badgeService";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { LevelProvider } from "../../contexts/LevelContext";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import { BadgeUnlockProvider } from "../../components/badges/BadgeUnlockProvider";


async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Permission refusée pour les notifications");
      return;
    }
  } else {
    alert("Doit être testé sur un vrai appareil");
  }
}

// Vérifie les badges au démarrage et à la connexion (avec timeout de sécurité)
function BadgeChecker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkWithTimeout = Promise.race([
      checkAndUnlockBadges(user.id),
      new Promise<[]>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      ),
    ]);

    checkWithTimeout
      .then((newBadges) => {
        if (newBadges.length > 0 && __DEV__) {
          console.log(`🎉 ${newBadges.length} nouveau(x) badge(s) débloqué(s)`);
        }
      })
      .catch((error) => {
        if (__DEV__) {
          if (error.message.includes('Timeout')) {
            console.warn('⚠️ Vérification badges timeout');
          } else {
            console.error('❌ Erreur vérification badges:', error);
          }
        }
      });
  }, [user?.id]);

  return null;
}

export default function Layout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <LevelProvider>
          <BadgeUnlockProvider>
            <BadgeChecker />
            <Slot />
          </BadgeUnlockProvider>
        </LevelProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
