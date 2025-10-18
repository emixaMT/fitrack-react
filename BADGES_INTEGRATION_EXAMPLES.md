# 🎮 Exemples d'Intégration des Badges

Ce fichier contient des exemples concrets pour intégrer le système de badges dans votre application.

---

## 1. 💪 Après la Création d'une Séance

Débloque automatiquement les badges liés aux séances d'entraînement.

```tsx
// Dans votre fonction de création de séance
import { checkAndUnlockBadges } from '../services/badgeService';
import { BadgeNotification } from '../components/badges';

async function createWorkoutSession(userId: string, workoutData: any) {
  try {
    // 1. Créer la séance
    const { data, error } = await supabase
      .from('seances')
      .insert({
        nom: workoutData.name,
        category: workoutData.category,
        id_user: userId,
        exercices: workoutData.exercices,
      });

    if (error) throw error;

    // 2. Vérifier et débloquer les badges
    const newBadges = await checkAndUnlockBadges(userId);
    
    // 3. Afficher une notification pour chaque badge débloqué
    if (newBadges.length > 0) {
      // Afficher le premier badge débloqué
      const badge = newBadges[0].badge;
      if (badge) {
        // Afficher la notification (voir exemple de state ci-dessous)
        showBadgeNotification(badge);
      }
    }

    return { success: true, newBadges };
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
}
```

### Component avec notification

```tsx
import React, { useState } from 'react';
import { BadgeNotification } from '../components/badges';
import { Badge } from '../services/badgeService';

function WorkoutScreen() {
  const [notificationBadge, setNotificationBadge] = useState<Badge | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const showBadgeNotification = (badge: Badge) => {
    setNotificationBadge(badge);
    setNotificationVisible(true);
  };

  const handleCreateWorkout = async () => {
    const result = await createWorkoutSession(userId, workoutData);
    
    // Afficher une notification si des badges sont débloqués
    if (result.newBadges.length > 0) {
      showBadgeNotification(result.newBadges[0].badge!);
    }
  };

  return (
    <>
      {/* Votre interface de création de séance */}
      <Button onPress={handleCreateWorkout}>Créer la séance</Button>

      {/* Notification de badge */}
      <BadgeNotification
        badge={notificationBadge}
        visible={notificationVisible}
        onDismiss={() => {
          setNotificationVisible(false);
          setNotificationBadge(null);
        }}
      />
    </>
  );
}
```

---

## 2. 📝 Après la Création d'une Note

```tsx
import { checkAndUnlockBadges } from '../services/badgeService';

async function createNote(userId: string, content: string) {
  try {
    // Créer la note
    const { data, error } = await supabase
      .from('notes')
      .insert({
        content,
        id_user: userId,
      });

    if (error) throw error;

    // Vérifier les badges
    const newBadges = await checkAndUnlockBadges(userId);
    
    return { success: true, newBadges };
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}
```

---

## 3. ⚖️ Après l'Ajout d'une Entrée de Poids

```tsx
import { checkAndUnlockBadges } from '../services/badgeService';

async function addWeightEntry(userId: string, weight: number) {
  try {
    // Ajouter l'entrée de poids
    const { data, error } = await supabase
      .from('weight_entries')
      .insert({
        user_id: userId,
        value: weight,
        date: new Date().toISOString(),
      });

    if (error) throw error;

    // Vérifier les badges
    const newBadges = await checkAndUnlockBadges(userId);
    
    return { success: true, newBadges };
  } catch (error) {
    console.error('Error adding weight entry:', error);
    throw error;
  }
}
```

---

## 4. 🏋️ Après la Mise à Jour des Performances

```tsx
import { checkAndUnlockBadges } from '../services/badgeService';

async function updatePerformances(
  userId: string, 
  type: 'squat' | 'bench' | 'deadlift',
  value: number
) {
  try {
    // Mettre à jour les performances
    const { data, error } = await supabase
      .from('performances')
      .upsert({
        user_id: userId,
        [type]: value,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Vérifier les badges
    const newBadges = await checkAndUnlockBadges(userId);
    
    return { success: true, newBadges };
  } catch (error) {
    console.error('Error updating performances:', error);
    throw error;
  }
}
```

---

## 5. 👤 Afficher les Badges dans le Profil Utilisateur

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useBadges } from '../hooks/useBadges';
import { BadgeItem } from '../components/badges';
import { useNavigation } from '@react-navigation/native';

