// FILE: hooks/useBadges.ts
import { useEffect, useState, useCallback } from 'react';
import {
  Badge,
  UserBadge,
  BadgeStats,
  getAllBadges,
  getUserBadges,
  getUserBadgeStats,
  checkAndUnlockBadges,
  subscribeToUserBadges,
} from '../services/badgeService';

export const useBadges = (userId: string | null) => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeStats, setBadgeStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les badges disponibles
  const loadAllBadges = useCallback(async () => {
    try {
      const badges = await getAllBadges();
      setAllBadges(badges);
    } catch (err) {
      console.error('Error loading all badges:', err);
      setError('Erreur lors du chargement des badges');
    }
  }, []);

  // Charger les badges de l'utilisateur
  const loadUserBadges = useCallback(async () => {
    if (!userId) return;

    try {
      const badges = await getUserBadges(userId);
      setUserBadges(badges);
    } catch (err) {
      console.error('Error loading user badges:', err);
      setError('Erreur lors du chargement de vos badges');
    }
  }, [userId]);

  // Charger les statistiques
  const loadBadgeStats = useCallback(async () => {
    if (!userId) return;

    try {
      const stats = await getUserBadgeStats(userId);
      setBadgeStats(stats);
    } catch (err) {
      console.error('Error loading badge stats:', err);
    }
  }, [userId]);

  // Vérifier et débloquer les badges
  const checkBadges = useCallback(async () => {
    if (!userId) return [];

    try {
      const newBadges = await checkAndUnlockBadges(userId);
      if (newBadges.length > 0) {
        // Recharger les badges de l'utilisateur
        await loadUserBadges();
        await loadBadgeStats();
      }
      return newBadges;
    } catch (err) {
      console.error('Error checking badges:', err);
      return [];
    }
  }, [userId, loadUserBadges, loadBadgeStats]);

  // Recharger toutes les données
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadAllBadges(),
        loadUserBadges(),
        loadBadgeStats(),
      ]);
    } catch (err) {
      console.error('Error refreshing badges:', err);
    } finally {
      setLoading(false);
    }
  }, [loadAllBadges, loadUserBadges, loadBadgeStats]);

  // Charger les données au montage
  useEffect(() => {
    refresh();
  }, [userId]);

  // S'abonner aux changements en temps réel
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserBadges(userId, (payload) => {
      console.log('Badge update:', payload);
      loadUserBadges();
      loadBadgeStats();
    });

    return () => {
      unsubscribe();
    };
  }, [userId, loadUserBadges, loadBadgeStats]);

  return {
    allBadges,
    userBadges,
    badgeStats,
    loading,
    error,
    refresh,
    checkBadges,
  };
};
