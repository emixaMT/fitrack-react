# Mise à jour automatique de la barre d'XP en temps réel

## 🚀 Mise à jour effectuée

Le système de niveau utilise maintenant un **contexte React global** (`LevelContext`) qui garantit que la barre d'XP se met à jour **automatiquement et instantanément** sur toutes les pages de l'application.

## ✨ Améliorations apportées

### 1. Contexte Global (`contexts/LevelContext.tsx`)

Un nouveau contexte global a été créé qui :
- ✅ Gère l'état du niveau de manière centralisée
- ✅ Se synchronise automatiquement avec Supabase Realtime
- ✅ Met à jour immédiatement toutes les pages de l'app
- ✅ Récupère automatiquement l'ID utilisateur depuis la session

### 2. Intégration dans le Layout principal

Le `LevelProvider` a été ajouté au `_layout.tsx` principal :

```typescript
<ThemeProvider>
  <LevelProvider>
    <BadgeUnlockProvider>
      <Slot />
    </BadgeUnlockProvider>
  </LevelProvider>
</ThemeProvider>
```

Cela signifie que **tous les composants** de l'application ont accès au niveau en temps réel.

### 3. Modification des pages

#### Page User (`src/app/(tabs)/user.tsx`)
```typescript
// Avant
import { useLevel } from '../../../hooks/useLevel';
const { level, ... } = useLevel(userId);

// Après
import { useLevel } from '../../../contexts/LevelContext';
const { level, ... } = useLevel(); // Plus besoin de passer userId
```

#### Page Home (`src/app/(tabs)/home.tsx`)
```typescript
// Avant
import { addXP } from '../../../services/levelService';
await addXP(session.user.id);

// Après
import { useLevel } from '../../../contexts/LevelContext';
const { addXP } = useLevel();
await addXP(); // Plus besoin de passer userId
```

### 4. Optimisations du Hook

Le hook `useLevel` (maintenant dans le contexte) a été amélioré :
- ✅ Meilleur logging pour le débogage
- ✅ Configuration optimisée du canal Realtime
- ✅ Mise à jour locale immédiate + sync temps réel
- ✅ Gestion des événements INSERT et UPDATE

## 📊 Comment ça fonctionne

### Flux de mise à jour

```
1. Utilisateur complète un défi
   ↓
2. home.tsx appelle addXP()
   ↓
3. LevelContext :
   - Appelle le service levelService
   - Met à jour l'état local immédiatement
   - Supabase met à jour la base de données
   ↓
4. Supabase Realtime envoie la mise à jour
   ↓
5. LevelContext reçoit la mise à jour
   ↓
6. TOUTES les pages utilisant useLevel() se mettent à jour automatiquement
```

### Mise à jour instantanée

**Double mise à jour** pour garantir la réactivité :

1. **Mise à jour locale immédiate** : Dès que `addXP()` est appelé, l'état est mis à jour localement
2. **Mise à jour Realtime** : Supabase confirme et synchronise via Realtime (backup)

### Logging amélioré

Les logs dans la console permettent de suivre le système :

```
🔄 Loading level for user: xxx
🔌 Realtime subscription status: SUBSCRIBED
💪 XP added globally: { level: 2, currentXP: 20, totalXP: 120 }
⭐ Level changed (Realtime Global): { eventType: 'UPDATE', ... }
✅ Level updated globally: { level: 2, ... }
```

## 🎯 Avantages

### Pour l'utilisateur
- ✅ Mise à jour instantanée de la barre d'XP
- ✅ Aucun délai perceptible
- ✅ Cohérence sur toutes les pages
- ✅ Pas besoin de rafraîchir la page

### Pour le développement
- ✅ Code plus simple (pas besoin de passer userId partout)
- ✅ État centralisé et prévisible
- ✅ Facilite les futures fonctionnalités
- ✅ Meilleur débogage avec les logs

## 🔧 Configuration Supabase

Pour que le Realtime fonctionne, assurez-vous que :

### 1. Realtime est activé sur la table

Dans Supabase Dashboard :
1. Allez dans **Database** > **Replication**
2. Vérifiez que `user_levels` est dans la liste
3. Si absent, cliquez sur **Add table** et sélectionnez `user_levels`

### 2. Politiques RLS correctes

Les politiques créées par le script SQL permettent :
- ✅ Lecture de son propre niveau
- ✅ Insertion de son propre niveau
- ✅ Mise à jour de son propre niveau

## 🧪 Test de fonctionnement

### Test manuel

1. **Ouvrez l'app** et connectez-vous
2. **Allez sur la page User** → Notez votre niveau actuel (ex: Niveau 1, 0 XP)
3. **Allez sur la page Home**
4. **Complétez un défi** → Vous verrez "+20 XP"
5. **Retournez sur la page User** → La barre devrait être à 20 XP **sans recharger**

### Vérification dans les logs

Ouvrez la console et cherchez :
```
💪 XP added globally: ...
✅ Level updated globally: ...
```

Si vous voyez ces messages, le système fonctionne correctement !

## ⚠️ Dépannage

### La barre ne se met pas à jour

1. **Vérifiez les logs** dans la console
2. **Vérifiez Realtime** dans Supabase :
   - Database > Replication
   - La table `user_levels` doit être listée
3. **Vérifiez la connexion** : L'utilisateur doit être connecté

### Erreur "useLevel must be used within LevelProvider"

Le composant n'est pas enveloppé par le `LevelProvider`. Vérifiez que `_layout.tsx` contient bien le provider.

### Délai de mise à jour

Si la mise à jour prend quelques secondes :
- C'est normal pour le Realtime (peut avoir 1-2s de latence)
- La mise à jour locale devrait être instantanée
- Vérifiez votre connexion internet

## 📈 Performances

Le contexte global n'impacte pas les performances car :
- ✅ Un seul canal Realtime pour toute l'app
- ✅ Mise à jour uniquement des composants qui utilisent `useLevel()`
- ✅ Pas de re-render inutile grâce à React Context

## 🔮 Évolutions possibles

Maintenant que le système est centralisé, on peut facilement ajouter :

1. **Animations** : Animer la barre lors du gain d'XP
2. **Sons** : Jouer un son lors du level up
3. **Notifications** : Push notification lors d'un level up
4. **Leaderboard** : Comparer avec d'autres utilisateurs en temps réel
5. **Events** : Multiplicateurs d'XP temporaires

---

**Le système est maintenant complètement automatique et réactif ! 🎉**