function UserProfile({ userId }: { userId: string }) {
  const { userBadges, badgeStats } = useBadges(userId);
  const navigation = useNavigation();

  // Afficher les 3 derniers badges débloqués
  const recentBadges = userBadges.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Badges</Text>
        <TouchableOpacity onPress={() => navigation.navigate('badges')}>
          <Text style={styles.seeAll}>Voir tous →</Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{badgeStats?.total_badges || 0}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{badgeStats?.total_points || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {/* Derniers badges débloqués */}
      <View style={styles.badgeList}>
        {recentBadges.map((userBadge) => (
          userBadge.badge && (
            <BadgeItem
              key={userBadge.id}
              badge={userBadge.badge}
              unlocked={true}
              size="small"
            />
          )
        ))}
      </View>

      {recentBadges.length === 0 && (
        <Text style={styles.emptyText}>
          Aucun badge débloqué pour le moment
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  badgeList: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
```

---

## 6. 🔔 Vérifier les Nouveaux Badges au Démarrage

Vérifiez les badges au chargement de l'app pour détecter les badges qui auraient pu être débloqués.

```tsx
// Dans votre App.tsx ou composant principal
import React, { useEffect, useState } from 'react';
import { checkAndUnlockBadges } from './services/badgeService';
import { supabase } from './config/supabaseConfig';

function App() {
  useEffect(() => {
    // Vérifier les badges au chargement
    const checkBadgesOnStartup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const newBadges = await checkAndUnlockBadges(user.id);
        
        if (newBadges.length > 0) {
          console.log(`${newBadges.length} nouveaux badges débloqués !`);
          // Vous pouvez afficher une notification ou un indicateur
        }
      }
    };

    checkBadgesOnStartup();
  }, []);

  return (
    // Votre app
  );
}
```

---

## 7. 📊 Widget de Progression vers un Badge

Affichez la progression vers le prochain badge.

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../config/supabaseConfig';
import { hasBadge } from '../services/badgeService';

function BadgeProgressWidget({ userId }: { userId: string }) {
  const [workoutCount, setWorkoutCount] = useState(0);
  const [hasFirstBadge, setHasFirstBadge] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    // Compter les séances
    const { data: seances } = await supabase
      .from('seances')
      .select('*')
      .eq('id_user', userId);
    
    setWorkoutCount(seances?.length || 0);

    // Vérifier si le premier badge est déjà débloqué
    const hasIt = await hasBadge(userId, 'workout_10');
    setHasFirstBadge(hasIt);
  };

  const target = 10;
  const progress = Math.min((workoutCount / target) * 100, 100);

  if (hasFirstBadge) {
    return null; // Badge déjà débloqué
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Prochain badge</Text>
      <Text style={styles.badgeName}>Débutant Motivé</Text>
      <Text style={styles.progress}>
        {workoutCount} / {target} séances
      </Text>
      
      {/* Barre de progression */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  progress: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
});
```

---

## 8. 🎊 Modal de Célébration Personnalisée

Créez une modal personnalisée pour célébrer le déblocage d'un badge.

```tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Badge, getRarityColor } from '../services/badgeService';

interface CelebrationModalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
}

export function CelebrationModal({ visible, badge, onClose }: CelebrationModalProps) {
  if (!badge) return null;

  const rarityColor = getRarityColor(badge.rarity);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Confettis emoji */}
          <Text style={styles.confetti}>🎉</Text>
          <Text style={styles.confetti}>🎊</Text>
          
          {/* Badge Icon */}
          <View style={[styles.iconCircle, { borderColor: rarityColor }]}>
            <Text style={styles.icon}>{badge.icon || '🏆'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Félicitations !</Text>
          
          {/* Badge Name */}
          <Text style={styles.badgeName}>{badge.name}</Text>
          
          {/* Points */}
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>+{badge.points} points</Text>
          </View>

          {/* Description */}
          {badge.description && (
            <Text style={styles.description}>{badge.description}</Text>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Super ! 🎯</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
  },
  confetti: {
    fontSize: 40,
    position: 'absolute',
    top: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    marginBottom: 24,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 16,
    textAlign: 'center',
  },
  pointsContainer: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
```

---

## 9. 🔥 Indicateur de Nouveaux Badges (Badge Counter)

Affichez un compteur de nouveaux badges dans votre navigation.

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getNewBadges } from '../services/badgeService';

function BadgeCounter({ userId }: { userId: string }) {
  const [newBadgeCount, setNewBadgeCount] = useState(0);

  useEffect(() => {
    loadNewBadges();
  }, [userId]);

  const loadNewBadges = async () => {
    const newBadges = await getNewBadges(userId);
    setNewBadgeCount(newBadges.length);
  };

  if (newBadgeCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{newBadgeCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// Utilisation dans votre navigation
<TouchableOpacity onPress={() => navigation.navigate('badges')}>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text>🏆 Badges</Text>
    <BadgeCounter userId={userId} />
  </View>
</TouchableOpacity>
```

---

## 10. 🎯 Badge Challenge du Jour

Suggérez un défi quotidien pour débloquer un badge.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function DailyChallenge() {
  // Exemple de défi
  const challenge = {
    icon: '🌅',
    title: 'Lève-Tôt',
    description: 'Complète une séance avant 8h du matin',
    badgeCode: 'early_bird',
    points: 25,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🎯 Défi du jour</Text>
      
      <View style={styles.challenge}>
        <Text style={styles.icon}>{challenge.icon}</Text>
        
        <View style={styles.content}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>
          <Text style={styles.points}>Récompense : {challenge.points} points</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Relever le défi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  points: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

---

## 🎨 Conseils d'Intégration

### Timing des Vérifications
- ✅ **Après chaque action** : Vérifiez immédiatement après une action utilisateur
- ✅ **Au démarrage** : Vérifiez une fois au chargement de l'app
- ❌ **Pas en boucle** : Ne vérifiez pas continuellement (gaspillage de ressources)

### UX des Notifications
- Limitez à 1 notification à la fois
- Utilisez des animations fluides
- Donnez la possibilité de fermer rapidement
- Marquez les badges comme vus après affichage

### Performance
- Utilisez le hook `useBadges` qui met en cache les données
- Les vérifications sont rapides (1-2 requêtes)
- Les subscriptions temps réel évitent les rechargements inutiles

---

**Bon développement ! 🚀**
