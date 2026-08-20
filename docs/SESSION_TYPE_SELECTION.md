# 🎯 Sélection du Type de Séance - Bouton "+1 séance"

## 🔍 Problème identifié

Auparavant, le bouton "+1 séance" incrémentait simplement un compteur sans créer d'entrée réelle dans la table `seances`. Cela posait problème car :
- ❌ Les badges basés sur des types de séances spécifiques ne pouvaient pas être débloqués
- ❌ Aucune distinction entre Musculation, CrossFit, Course et Vélo
- ❌ Pas de traçabilité des types d'activités pratiquées

## ✅ Solution implémentée

### **Workflow du nouveau système**

```
1. Utilisateur clique sur "+1 séance"
        ↓
2. Modal s'ouvre avec 4 choix :
   - 💪 Musculation
   - 🏋️ CrossFit
   - 🏃 Course
   - 🚴 Vélo
        ↓
3. Sélection d'un type
        ↓
4. Création d'une VRAIE séance dans la table `seances`
   avec la catégorie correspondante
        ↓
5. Incrémentation du compteur mensuel
        ↓
6. Mise à jour du streak
        ↓
7. Vérification automatique des badges
```

## 📁 Fichiers modifiés

### 1. **`components/SessionTypeModal.tsx`** (NOUVEAU)
Modal de sélection du type de séance avec :
- ✅ Design cohérent avec l'application
- ✅ Grille 2x2 des 4 disciplines
- ✅ Images et labels pour chaque sport
- ✅ Animation et feedback visuel
- ✅ Bouton annuler

### 2. **`src/app/(tabs)/home.tsx`** (MODIFIÉ)

#### Imports ajoutés
```typescript
import { checkAndUnlockBadges } from '../../../services/badgeService';
import { SessionTypeModal } from '../../../components/SessionTypeModal';
import { SportKey } from '../../../constantes/sport';
```

#### État ajouté
```typescript
const [sessionTypeModalVisible, setSessionTypeModalVisible] = useState(false);
```

#### Fonctions modifiées

**Ancienne version** : `handleAddSession()` incrémentait directement
```typescript
async function handleAddSession() {
  // Incrémente juste le compteur
  // Pas de création de séance
}
```

**Nouvelle version** :
1. `handleAddSession()` → Ouvre le modal
```typescript
function handleAddSession() {
  setSessionTypeModalVisible(true);
}
```

2. `handleCreateSession(category)` → Crée la séance avec type
```typescript
async function handleCreateSession(category: SportKey) {
  // 1. Incrémenter le compteur mensuel
  // 2. Créer une séance dans `seances` avec la catégorie
  // 3. Vérifier et débloquer les badges
  // 4. Mettre à jour le streak
}
```

## 🎨 Interface utilisateur

### Modal de sélection

```
┌─────────────────────────────┐
│  Type de séance          ✕  │
│                             │
│  Sélectionne la discipline  │
│  que tu viens de pratiquer  │
│                             │
│  ┌───────┐    ┌───────┐    │
│  │  💪   │    │  🏋️   │    │
│  │ Muscu │    │CrossFit│    │
│  └───────┘    └───────┘    │
│                             │
│  ┌───────┐    ┌───────┐    │
│  │  🏃   │    │  🚴   │    │
│  │ Course│    │ Vélo  │    │
│  └───────┘    └───────┘    │
│                             │
│       [ Annuler ]           │
└─────────────────────────────┘
```

## 🔄 Flux de données

### Avant
```
[+1 séance] → monthly_sessions++ → streak_history
                     ↓
                  FIN
```

### Après
```
[+1 séance] → Modal → Sélection Type
                          ↓
              INSERT INTO seances (category)
                          ↓
              monthly_sessions++
                          ↓
              checkAndUnlockBadges()
                          ↓
              streak_history
                          ↓
                     FIN + 🏆
```

## 💾 Structure de données

