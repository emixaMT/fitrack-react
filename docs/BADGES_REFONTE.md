# 🏆 Refonte du Système de Badges - Catégories Cohérentes

## 🎯 Problème résolu

Les anciens badges étaient trop spécifiques pour chaque discipline (CrossFit, Course, Cyclisme), alors que le système d'enregistrement ne distinguait pas finement entre certaines activités similaires.

## ✅ Nouvelle Structure

### **Catégories regroupées par type d'effort**

Au lieu de badges spécifiques par discipline, nous regroupons maintenant les activités similaires :

#### 💪 **Force** (Strength)
- **Disciplines incluses** : Musculation + CrossFit
- **Badges** :
  - 🥈 **Guerrier de la Force** (Rare) - 20 séances - 75 pts
  - 🥇 **Maître de la Force** (Épique) - 50 séances - 150 pts

#### 🏃 **Endurance**
- **Disciplines incluses** : Course à pied + Vélo
- **Badges** :
  - 🥈 **Champion d'Endurance** (Rare) - 20 séances - 75 pts
  - 🥇 **Bête d'Endurance** (Épique) - 50 séances - 150 pts

#### 🌟 **Polyvalence**
- **Disciplines incluses** : Toutes (Musculation + CrossFit + Course + Vélo)
- **Badge** :
  - 💎 **Athlète Polyvalent** (Légendaire) - 10 séances de CHAQUE discipline - 250 pts

## 📊 Comparaison Avant/Après

### ❌ Anciens badges (supprimés)
| Code | Nom | Condition |
|------|-----|-----------|
| `crossfit_lover` | Addict CrossFit | 20 séances CrossFit uniquement |
| `runner` | Coureur | 20 séances Running uniquement |
| `cyclist` | Cycliste | 20 séances Vélo uniquement |

### ✅ Nouveaux badges (remplacés)
| Code | Nom | Condition | Rareté |
|------|-----|-----------|--------|
| `strength_warrior` | Guerrier de la Force | 20 séances Muscu OU CrossFit | Rare |
| `strength_master` | Maître de la Force | 50 séances Muscu OU CrossFit | Épique |
| `endurance_runner` | Champion d'Endurance | 20 séances Course OU Vélo | Rare |
| `endurance_beast` | Bête d'Endurance | 50 séances Course OU Vélo | Épique |
| `versatile_athlete` | Athlète Polyvalent | 10+ de CHAQUE discipline | Légendaire |

## 🔄 Migration

### 1. **Base de données**
Exécutez le script SQL :
```bash
# Ouvrir l'éditeur SQL de Supabase
# Copier-coller le contenu de: supabase_badges_update.sql
# Exécuter le script
```

### 2. **Images des badges**
Créer les images suivantes dans `src/assets/badges/` :
- ✅ `strength_warrior.png` (déjà existant)
- ✅ `strength_master.png` (déjà existant)
- ✅ `endurance_runner.png` (déjà existant)
- ✅ `endurance_beast.png` (déjà existant)
- ✅ `versatile_athlete.png` (déjà existant)

### 3. **Code**
- ✅ `services/badgeService.ts` - Mis à jour
- ✅ `constantes/badgeImages.ts` - Mis à jour

## 💡 Logique de déverrouillage

```typescript
// Badge Force
const strengthCount = seances?.filter(s => 
  s.category === 'musculation' || s.category === 'crossfit'
).length || 0;

// Badge Endurance  
const enduranceCount = seances?.filter(s => 
  s.category === 'running' || s.category === 'velo'
).length || 0;

// Badge Polyvalent
const musculationCount = seances?.filter(s => s.category === 'musculation').length || 0;
const crossfitCount = seances?.filter(s => s.category === 'crossfit').length || 0;
const runningCount = seances?.filter(s => s.category === 'running').length || 0;
const veloCount = seances?.filter(s => s.category === 'velo').length || 0;

if (musculationCount >= 10 && crossfitCount >= 10 && 
    runningCount >= 10 && veloCount >= 10) {
  // Débloque "Athlète Polyvalent"
}
```

## 🎨 Catégories disponibles dans le système

Tel que défini dans `constantes/sport.tsx` :

```typescript
export type SportKey = 'musculation' | 'crossfit' | 'running' | 'velo';
```

| Clé | Label | Type |
|-----|-------|------|
| `musculation` | Musculation | Force |
| `crossfit` | Crossfit | Force |
| `running` | Course | Endurance |
| `velo` | Vélo | Endurance |

## 🚀 Avantages

### ✅ Cohérence
- Les badges correspondent mieux à la réalité de l'enregistrement des séances
- Pas de fausse distinction entre activités similaires

### ✅ Progression claire
- Rare (20 séances) → Épique (50 séances) pour chaque catégorie
- Badge Légendaire pour la vraie polyvalence (10+ de chaque)

### ✅ Motivation
- Plus facile de débloquer les badges de catégorie
- Challenge légendaire pour ceux qui pratiquent tout

### ✅ Flexibilité
- Si un utilisateur ne fait que de la musculation : badges Force accessibles
- Si un utilisateur ne fait que du cardio : badges Endurance accessibles
- Pour débloquer le Légendaire : il faut vraiment être polyvalent

## 📈 Points et Rareté

| Rareté | Badges | Points Totaux |
|--------|--------|---------------|
| Rare | 2 (Force + Endurance @ 20) | 150 pts |
| Épique | 2 (Force + Endurance @ 50) | 300 pts |
| Légendaire | 1 (Polyvalent) | 250 pts |
| **TOTAL** | **5 badges** | **700 pts** |

## 🔮 Extensions futures possibles

Si besoin de badges plus spécifiques plus tard :
- **Spécialiste Musculation** : 100 séances de musculation uniquement
- **Spécialiste CrossFit** : 100 séances de CrossFit uniquement
- **Ultra-coureur** : 100 séances de course
- **Cycliste Pro** : 100 séances de vélo

Mais pour l'instant, le système regroupé est plus cohérent avec votre usage ! 🎯

---

**Système de badges refondé pour plus de cohérence ! 🏆**
