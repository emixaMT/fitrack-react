// FILE: src/app/(tabs)/_layout.tsx
import React, { useEffect } from 'react';
import { Tabs, useRouter, useRootNavigationState } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebaseConfig';

export default function TabsLayout() {
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return; 
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace('/');
    });
    return unsub;
  }, [navState?.key, router]);

  if (!navState?.key) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Séances',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="note"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
