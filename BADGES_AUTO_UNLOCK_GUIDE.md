# 🎯 Guide de Déblocage Automatique des Badges

## 📋 Liste des Conditions Implémentées

### ✅ Badges Communs (4)

| Badge | Code | Condition | Points |
|-------|------|-----------|--------|
| Premier Pas | `first_workout` | Complétez 1 séance | 10 |
| Archiviste | `note_taker` | Créez 1 note | 10 |
| Suivi du Poids | `weight_tracker` | Enregistrez 10 entrées de poids | 25 |
| Objectif Mensuel | `monthly_goal` | Atteignez votre objectif ce mois | 50 |

### ✅ Badges Rares (10)

| Badge | Code | Condition | Points |
|-------|------|-----------|--------|
| Débutant Motivé | `workout_10` | Complétez 10 séances | 50 |
| Athlète Régulier | `workout_50` | Complétez 50 séances | 100 |
| Lève-Tôt | `early_bird` | Séance avant 8h du matin | 25 |
| Force Brute | `heavy_lifter` | Squat ≥ 100kg | 100 |
| Roi du Développé | `bench_king` | Bench press ≥ 100kg | 100 |
| Maître des Notes | `note_master` | Créez 50 notes | 75 |
| Addict CrossFit | `crossfit_lover` | 20 séances de CrossFit | 75 |
| Coureur | `runner` | 20 séances de running | 75 |
| Cycliste | `cyclist` | 20 séances de vélo | 75 |
| Semaine Parfaite | `streak_7` | 7 jours consécutifs d'entraînement | 75 |

### ✅ Badges Épiques (4)

| Badge | Code | Condition | Points |
|-------|------|-----------|--------|
| Centurion | `workout_100` | Complétez 100 séances | 250 |
| Un Mois de Fer | `streak_30` | 30 jours consécutifs d'entraînement | 200 |
| Bête de Soulevé | `deadlift_beast` | Deadlift ≥ 150kg | 150 |
| Triple Champion | `monthly_goal_3` | Objectif atteint 3 mois de suite | 150 |

### ✅ Badges Légendaires (1)

| Badge | Code | Condition | Points |
|-------|------|-----------|--------|
| Légende | `workout_250` | Complétez 250 séances | 500 |

---

## 🔧 Comment Déclencher la Vérification

### **Méthode 1 : Après chaque action**

Appelez `checkAndUnlockBadges()` après :
- ✅ Créer une séance
- ✅ Mettre à jour les performances
- ✅ Créer une note
- ✅ Enregistrer le poids

#### Exemple : Après création d'une séance

```typescript
// Dans votre fonction de création de séance
import { checkAndUnlockBadges } from '../services/badgeService';

const createSeance = async (userId: string, seanceData: any) => {
  // 1. Créer la séance
  const { data, error } = await supabase
    .from('seances')
    .insert(seanceData);

  if (error) throw error;

  // 2. Vérifier les badges
  const newBadges = await checkAndUnlockBadges(userId);
  
  // 3. Si de nouveaux badges ont été débloqués
  if (newBadges.length > 0) {
    console.log(`🎉 ${newBadges.length} nouveau(x) badge(s) débloqué(s)!`);
    // Afficher une notification, modal, etc.
  }

  return data;
};
```

#### Exemple : Après mise à jour des performances

```typescript
import { checkAndUnlockBadges } from '../services/badgeService';

const updatePerformances = async (userId: string, perfData: any) => {
  // 1. Mettre à jour les performances
  const { data, error } = await supabase
    .from('performances')
    .upsert(perfData);

  if (error) throw error;

  // 2. Vérifier les badges
  await checkAndUnlockBadges(userId);

  return data;
};
```

### **Méthode 2 : Hook personnalisé**

Créez un hook pour vérifier automatiquement :

```typescript
// hooks/useBadgeChecker.ts
import { useEffect } from 'react';
import { checkAndUnlockBadges } from '../services/badgeService';
import { supabase } from '../config/supabaseConfig';

export const useBadgeChecker = () => {
  useEffect(() => {
    const checkBadges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await checkAndUnlockBadges(user.id);
      }
    };

    // Vérifier au chargement
    checkBadges();

    // Vérifier périodiquement (optionnel)
    const interval = setInterval(checkBadges, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, []);
};

// Utilisation dans un composant
import { useBadgeChecker } from '../hooks/useBadgeChecker';

const HomeScreen = () => {
  useBadgeChecker(); // Active la vérification automatique
  
  return <View>...</View>;
};
```

### **Méthode 3 : Au chargement de l'app**

```typescript
// App.tsx ou _layout.tsx
import { useEffect } from 'react';
import { checkAndUnlockBadges } from './services/badgeService';
import { supabase } from './config/supabaseConfig';

export default function App() {
  useEffect(() => {
    const initBadges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await checkAndUnlockBadges(user.id);
      }
    };

    initBadges();
  }, []);

  return <YourApp />;
}
```

---

## 🎯 Vérification Manuelle (Test)

### Script TypeScript

