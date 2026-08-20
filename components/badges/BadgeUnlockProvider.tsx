import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BadgeUnlockModal } from './BadgeUnlockModal';
import { useBadgeUnlockNotification } from '../../hooks/useBadgeUnlockNotification';
import { supabase } from '../../config/supabaseConfig';

/**
 * Provider global pour afficher automatiquement les modals de badges débloqués
 * À placer au niveau racine de l'application
 */
export const BadgeUnlockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer l'utilisateur actuel
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { badge, dismissBadge, pendingCount } = useBadgeUnlockNotification(userId);

  return (
    <>
      {children}
      
      <BadgeUnlockModal
        visible={badge !== null}
        badge={badge}
        onClose={dismissBadge}
      />

      {/* Indicateur de badges en attente (optionnel) */}
      {pendingCount > 1 && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>
            +{pendingCount - 1} badge{pendingCount - 1 > 1 ? 's' : ''} en attente
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  pendingBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pendingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
