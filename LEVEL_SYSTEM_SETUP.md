# Installation du Système de Niveau - Instructions

## ✅ Fichiers créés

Le système de niveau a été entièrement implémenté avec les fichiers suivants :

### 📁 Base de données
- `docs/create_user_levels_table.sql` - Script SQL pour créer la table et les triggers

### 📁 Services
- `services/levelService.ts` - Logique métier du système de niveau

### 📁 Contextes
- `contexts/LevelContext.tsx` - Contexte global pour le partage du niveau en temps réel

### 📁 Hooks (legacy)
- `hooks/useLevel.ts` - Hook React local (remplacé par le contexte global)

### 📁 Composants
- `components/LevelBar.tsx` - Barre de progression d'XP avec design moderne

### 📁 Documentation
- `docs/LEVEL_SYSTEM_README.md` - Documentation complète du système
- `docs/LEVEL_REALTIME_UPDATE.md` - Documentation sur le système de mise à jour automatique

### 📝 Fichiers modifiés
- `src/app/_layout.tsx` - Ajout du LevelProvider global
- `src/app/(tabs)/home.tsx` - Ajout d'XP lors de la validation d'un défi (utilise le contexte)
- `src/app/(tabs)/user.tsx` - Affichage de la barre d'XP (utilise le contexte)

## 🚀 Étapes d'installation

### Étape 1 : Créer la table dans Supabase

1. Ouvrez votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu latéral)
4. Créez une nouvelle requête
5. Copiez le contenu de `docs/create_user_levels_table.sql`
6. Collez et exécutez la requête (bouton RUN)

✅ Cela créera :
- La table `user_levels`
- Les politiques de sécurité (RLS)
- Le trigger d'auto-initialisation pour les nouveaux utilisateurs

### Étape 2 : Activer Realtime sur la table

Pour que la barre d'XP se mette à jour automatiquement :

1. Dans Supabase Dashboard, allez dans **Database** > **Replication**
2. Cherchez `user_levels` dans la liste des tables
3. Si elle n'est pas listée, activez la réplication :
   - Cliquez sur le bouton **0 tables** ou **Add table**
   - Cochez `user_levels`
   - Cliquez sur **Enable Replication**

✅ Cela permet les mises à jour en temps réel de la barre d'XP !

### Étape 3 : Vérifier l'installation

Vérifiez que la table a été créée :
1. Allez dans **Table Editor**
2. Vous devriez voir `user_levels` dans la liste des tables
3. La table devrait avoir les colonnes :
   - `id` (uuid)
   - `user_id` (uuid)
   - `level` (int4)
   - `current_xp` (int4)
   - `total_xp` (int4)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

### Étape 4 : Tester le système

1. Lancez l'application :
   ```bash
   npm start
   ```

2. Connectez-vous avec votre compte

3. Allez sur la page **User** (profil)
   - Vous devriez voir la barre d'XP avec "Niveau 1" et "0 / 100 XP"

4. Complétez un défi quotidien sur la page **Home**
   - Cliquez sur le bouton du défi du jour
   - Validez le défi
   - Vous devriez voir une alerte "Bravo ! 🎉 Défi relevé avec succès ! +20 XP"

5. Retournez sur la page **User**
   - La barre d'XP devrait maintenant afficher "20 / 100 XP" (20%)

6. Complétez 4 défis supplémentaires (total: 5 défis = 100 XP)
   - Vous devriez recevoir une alerte "Félicitations ! 🎊 Tu as atteint le niveau 2 !"
   - La barre devrait afficher "Niveau 2" avec "0 / 150 XP"

## 📊 Système de progression

### XP par défi
- Chaque défi quotidien complété = **20 XP**

### Formule de niveau
- XP requis pour le niveau N+1 = `50 + (N × 50)`

### Exemples de progression

| Niveau | XP Requis | Défis Requis | XP Total Cumulé |
|--------|-----------|--------------|-----------------|
| 1 → 2  | 100 XP    | 5 défis      | 100 XP          |
| 2 → 3  | 150 XP    | 7.5 défis    | 250 XP          |
| 3 → 4  | 200 XP    | 10 défis     | 450 XP          |
| 4 → 5  | 250 XP    | 12.5 défis   | 700 XP          |
| 5 → 6  | 300 XP    | 15 défis     | 1,000 XP        |

## 🎨 Composant LevelBar

Le composant affiche :
- Un badge avec le niveau actuel (gradient indigo)
- Le niveau en gros
- Le total d'XP accumulé
- Une barre de progression colorée
- L'XP actuel / XP requis
- Le pourcentage de complétion

Tailles disponibles : `'small'`, `'medium'`, `'large'`

## 🔧 Personnalisation

### Modifier l'XP par défi

Dans `services/levelService.ts`, ligne 8 :
```typescript
const XP_PER_CHALLENGE = 20; // Changez cette valeur
```

### Modifier la difficulté de progression

Dans `services/levelService.ts`, fonction `getXPRequiredForLevel` :
```typescript
export function getXPRequiredForLevel(level: number): number {
  return 50 + (level * 50); // Modifiez cette formule
}
```

Exemples :
- Plus facile : `return 50 + (level * 30);`
- Plus difficile : `return 100 + (level * 75);`

### Personnaliser l'affichage

Modifiez `components/LevelBar.tsx` pour changer :
- Les couleurs du gradient
- La taille du badge
- Le style de la barre de progression

## ❓ Dépannage

### La barre d'XP ne s'affiche pas
- Vérifiez que le script SQL a été exécuté dans Supabase
- Vérifiez la console pour des erreurs
- Assurez-vous que l'utilisateur est bien connecté

### L'XP n'augmente pas
- Vérifiez que la fonction `addXP` est bien appelée dans `home.tsx`
- Vérifiez les logs de la console
- Vérifiez les politiques RLS dans Supabase

### Erreur "user_levels" does not exist
- Le script SQL n'a pas été exécuté correctement
- Réexécutez le script dans Supabase SQL Editor

### Erreur de permission
- Vérifiez que les politiques RLS sont bien créées
- Vérifiez que l'utilisateur est authentifié

## 📚 Documentation complète

Consultez `docs/LEVEL_SYSTEM_README.md` pour la documentation technique complète.

## ✨ Prochaines étapes possibles

1. **Badges de niveau** : Ajouter des badges spéciaux pour les niveaux jalons
2. **Leaderboard** : Classement des utilisateurs par niveau
3. **Multiplicateurs** : Bonus XP pour les streaks
4. **Animations** : Animer le level up avec des effets visuels
5. **Notifications** : Notifier l'utilisateur lors d'un level up

---

**Système créé et prêt à l'emploi ! 🎉**