### Table `seances`
```sql
INSERT INTO seances (
  id_user,
  nom,
  category,      -- 'musculation' | 'crossfit' | 'running' | 'velo'
  exercices,
  created_at
)
```

### Exemple d'entrée créée
```json
{
  "id_user": "uuid-123",
  "nom": "Séance crossfit",
  "category": "crossfit",
  "exercices": [],
  "created_at": "2025-01-17T10:30:00Z"
}
```

## 🏆 Impact sur les badges

Avec cette implémentation, les badges peuvent maintenant être débloqués correctement :

### Badges Force (Muscu + CrossFit)
```typescript
const strengthCount = seances?.filter(s => 
  s.category === 'musculation' || s.category === 'crossfit'
).length || 0;
```

### Badges Endurance (Course + Vélo)
```typescript
const enduranceCount = seances?.filter(s => 
  s.category === 'running' || s.category === 'velo'
).length || 0;
```

### Badge Polyvalent
```typescript
// Nécessite au moins 10 séances de CHAQUE type
const musculationCount = seances?.filter(s => s.category === 'musculation').length || 0;
const crossfitCount = seances?.filter(s => s.category === 'crossfit').length || 0;
const runningCount = seances?.filter(s => s.category === 'running').length || 0;
const veloCount = seances?.filter(s => s.category === 'velo').length || 0;
```

## ✨ Avantages

### Pour l'utilisateur
- ✅ **Traçabilité** : Toutes les séances sont enregistrées avec leur type
- ✅ **Badges précis** : Déblocage basé sur les vraies activités
- ✅ **Interface claire** : Modal simple et intuitif
- ✅ **Historique** : Possibilité de consulter toutes les séances dans l'onglet Workout

### Pour le système
- ✅ **Cohérence** : Une séance = une entrée en base
- ✅ **Statistiques** : Possibilité d'analyser les types d'entraînements
- ✅ **Évolutivité** : Facile d'ajouter de nouvelles disciplines
- ✅ **Gamification** : Les badges reflètent la réalité

## 🔮 Évolutions futures possibles

1. **Nom personnalisé** : Permettre de nommer la séance dans le modal
2. **Durée** : Ajouter un champ pour la durée de la séance
3. **Notes rapides** : Ajouter une note courte optionnelle
4. **Favoris** : Mémoriser le dernier type sélectionné
5. **Statistiques** : Graphiques de répartition par type d'activité

## 🎯 Cas d'usage

### Scénario 1 : Séance de musculation
```
1. Utilisateur termine sa séance de muscu
2. Ouvre l'app → Page Home
3. Clique sur "+1 séance"
4. Modal s'ouvre
5. Sélectionne "💪 Musculation"
6. ✅ Séance enregistrée avec category='musculation'
7. ✅ Compteur incrémenté
8. ✅ Badges "Force" progressent
```

### Scénario 2 : Séance de course
```
1. Utilisateur termine son run
2. Ouvre l'app → Page Home
3. Clique sur "+1 séance"
4. Modal s'ouvre
5. Sélectionne "🏃 Course"
6. ✅ Séance enregistrée avec category='running'
7. ✅ Compteur incrémenté
8. ✅ Badges "Endurance" progressent
```

## 🚀 Migration

### Pas de migration nécessaire
- ✅ Les anciennes séances dans `seances` conservent leur catégorie
- ✅ Le nouveau système coexiste avec l'ancien
- ✅ Aucune perte de données

### Points d'attention
- ⚠️ Les séances créées avant cette mise à jour n'ont peut-être pas de catégorie
- ⚠️ Le compteur `monthly_sessions` peut être supérieur au nombre de séances dans `seances`
- ✅ C'est normal : l'ancien système incrémentait sans créer de séance

---

**Système de sélection du type de séance implémenté avec succès ! 🎉**

Les badges peuvent maintenant être débloqués correctement en fonction des vraies activités pratiquées.
