import * as Notifications from 'expo-notifications';
import React from 'react';
import { Button } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotifyExample() {
    const sendTestNotification = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
            title: "🔥 Test de notification",
            body: "Ceci est une notif locale",
            },
            trigger: null, // immédiat
        });
    };

  return <Button title="Test Notification" onPress={sendTestNotification} />;
}
