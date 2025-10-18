# Système de Niveau et d'Expérience (XP)

## Vue d'ensemble

Le système de niveau permet aux utilisateurs de progresser en complétant des défis quotidiens. Chaque défi complété rapporte **20 XP**, et l'accumulation d'XP fait monter l'utilisateur de niveau.

## Architecture

### 1. Base de données

**Table: `user_levels`**

```sql
- id: UUID (clé primaire)
- user_id: UUID (référence auth.users)
- level: INTEGER (niveau actuel, commence à 1)
- current_xp: INTEGER (XP pour le niveau actuel)
- total_xp: INTEGER (XP total accumulé)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Fichier SQL**: `docs/create_user_levels_table.sql`

### 2. Service (`services/levelService.ts`)

Le service gère toute la logique métier du système de niveau:

#### Fonctions principales

- **`getXPRequiredForLevel(level)`**: Calcule l'XP requis pour atteindre le niveau suivant
  - Formule: `50 + (niveau × 50)`
  - Exemples:
    - Niveau 1 → 2: 100 XP (5 défis)
    - Niveau 2 → 3: 150 XP (7.5 défis)
    - Niveau 3 → 4: 200 XP (10 défis)
    - Niveau 10 → 11: 550 XP (27.5 défis)

- **`calculateLevelFromTotalXP(totalXP)`**: Calcule le niveau et l'XP actuel basé sur l'XP total

- **`getUserLevel(userId)`**: Récupère les informations de niveau d'un utilisateur

- **`initializeUserLevel(userId)`**: Initialise le niveau d'un nouvel utilisateur (niveau 1, 0 XP)

- **`addXP(userId, xpAmount)`**: Ajoute de l'XP à un utilisateur
  - Paramètres:
    - `userId`: ID de l'utilisateur
    - `xpAmount`: Montant d'XP (défaut: 20)
  - Retourne: `{ userLevel, leveledUp, oldLevel }` ou `null`

- **`getProgressPercentage(currentXP, level)`**: Calcule le pourcentage de progression

- **`getLevelDisplayInfo(userLevel)`**: Retourne les informations formatées pour l'affichage

### 3. Hook React (`hooks/useLevel.ts`)

Hook personnalisé pour gérer le niveau dans les composants:

```typescript
const { 
  level, 
  currentXP, 
  xpRequired, 
  progressPercentage, 
  totalXP, 
  loading, 
  addXP, 
  refreshLevel 
} = useLevel(userId);
```

**Caractéristiques**:
- Chargement automatique du niveau
- Mise à jour en temps réel via Supabase Realtime
- Fonction `addXP()` pour ajouter de l'XP
- Fonction `refreshLevel()` pour rafraîchir manuellement

### 4. Composant UI (`components/LevelBar.tsx`)

Barre de progression d'XP avec design moderne:

**Props**:
```typescript
{
  level: number;
  currentXP: number;
  xpRequired: number;
  progressPercentage: number;
  totalXP?: number;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}
```

**Affichage**:
- Badge de niveau avec gradient indigo
- Barre de progression animée
- Pourcentage de complétion
- XP actuel / XP requis
- XP total (optionnel)

## Intégration

### 1. Configuration de la base de données

Exécutez le script SQL dans Supabase:

```bash
# Depuis Supabase Dashboard > SQL Editor
# Copiez et exécutez le contenu de:
docs/create_user_levels_table.sql
```

Ce script crée:
- La table `user_levels`
- Les politiques RLS
- Les triggers pour l'auto-initialisation
- Les index pour les performances

### 2. Ajout d'XP lors de la validation d'un défi

Dans `src/app/(tabs)/home.tsx`, la fonction `handleCompleteChallenge()` ajoute automatiquement 20 XP:

```typescript
// Après l'insertion du défi complété
const xpResult = await addXP(session.user.id);
if (xpResult?.leveledUp) {
  Alert.alert(
    'Félicitations ! 🎊',
    `Tu as atteint le niveau ${xpResult.userLevel.level} !
+20 XP pour le défi complété`
  );
} else {
  Alert.alert('Bravo ! 🎉', 'Défi relevé avec succès !\n+20 XP');
}
```

### 3. Affichage dans la page utilisateur

Dans `src/app/(tabs)/user.tsx`:

```typescript
const { level, currentXP, xpRequired, progressPercentage, totalXP, loading: levelLoading } = useLevel(userId);

// Dans le render
{!levelLoading && (
  <LevelBar
    level={level}
    currentXP={currentXP}
    xpRequired={xpRequired}
    progressPercentage={progressPercentage}
    totalXP={totalXP}
    size="medium"
    showDetails={true}
  />
)}
```

## Formule de progression

### XP par niveau

La formule garantit une progression équilibrée:

| Niveau | XP Requis | Défis Requis | XP Total Cumulé |
|--------|-----------|--------------|-----------------|
| 1 → 2  | 100       | 5            | 100             |
| 2 → 3  | 150       | 7.5          | 250             |
| 3 → 4  | 200       | 10           | 450             |
| 4 → 5  | 250       | 12.5         | 700             |
| 5 → 6  | 300       | 15           | 1,000           |
| 10 → 11| 550       | 27.5         | 3,025           |
| 20 → 21| 1,050     | 52.5         | 11,025          |

### Justification

- **Progression initiale rapide**: Les premiers niveaux sont rapidement atteints (5-10 défis)
- **Difficulté croissante**: Chaque niveau demande plus d'effort
- **Engagement long terme**: Les niveaux élevés sont des accomplissements significatifs
- **Cohérence**: Formule linéaire simple à comprendre

## Fonctionnalités futures possibles

1. **Récompenses par niveau**
   - Badges spéciaux aux niveaux jalons (10, 25, 50, 100)
   - Déblocage de fonctionnalités

2. **Classement**
   - Leaderboard des utilisateurs par niveau
   - Comparaison avec amis

3. **Multiplicateurs d'XP**
   - XP bonus pour les séries (streak)
   - Événements spéciaux avec XP doublé

4. **Titres et prestige**
   - Titres débloquables selon le niveau
   - Système de prestige pour recommencer avec avantages

## Sécurité

Le système utilise RLS (Row Level Security) de Supabase:
- Les utilisateurs peuvent uniquement voir/modifier leur propre niveau
- Les politiques empêchent les modifications non autorisées
- Les triggers garantissent l'intégrité des données

## Maintenance

### Ajuster l'équilibrage

Pour modifier la difficulté de progression, modifiez la fonction dans `levelService.ts`:

```typescript
export function getXPRequiredForLevel(level: number): number {
  // Formule actuelle: 50 + (level * 50)
  // Plus facile: 50 + (level * 30)
  // Plus difficile: 100 + (level * 75)
  return 50 + (level * 50);
}
```

### Modifier l'XP par défi

Dans `levelService.ts`:

```typescript
const XP_PER_CHALLENGE = 20; // Modifier cette valeur
```

## Support

Pour toute question ou problème:
1. Vérifier que le script SQL a été exécuté
2. Vérifier que l'utilisateur est authentifié
3. Consulter les logs de la console pour les erreurs
4. Vérifier les politiques RLS dans Supabase
