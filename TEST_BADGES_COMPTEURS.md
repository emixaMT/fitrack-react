# 🏆 Test des Badges avec le Nouveau Système de Compteurs

## 🔧 Ce qui a été corrigé

Le système de badges lit maintenant depuis `session_counters` au lieu de `seances`.

### Avant ❌
```typescript
const { data: seances } = await supabase
  .from('seances')
  .select('*')
  .eq('id_user', userId);

const seanceCount = seances?.length || 0;
```

### Maintenant ✅
```typescript
// Utilise getTotalHistoricalSessions()
const seanceCount = await getTotalHistoricalSessions(userId);
```

---

## 🧪 Test manuel

### Étape 1 : Vérifier vos compteurs actuels

Dans Supabase SQL Editor :
```sql
-- Voir le total de vos séances
SELECT 
  SUM(count) as total_seances
FROM session_counters
WHERE user_id = auth.uid();

-- Voir le détail par type
SELECT 
  sport_type,
  SUM(count) as total
FROM session_counters
WHERE user_id = auth.uid()
GROUP BY sport_type;
```

### Étape 2 : Forcer la vérification des badges

Dans votre application :
1. Ouvrez la console (F12)
2. Allez sur la page **Home**
3. Ajoutez +1 séance (n'importe quel type)
4. La fonction `checkAndUnlockBadges()` est appelée automatiquement

**Dans la console, vous devriez voir :**
```
[Badge] 📊 Chargement des données utilisateur...
[Badge] ✅ Données chargées: 10 séances (compteurs), X notes, Y poids
[Badge] 🔍 Vérification des streaks...
[Badge] 🎯 Vérification des objectifs mensuels...
[Badge] 🏆 Vérification des objectifs consécutifs...
[Badge] ✅ Vérification terminée: 1 nouveau(x) badge(s)
```

### Étape 3 : Vérifier que le badge "Débutant Motivé" est débloqué

Si vous avez 10 séances ou plus :
```sql
-- Vérifier si le badge est débloqué
SELECT 
  b.name,
  b.description,
  ub.unlocked_at
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
WHERE ub.user_id = auth.uid()
  AND b.code = 'workout_10';
```

✅ **Si une ligne est retournée** → Le badge est débloqué !
❌ **Si vide** → Voir section Dépannage

---

## 🐛 Dépannage

### ❌ "J'ai 10 séances mais pas le badge"

**1. Vérifier que les compteurs sont corrects**
```sql
SELECT SUM(count) as total FROM session_counters WHERE user_id = auth.uid();
```

Si le total est < 10, c'est normal que le badge ne soit pas débloqué.

**2. Migrer vos anciennes séances**
Si vous aviez des séances dans la table `seances` avant le nouveau système :
```sql
-- Exécuter le script de migration
-- migrations/migrate_existing_seances.sql
```

**3. Forcer la vérification des badges**
Dans Supabase SQL Editor :
```sql
-- Appeler manuellement la vérification (si une fonction existe)
-- OU ajouter +1 séance dans l'app pour déclencher checkAndUnlockBadges()
```

**4. Vérifier les logs dans la console**
```javascript
// Vous devriez voir :
[Badge] ✅ Données chargées: 10 séances (compteurs), ...
```

Si vous voyez `0 séances (compteurs)`, le problème vient des compteurs, pas des badges.

---

### ❌ Erreur "getTotalHistoricalSessions is not defined"

**Solution :** Vérifier que l'import est correct dans `badgeService.ts` :
```typescript
import { getTotalHistoricalSessions, getTotalByType } from './sessionCounterService';
```

---

### ❌ Les badges par type ne se débloquent pas

**Exemples :**
- "Guerrier de la Force" (20 séances musculation/crossfit)
- "Champion d'Endurance" (20 séances running/vélo)

**Vérification :**
```sql
-- Vérifier vos totaux par type
SELECT 
  sport_type,
  SUM(count) as total
FROM session_counters
WHERE user_id = auth.uid()
GROUP BY sport_type;
```

**Calcul manuel :**
- Guerrier de la Force = musculation + crossfit ≥ 20
- Champion d'Endurance = running + velo ≥ 20
- Athlète Polyvalent = chaque type ≥ 10

---

## 📊 Badges disponibles et conditions

| Badge | Code | Condition | Système |
|-------|------|-----------|---------|
| Premier Pas | `first_workout` | 1 séance | ✅ Compteurs |
| Débutant Motivé | `workout_10` | 10 séances | ✅ Compteurs |
| Athlète Régulier | `workout_50` | 50 séances | ✅ Compteurs |
| Centurion | `workout_100` | 100 séances | ✅ Compteurs |
| Légende | `workout_250` | 250 séances | ✅ Compteurs |
| Guerrier de la Force | `strength_warrior` | 20 muscu/crossfit | ✅ Compteurs |
| Maître de la Force | `strength_master` | 50 muscu/crossfit | ✅ Compteurs |
| Champion d'Endurance | `endurance_runner` | 20 running/vélo | ✅ Compteurs |
| Bête d'Endurance | `endurance_beast` | 50 running/vélo | ✅ Compteurs |
| Athlète Polyvalent | `versatile_athlete` | 10 de chaque type | ✅ Compteurs |
| Lève-Tôt | `early_bird` | 1 séance avant 8h | ⚠️ Utilise `seances` |
| Semaine Parfaite | `streak_7` | 7 jours de streak | ✅ Utilise `streak_history` |
| Un Mois de Fer | `streak_30` | 30 jours de streak | ✅ Utilise `streak_history` |

---

## 🧪 Script de test SQL complet

```sql
-- ===================================
-- TEST COMPLET DU SYSTÈME DE BADGES
-- ===================================

-- 1. Vérifier vos compteurs
SELECT 
  'Total séances' as metric,
  SUM(count) as value
FROM session_counters
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Musculation' as metric,
  SUM(count) as value
FROM session_counters
WHERE user_id = auth.uid() AND sport_type = 'musculation'

UNION ALL

SELECT 
  'CrossFit' as metric,
  SUM(count) as value
FROM session_counters
WHERE user_id = auth.uid() AND sport_type = 'crossfit'

UNION ALL

SELECT 
  'Running' as metric,
  SUM(count) as value
FROM session_counters
WHERE user_id = auth.uid() AND sport_type = 'running'

UNION ALL

SELECT 
  'Vélo' as metric,
  SUM(count) as value
FROM session_counters
WHERE user_id = auth.uid() AND sport_type = 'velo';

-- 2. Badges que vous DEVRIEZ avoir
SELECT 
  b.code,
  b.name,
  b.condition_type,
  b.condition_value,
  CASE 
    WHEN b.code = 'first_workout' AND (SELECT SUM(count) FROM session_counters WHERE user_id = auth.uid()) >= 1 THEN '✅ Doit être débloqué'
    WHEN b.code = 'workout_10' AND (SELECT SUM(count) FROM session_counters WHERE user_id = auth.uid()) >= 10 THEN '✅ Doit être débloqué'
    WHEN b.code = 'workout_50' AND (SELECT SUM(count) FROM session_counters WHERE user_id = auth.uid()) >= 50 THEN '✅ Doit être débloqué'
    WHEN b.code = 'workout_100' AND (SELECT SUM(count) FROM session_counters WHERE user_id = auth.uid()) >= 100 THEN '✅ Doit être débloqué'
    WHEN b.code = 'workout_250' AND (SELECT SUM(count) FROM session_counters WHERE user_id = auth.uid()) >= 250 THEN '✅ Doit être débloqué'
    ELSE '❌ Pas encore'
  END as status
FROM badges b
WHERE b.category = 'workout'
ORDER BY b.condition_value;

-- 3. Vérifier quels badges vous avez déjà
SELECT 
  b.name,
  b.code,
  b.rarity,
  ub.unlocked_at
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
WHERE ub.user_id = auth.uid()
ORDER BY ub.unlocked_at DESC;

-- 4. Badges manquants (que vous devriez avoir)
SELECT 
  b.name,
  b.description,
  b.condition_value,
  'Ajoutez ' || b.condition_value || ' séances' as action
FROM badges b
WHERE b.code IN ('first_workout', 'workout_10', 'workout_50', 'workout_100', 'workout_250')
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = auth.uid() 
      AND ub.badge_id = b.id
  )
  AND b.condition_value <= (SELECT SUM(count) FROM session_counters WHERE user_id = auth.uid())
ORDER BY b.condition_value;
```

---

## ✅ Checklist de vérification

- [ ] Les compteurs affichent le bon total de séances
- [ ] Le total correspond à vos séances ajoutées
- [ ] La console affiche "X séances (compteurs)"
- [ ] Le badge "Débutant Motivé" apparaît dans User → Succès
- [ ] Aucune erreur dans la console
- [ ] Les badges par type fonctionnent (si applicable)

---

## 🚀 Pour forcer le déblocage

Si vous êtes sûr d'avoir 10 séances mais le badge ne se débloque pas :

**Option 1 : Ajouter +1 séance**
1. Allez sur Home
2. Cliquez sur "+1 séance"
3. Choisissez n'importe quel type
4. Le système vérifie automatiquement les badges

**Option 2 : Débloquer manuellement (SQL)**
```sql
-- Débloquer manuellement le badge workout_10
SELECT unlock_badge(
  auth.uid(),
  'workout_10'
);

-- Vérifier
SELECT * FROM user_badges 
WHERE user_id = auth.uid();
```

---

## 📝 Notes importantes

### Compatibilité avec l'ancien système
- Le badge "Lève-Tôt" utilise encore la table `seances` (nécessite l'heure)
- Les streaks utilisent `streak_history` (déjà en place)
- Tous les autres badges utilisent les compteurs

### Migration recommandée
Si vous aviez des séances avant le nouveau système :
1. Exécutez `migrations/migrate_existing_seances.sql`
2. Ajoutez +1 séance pour déclencher la vérification
3. Tous vos badges devraient se débloquer

---

## 🎉 Résultat attendu

Après avoir ajouté +1 séance (si vous avez 10+ séances totales) :

✅ Console affiche : `[Badge] ✅ Données chargées: 10 séances (compteurs), ...`
✅ Badge "Débutant Motivé" apparaît dans User → Succès
✅ Notification de nouveau badge s'affiche
✅ Le compteur de badges dans User augmente

**C'est bon ? Félicitations ! 🎊**