```typescript
// scripts/checkBadges.ts
import { checkAndUnlockBadges } from '../services/badgeService';

const USER_ID = '93b0400c-3a5e-4878-a573-6796c08cebb7';

async function testBadgeUnlock() {
  console.log('🔍 Vérification des badges...');
  
  const newBadges = await checkAndUnlockBadges(USER_ID);
  
  console.log(`✅ ${newBadges.length} badge(s) débloqué(s)`);
  
  newBadges.forEach(badge => {
    if (badge.badge) {
      console.log(`  - ${badge.badge.name} (+${badge.badge.points} points)`);
    }
  });
}

testBadgeUnlock();
```

Exécuter :
```bash
npx ts-node scripts/checkBadges.ts
```

---

## 📊 Tables Nécessaires

### Table `profiles` (pour objectifs mensuels)

```sql
-- Si la colonne n'existe pas, ajoutez-la
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS monthly_goal INTEGER DEFAULT 12;

-- Définir un objectif pour votre utilisateur
UPDATE profiles 
SET monthly_goal = 12 
WHERE id = '93b0400c-3a5e-4878-a573-6796c08cebb7';
```

### Table `seances` (pour les streaks)

Assurez-vous que vos séances ont :
- ✅ `id_user` : UUID de l'utilisateur
- ✅ `created_at` : Timestamp de création
- ✅ `category` : Type de séance ('crossfit', 'running', 'velo', 'musculation')

### Table `performances` (pour les PRs)

Assurez-vous d'avoir :
- ✅ `user_id` : UUID
- ✅ `squat` : INTEGER
- ✅ `bench` : INTEGER
- ✅ `deadlift` : INTEGER

---

## 🧪 Tester les Conditions

### 1. Tester le badge "Premier Pas"

```sql
-- Créer une séance de test
INSERT INTO seances (id_user, category, created_at)
VALUES ('93b0400c-3a5e-4878-a573-6796c08cebb7', 'musculation', NOW());

-- Puis exécutez checkAndUnlockBadges()
```

### 2. Tester le badge "Lève-Tôt"

```sql
-- Créer une séance avant 8h
INSERT INTO seances (id_user, category, created_at)
VALUES ('93b0400c-3a5e-4878-a573-6796c08cebb7', 'musculation', '2024-10-16 07:30:00');
```

### 3. Tester les badges de performance

```sql
-- Mettre à jour les performances
INSERT INTO performances (user_id, squat, bench, deadlift)
VALUES ('93b0400c-3a5e-4878-a573-6796c08cebb7', 120, 105, 160)
ON CONFLICT (user_id) 
DO UPDATE SET squat = 120, bench = 105, deadlift = 160;
```

### 4. Tester le streak de 7 jours

```sql
-- Créer 7 séances sur 7 jours consécutifs
DO $$
BEGIN
  FOR i IN 0..6 LOOP
    INSERT INTO seances (id_user, category, created_at)
    VALUES (
      '93b0400c-3a5e-4878-a573-6796c08cebb7',
      'musculation',
      (NOW() - (i || ' days')::INTERVAL)
    );
  END LOOP;
END $$;
```

---

## 🎨 Afficher les Nouveaux Badges

### Avec le Hook useBadges

Le hook `useBadges` détecte automatiquement les nouveaux badges grâce à `is_new`.

```typescript
import { useBadges } from '../hooks/useBadges';
import { BadgeNotification } from '../components/badges';

const MyComponent = () => {
  const { newBadges } = useBadges(userId);

  return (
    <>
      {newBadges.map(userBadge => (
        userBadge.badge && (
          <BadgeNotification
            key={userBadge.id}
            badge={userBadge.badge}
            visible={true}
            onDismiss={() => markBadgeAsSeen(userBadge.id)}
          />
        )
      ))}
    </>
  );
};
```

---

## 🔄 Workflow Recommandé

### 1. **Installation Initiale**
```bash
# Ajouter la colonne monthly_goal si nécessaire
psql > ALTER TABLE profiles ADD COLUMN monthly_goal INTEGER DEFAULT 12;
```

### 2. **Après Chaque Action Utilisateur**
```typescript
// Exemple : après création de séance
await supabase.from('seances').insert(seanceData);
await checkAndUnlockBadges(userId);
```

### 3. **Notification Automatique**
```typescript
// Le hook useBadges gère l'affichage
const { newBadges } = useBadges(userId);
```

### 4. **Marquer comme Vu**
```typescript
await markBadgeAsSeen(badgeId);
// ou
await markAllBadgesAsSeen(userId);
```

---

## 📋 Checklist d'Intégration

- [ ] Ajouter `monthly_goal` à la table `profiles`
- [ ] Définir l'objectif mensuel pour les utilisateurs
- [ ] Appeler `checkAndUnlockBadges()` après création de séance
- [ ] Appeler `checkAndUnlockBadges()` après mise à jour performances
- [ ] Appeler `checkAndUnlockBadges()` après création de note
- [ ] Appeler `checkAndUnlockBadges()` après enregistrement poids
- [ ] Tester chaque condition individuellement
- [ ] Vérifier l'affichage des notifications
- [ ] Implémenter `markBadgeAsSeen()` dans l'UI

---

## 🎉 C'est Prêt !

Toutes les conditions de déblocage sont implémentées. Il vous suffit maintenant de :
1. ✅ Supprimer vos badges actuels (SQL fourni)
2. ✅ Appeler `checkAndUnlockBadges()` aux bons endroits
3. ✅ Tester les différentes conditions

Les badges se débloquent automatiquement ! 🚀
