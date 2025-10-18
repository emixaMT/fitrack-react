import "../global.css";
import { Slot, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { AppState, Platform } from "react-native";
import { useEffect } from "react";
import React from "react";

import { supabase } from "../../config/supabaseConfig";
import { BadgeUnlockProvider } from "../../components/badges/BadgeUnlockProvider";
import { checkAndUnlockBadges } from "../../services/badgeService";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { LevelProvider } from "../../contexts/LevelContext";


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

export default function Layout() {
  const router = useRouter();

  useEffect(() => {
    // Notifications
    registerForPushNotificationsAsync();

    // Auth listener ✅
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/");
      } else {
        // Vérifier et débloquer les badges au démarrage (avec timeout)
        console.log('🔍 Vérification des badges au démarrage...');
        
        // Créer une promesse avec timeout de 10 secondes
        const checkWithTimeout = Promise.race([
          checkAndUnlockBadges(session.user.id),
          new Promise<[]>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: vérification trop longue')), 10000)
          )
        ]);

        try {
          const newBadges = await checkWithTimeout;
          if (newBadges.length > 0) {
            console.log(`🎉 ${newBadges.length} nouveau(x) badge(s) débloqué(s) au démarrage !`);
          } else {
            console.log('✅ Aucun nouveau badge à débloquer');
          }
        } catch (error: any) {
          if (error.message.includes('Timeout')) {
            console.warn('⚠️ La vérification des badges a pris trop de temps et a été annulée');
          } else {
            console.error('❌ Erreur lors de la vérification des badges:', error);
          }
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.replace("/");
      } else if (_event === 'SIGNED_IN') {
        // Vérifier aussi lors de la connexion (en arrière-plan, sans bloquer)
        console.log('🔍 Vérification des badges après connexion...');
        checkAndUnlockBadges(session.user.id)
          .then((badges) => {
            if (badges.length > 0) {
              console.log(`🎉 ${badges.length} nouveau(x) badge(s) débloqué(s) !`);
            }
          })
          .catch((error) => {
            console.error('❌ Erreur lors de la vérification des badges:', error);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <LevelProvider>
        <BadgeUnlockProvider>
          <Slot />
        </BadgeUnlockProvider>
      </LevelProvider>
    </ThemeProvider>
  );
}
