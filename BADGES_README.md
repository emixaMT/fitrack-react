# 🏆 Système de Badges - Guide d'Utilisation

## Vue d'ensemble

Un système de gamification complet avec badges et trophées pour votre application de fitness. Les badges sont débloqués automatiquement en fonction des actions des utilisateurs.

### ✨ Nouveauté : Support des Visuels Personnalisés !
Vous pouvez maintenant utiliser des **images personnalisées** pour vos badges au lieu des emojis ! 🎨  
→ Consultez **`BADGES_CUSTOM_IMAGES.md`** pour le guide complet

---

## 📋 Installation

### 1. Exécuter la Migration SQL

Copiez et exécutez le contenu du fichier `supabase_badges_migration.sql` dans le **SQL Editor** de votre projet Supabase :

1. Allez sur [supabase.com](https://supabase.com) et ouvrez votre projet
2. Cliquez sur **SQL Editor** dans le menu
3. Collez le contenu du fichier `supabase_badges_migration.sql`
4. Cliquez sur **Run** pour exécuter la migration

Cela créera :
- ✅ Table `badges` (tous les badges disponibles)
- ✅ Table `user_badges` (badges débloqués par utilisateur)
- ✅ 18 badges prédéfinis
- ✅ Policies RLS (Row Level Security)
- ✅ Fonctions SQL utilitaires

### 2. Activer le Temps Réel (Realtime)

Dans **Database → Replication** :
- ✅ Activez la réplication pour la table `user_badges`
- ✅ Activez la réplication pour la table `badges` (optionnel)

---

## 🎮 Utilisation

### Afficher les Badges dans votre App

#### Option 1 : Utiliser l'écran complet
```tsx
import BadgesScreen from './src/badges';

// Dans votre navigation
<Stack.Screen name="badges" component={BadgesScreen} />
```

#### Option 2 : Intégrer dans un écran existant
```tsx
import { useBadges } from './hooks/useBadges';
import { BadgeGrid, BadgeModal } from './components/badges';

function MyScreen() {
  const { data: { user } } = await supabase.auth.getUser();
  const { allBadges, userBadges, badgeStats, refresh } = useBadges(user?.id);
  
  return (
    <View>
      <Text>Badges débloqués : {badgeStats?.total_badges}</Text>
      <Text>Points : {badgeStats?.total_points}</Text>
      
      <BadgeGrid 
        allBadges={allBadges}
        userBadges={userBadges}
        onBadgePress={(badge, unlocked) => {
          // Ouvrir la modal
        }}
      />
    </View>
  );
}
```

### Vérifier et Débloquer les Badges

#### Automatiquement après une action
```tsx
import { checkAndUnlockBadges } from './services/badgeService';

// Après qu'un utilisateur complète une séance
async function onWorkoutComplete(userId: string) {
  // Vérifier et débloquer automatiquement les badges
  const newBadges = await checkAndUnlockBadges(userId);
  
  // Afficher une notification pour chaque nouveau badge
  newBadges.forEach(badge => {
    console.log('Nouveau badge débloqué !', badge.badge?.name);
    // Afficher une notification
  });
}
```

#### Manuellement pour un badge spécifique
```tsx
import { unlockBadge } from './services/badgeService';

// Débloquer un badge spécifique
await unlockBadge(userId, 'first_workout');
```

### Afficher une Notification de Badge

```tsx
import { BadgeNotification } from './components/badges';
import { Badge } from './services/badgeService';

function MyComponent() {
  const [notificationBadge, setNotificationBadge] = useState<Badge | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  
  // Quand un badge est débloqué
  const onBadgeUnlocked = (badge: Badge) => {
    setNotificationBadge(badge);
    setNotificationVisible(true);
  };
  
  return (
    <>
      {/* Votre contenu */}
      
      <BadgeNotification
        badge={notificationBadge}
        visible={notificationVisible}
        onDismiss={() => {
          setNotificationVisible(false);
          setNotificationBadge(null);
        }}
        duration={3000}
      />
    </>
  );
}
```

---

## 🏅 Badges Disponibles

### Badges de Volume (Entraînement)
| Code | Nom | Description | Condition | Points |
|------|-----|-------------|-----------|--------|
| `first_workout` | Premier Pas | Complétez votre première séance | 1 séance | 10 |
| `workout_10` | Débutant Motivé | Complétez 10 séances | 10 séances | 50 |
| `workout_50` | Athlète Régulier | Complétez 50 séances | 50 séances | 100 |
| `workout_100` | Centurion | Complétez 100 séances | 100 séances | 250 |
| `workout_250` | Légende | Complétez 250 séances | 250 séances | 500 |

### Badges de Consistance
| Code | Nom | Description | Condition | Points |
|------|-----|-------------|-----------|--------|
| `streak_7` | Semaine Parfaite | Entraînez-vous 7 jours d'affilée | 7 jours | 75 |
| `streak_30` | Un Mois de Fer | Entraînez-vous 30 jours d'affilée | 30 jours | 200 |
| `monthly_goal` | Objectif Mensuel | Atteignez votre objectif mensuel | 1 mois | 50 |
| `monthly_goal_3` | Triple Champion | Atteignez l'objectif 3 mois de suite | 3 mois | 150 |

### Badges de Performance
| Code | Nom | Description | Condition | Points |
|------|-----|-------------|-----------|--------|
| `heavy_lifter` | Force Brute | Soulevez plus de 100kg au squat | Squat ≥ 100kg | 100 |
| `bench_king` | Roi du Développé | Soulevez plus de 100kg au développé | Bench ≥ 100kg | 100 |
| `deadlift_beast` | Bête de Soulevé | Soulevez plus de 150kg au DL | Deadlift ≥ 150kg | 150 |

### Badges Spéciaux
| Code | Nom | Description | Condition | Points |
|------|-----|-------------|-----------|--------|
| `early_bird` | Lève-Tôt | Complétez une séance avant 8h | Séance < 8h | 25 |
| `note_taker` | Archiviste | Créez votre première note | 1 note | 10 |
| `note_master` | Maître des Notes | Créez 50 notes | 50 notes | 75 |
| `weight_tracker` | Suivi du Poids | Enregistrez votre poids 10 fois | 10 entrées | 25 |

### Badges par Type de Séance
| Code | Nom | Description | Condition | Points |
|------|-----|-------------|-----------|--------|
| `crossfit_lover` | Addict CrossFit | Complétez 20 séances de CrossFit | 20 CrossFit | 75 |
| `runner` | Coureur | Complétez 20 séances de running | 20 running | 75 |
| `cyclist` | Cycliste | Complétez 20 séances de vélo | 20 vélo | 75 |

---

## 🎨 Raretés des Badges

Les badges ont 4 niveaux de rareté avec des couleurs distinctes :

| Rareté | Couleur | Description |
|--------|---------|-------------|
| **Commun** | Gris (#9CA3AF) | Badges faciles à obtenir |
| **Rare** | Bleu (#3B82F6) | Nécessite un effort régulier |
| **Épique** | Violet (#A855F7) | Nécessite un engagement significatif |
| **Légendaire** | Or (#F59E0B) | Les badges les plus difficiles |

---

## 🔧 Personnalisation

### Ajouter un Nouveau Badge

1. **Dans Supabase (SQL Editor)** :
```sql
INSERT INTO public.badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'my_badge',           -- Code unique
  'Mon Badge',          -- Nom
  'Description cool',   -- Description
  '🎯',                 -- Icône (emoji)
  'special',            -- Catégorie
  'rare',               -- Rareté
  'custom_condition',   -- Type de condition
  100,                  -- Valeur de condition
  150                   -- Points
);
```

2. **Implémenter la logique de déblocage** dans `services/badgeService.ts` :
```ts
// Dans la fonction checkAndUnlockBadges()
if (maConditionEstRemplie) {
  const badge = await unlockBadge(userId, 'my_badge');
  if (badge) unlockedBadges.push(badge);
}
```

### Modifier les Couleurs

Dans `services/badgeService.ts`, modifiez la fonction `getRarityColor()` :
```ts
export const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'common':
      return '#VOTRE_COULEUR';
    // ...
  }
};
```

---

## 📊 API du Service

### Fonctions Principales

```ts
// Récupérer tous les badges
const badges = await getAllBadges();

// Récupérer les badges d'un utilisateur
const userBadges = await getUserBadges(userId);

// Récupérer les statistiques
const stats = await getUserBadgeStats(userId);

// Débloquer un badge
const badge = await unlockBadge(userId, 'badge_code');

// Vérifier automatiquement les badges
const newBadges = await checkAndUnlockBadges(userId);

// Marquer un badge comme vu
await markBadgeAsSeen(userBadgeId);

// Vérifier si un badge est débloqué
const hasBadge = await hasBadge(userId, 'badge_code');

// S'abonner aux changements en temps réel
const unsubscribe = subscribeToUserBadges(userId, (payload) => {
  console.log('Changement détecté', payload);
});
```

---

## 🎯 Bonnes Pratiques

### 1. Vérification des Badges
Appelez `checkAndUnlockBadges()` après chaque action importante :
- ✅ Après la création d'une séance
- ✅ Après l'ajout d'une note
- ✅ Après la mise à jour du poids
- ✅ Après la mise à jour des performances

### 2. Notifications
- Limitez les notifications à 1 par action
- Utilisez `is_new` pour suivre les badges non consultés
- Marquez les badges comme vus après affichage

### 3. Performance
- Le hook `useBadges` met en cache les données
- Les subscriptions temps réel sont automatiques
- Utilisez `refresh()` pour recharger manuellement

### 4. UX
- Affichez le nombre de badges débloqués dans l'interface
- Montrez la progression vers les prochains badges
- Utilisez des animations pour les déblocages

---

## 🚀 Intégration Rapide

### Ajouter au Menu de Navigation

```tsx
// Dans votre écran de profil ou menu
<TouchableOpacity onPress={() => navigation.navigate('badges')}>
  <Text>🏆 Mes Badges ({badgeStats?.total_badges})</Text>
  <Text>{badgeStats?.total_points} points</Text>
</TouchableOpacity>
```

### Afficher un Badge Indicator

```tsx
import { useBadges } from './hooks/useBadges';

function BadgeIndicator({ userId }) {
  const { badgeStats } = useBadges(userId);
  
  return (
    <View>
      <Text>🏆 {badgeStats?.total_badges}</Text>
    </View>
  );
}
```

---

## 🐛 Debugging

### Vérifier les Tables
```sql
-- Voir tous les badges
SELECT * FROM public.badges ORDER BY rarity, points;

-- Voir les badges d'un utilisateur
SELECT ub.*, b.* 
FROM public.user_badges ub
JOIN public.badges b ON ub.badge_id = b.id
WHERE ub.user_id = 'USER_ID_HERE';

-- Statistiques
SELECT * FROM public.user_badge_stats WHERE user_id = 'USER_ID_HERE';
```

### Tester le Déblocage Manuel
```ts
// Dans une fonction de test
await unlockBadge(userId, 'first_workout');
await unlockBadge(userId, 'workout_10');
```

### Réinitialiser les Badges d'un Utilisateur
```sql
-- ATTENTION : Cela supprime tous les badges d'un utilisateur
DELETE FROM public.user_badges WHERE user_id = 'USER_ID_HERE';
```

---

## 📱 Exemple Complet

Voir le fichier `src/badges.tsx` pour un exemple complet d'écran avec :
- ✅ Filtres par catégorie
- ✅ Grille de badges
- ✅ Modal de détails
- ✅ Notifications
- ✅ Statistiques
- ✅ Refresh pull-to-refresh

---

## 🎉 Fonctionnalités Futures

Idées pour étendre le système :
- [ ] Badges saisonniers (événements spéciaux)
- [ ] Badges secrets (conditions cachées)
- [ ] Leaderboard des points
- [ ] Récompenses pour certains badges (avatars, thèmes)
- [ ] Badges collaboratifs (défis entre amis)
- [ ] Progression en temps réel vers les badges
- [ ] Partage de badges sur les réseaux sociaux

---

## 💡 Support

Pour toute question ou problème :
1. Vérifiez les logs Supabase
2. Vérifiez les policies RLS
3. Vérifiez que le temps réel est activé
4. Consultez la documentation Supabase

---

**Système créé le** : 2025-10-16  
**Version** : 1.0.0
