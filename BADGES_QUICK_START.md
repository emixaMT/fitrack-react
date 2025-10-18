# 🚀 Guide de Démarrage Rapide - Badges

## ⚡ Installation en 5 Minutes

### Étape 1 : Exécuter le SQL (2 min)
1. Ouvrez [supabase.com](https://supabase.com) → Votre projet
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `supabase_badges_migration.sql`
4. Cliquez sur **Run**
5. ✅ Vérifiez qu'il n'y a pas d'erreurs

### Étape 2 : Activer le Temps Réel (1 min)
1. Allez dans **Database** → **Replication**
2. Activez pour `user_badges` ✅
3. Activez pour `badges` (optionnel) ✅

### Étape 3 : Premier Test (2 min)
Dans le SQL Editor, testez :
```sql
-- Voir les badges créés
SELECT code, name, rarity, points FROM public.badges ORDER BY points;

-- Débloquer manuellement un badge (remplacez YOUR_USER_ID)
INSERT INTO public.user_badges (user_id, badge_id)
SELECT 'YOUR_USER_ID', id FROM public.badges WHERE code = 'first_workout';
```

---

## 📱 Utilisation Basique

### A. Afficher l'écran des badges
```tsx
// Dans votre navigation (ex: App.tsx)
import BadgesScreen from './src/badges';

<Stack.Screen name="badges" component={BadgesScreen} />
```

### B. Vérifier les badges après une action
```tsx
import { checkAndUnlockBadges } from './services/badgeService';

// Après qu'un user complète une séance
async function afterWorkout(userId: string) {
  const newBadges = await checkAndUnlockBadges(userId);
  console.log(`${newBadges.length} nouveaux badges !`);
}
```

### C. Afficher les badges dans le profil
```tsx
import { useBadges } from './hooks/useBadges';

function Profile({ userId }) {
  const { badgeStats } = useBadges(userId);
  
  return (
    <View>
      <Text>🏆 {badgeStats?.total_badges} badges</Text>
      <Text>⭐ {badgeStats?.total_points} points</Text>
    </View>
  );
}
```

---

## 🎯 Points d'Intégration Recommandés

### 1. Après la création d'une séance ✅
```tsx
// Dans votre fichier de création de séance
import { checkAndUnlockBadges } from './services/badgeService';

const { data } = await supabase.from('seances').insert({...});
await checkAndUnlockBadges(userId);
```

### 2. Après l'ajout d'une note ✅
```tsx
const { data } = await supabase.from('notes').insert({...});
await checkAndUnlockBadges(userId);
```

### 3. Après la mise à jour du poids ✅
```tsx
const { data } = await supabase.from('weight_entries').insert({...});
await checkAndUnlockBadges(userId);
```

### 4. Après la mise à jour des performances ✅
```tsx
const { data } = await supabase.from('performances').upsert({...});
await checkAndUnlockBadges(userId);
```

---

## 📊 Fichiers Créés

### Services
- ✅ `services/badgeService.ts` - Toutes les fonctions pour gérer les badges

### Composants
- ✅ `components/badges/BadgeItem.tsx` - Badge individuel
- ✅ `components/badges/BadgeGrid.tsx` - Grille de badges
- ✅ `components/badges/BadgeModal.tsx` - Modal de détails
- ✅ `components/badges/BadgeNotification.tsx` - Notification de déblocage
- ✅ `components/badges/index.ts` - Exports

### Hooks
- ✅ `hooks/useBadges.ts` - Hook React pour gérer l'état des badges

### Écrans
- ✅ `src/badges.tsx` - Écran complet des badges

### SQL
- ✅ `supabase_badges_migration.sql` - Migration complète

### Documentation
- ✅ `BADGES_README.md` - Documentation complète
- ✅ `BADGES_INTEGRATION_EXAMPLES.md` - Exemples d'intégration
- ✅ `BADGES_QUICK_START.md` - Ce guide

---

## 🏅 Badges Disponibles (18 au total)

| Catégorie | Nombre | Exemples |
|-----------|--------|----------|
| Entraînement | 5 | Premier Pas, Débutant Motivé, Centurion |
| Consistance | 4 | Semaine Parfaite, Un Mois de Fer |
| Performance | 3 | Force Brute, Roi du Développé |
| Spéciaux | 3 | Archiviste, Suivi du Poids |
| Types | 3 | Addict CrossFit, Coureur, Cycliste |

---

## 🧪 Test Rapide

### 1. Débloquer manuellement un badge
```tsx
import { unlockBadge } from './services/badgeService';

// Débloquer le badge "Premier Pas"
await unlockBadge(userId, 'first_workout');
```

### 2. Vérifier si un badge est débloqué
```tsx
import { hasBadge } from './services/badgeService';

const hasIt = await hasBadge(userId, 'first_workout');
console.log('A le badge ?', hasIt);
```

### 3. Récupérer tous les badges d'un user
```tsx
import { getUserBadges } from './services/badgeService';

const badges = await getUserBadges(userId);
console.log(`${badges.length} badges débloqués`);
```

---

## 🎨 Personnalisation Rapide

### Changer les couleurs
`services/badgeService.ts` → fonction `getRarityColor()`

### Ajouter un badge
1. SQL Editor → Ajouter dans `badges`
2. `badgeService.ts` → Ajouter la logique dans `checkAndUnlockBadges()`

### Modifier les conditions
`badgeService.ts` → fonction `checkAndUnlockBadges()` → Ajustez les conditions

---

## 🐛 Debugging

### Vérifier les tables
```sql
-- Nombre de badges
SELECT COUNT(*) FROM public.badges;

-- Mes badges
SELECT b.name, ub.unlocked_at 
FROM public.user_badges ub
JOIN public.badges b ON ub.badge_id = b.id
WHERE ub.user_id = 'YOUR_USER_ID';
```

### Logs
- Console : `console.log` dans `badgeService.ts`
- Supabase Dashboard : **Logs** → **Postgres Logs**

### Réinitialiser (pour tests)
```sql
-- ⚠️ Supprimer TOUS les badges d'un user
DELETE FROM public.user_badges WHERE user_id = 'YOUR_USER_ID';
```

---

## ✨ Prochaines Étapes

1. ✅ Exécuter la migration SQL
2. ✅ Tester l'écran des badges
3. ✅ Ajouter `checkAndUnlockBadges()` après vos actions
4. ✅ Personnaliser les badges selon vos besoins
5. ✅ Ajouter des notifications visuelles

---

## 📚 Documentation Complète

- **BADGES_README.md** : Documentation détaillée
- **BADGES_INTEGRATION_EXAMPLES.md** : Exemples de code
- **supabase_badges_migration.sql** : Structure SQL complète

---

## 💡 Conseils

- Vérifiez les badges après CHAQUE action importante
- Utilisez le hook `useBadges` pour un état réactif
- Marquez les badges comme vus après affichage
- Testez avec un utilisateur réel

---

## 🆘 Problèmes Courants

### "Badge not found"
→ Vérifiez que la migration SQL a bien été exécutée

### Les badges ne se débloquent pas
→ Vérifiez que `checkAndUnlockBadges()` est appelé
→ Vérifiez les logs dans la console

### RLS Policy error
→ Vérifiez que les policies sont actives dans Supabase

### Temps réel ne fonctionne pas
→ Activez la réplication pour `user_badges`

---

**Tout est prêt ! 🎉**

Commencez par exécuter la migration SQL, puis testez l'écran des badges.
