import "../global.css";
import { Slot, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { AppState, Platform } from "react-native";
import { useEffect } from "react";
import React from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebaseConfig"; // adapte si chemin différent


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
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // si pas connecté, renvoyer à la page login
        router.replace("/");
      }
    });

    return unsub;
  }, []);

  return <Slot />;
}
