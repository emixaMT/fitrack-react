# 🏆 Système de Défis Quotidiens

## 📊 Vue d'Ensemble

Le système de défis quotidiens propose **365 défis sportifs uniques** qui changent automatiquement chaque jour de l'année.

---

## 🎯 Fonctionnalités

### **1. Défi Unique par Jour**
- Chaque jour de l'année (1-365) a un défi spécifique
- Le défi change automatiquement à minuit
- Progression visible : "Jour X/365"

### **2. Variété des Défis**
Les défis incluent :
- 💪 Musculation (pompes, tractions, dips)
- 🏃 Cardio (course, vélo, natation, corde)
- 🔥 HIIT (burpees, jumping jacks, mountain climbers)
- 🧘 Gainage (planche, gainage latéral)
- 🥾 Endurance (randonnée, marathons)
- 🎯 Défis combinés

### **3. Difficulté Progressive**
- Janvier → Mars : Défis modérés
- Avril → Juin : Intensité croissante
- Juillet → Septembre : Défis avancés
- Octobre → Décembre : Défis extrêmes

---

## 📂 Structure des Fichiers

### **`constants/dailyChallenges.ts`**

```typescript
// Liste complète des 365 défis
export const DAILY_CHALLENGES = [
  "50 squats en 3 minutes",
  "Planche 2 minutes (cumulées)",
  // ... 363 autres défis
];

// Récupère le défi du jour
export function getDailyChallenge(): string;

// Récupère le numéro du jour (1-365)
export function getDayOfYear(): number;
```

---

## 🎨 Interface Utilisateur

### **Carte Défi du Jour**

```
┌─────────────────────────────────────┐
│ 🏆 Défi du jour    │ Jour 289/365   │
│                                     │
│      50 squats en 3 minutes         │
│                                     │
│    [Relever le défi 💪]             │
└─────────────────────────────────────┘
```

**Composants :**
- 🏆 Icône trophée or
- 📅 Compteur de jour
- 💬 Texte du défi (centré, gros)
- 🔘 Bouton CTA

---

## 🔄 Fonctionnement Technique

### **Calcul du Jour de l'Année**

```typescript
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
```

### **Sélection du Défi**

```typescript
function getDailyChallenge(): string {
  const dayOfYear = getDayOfYear();
  const index = (dayOfYear - 1) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[index];
}
```

**Exemple :**
- 1er janvier → Jour 1 → Défi index 0 : "50 squats en 3 minutes"
- 16 octobre → Jour 289 → Défi index 288 : "200 squats en 15 min"
- 31 décembre → Jour 365 → Défi index 364 : "Repos - Étirements 30 min"

---

## 📊 Exemples de Défis par Période

### **Janvier (Reprise)**
```
✅ 50 squats en 3 minutes
✅ Planche 2 minutes
✅ 100 jumping jacks
✅ 30 burpees
✅ 5 km de course
```

### **Avril (Progression)**
```
🔥 250 squats en 20 min
🔥 600 abdos variés
🔥 45 min de HIIT
🔥 2000m de natation
🔥 Gainage 10 minutes total
```

### **Juillet (Intensif)**
```
💪 400 squats en 35 min
💪 3500m de natation
💪 70 min de HIIT
💪 260 burpees en 30 min
💪 180 tractions
```

### **Décembre (Ultime)**
```
🏆 900 squats en 60 min
🏆 700 burpees en 55 min
🏆 120 min de HIIT
🏆 9000m de natation
🏆 Défi ultime : 300-300-300
```

---

## 🎯 Intégration dans l'App

### **Home Screen**

```tsx
import { getDailyChallenge, getDayOfYear } from '../../../constants/dailyChallenges';

<View className="mt-6 rounded-xl shadow-lg">
  <LinearGradient colors={['#4f46e5', '#7c3aed']}>
    <Text>🏆 Défi du jour</Text>
    <Text>Jour {getDayOfYear()}/365</Text>
    <Text>{getDailyChallenge()}</Text>
    <Pressable onPress={() => router.push('/seances/create/step1')}>
      <Text>Relever le défi 💪</Text>
    </Pressable>
  </LinearGradient>
</View>
```

---

## 🔮 Évolutions Futures

### **Phase 1 : Suivi des Défis** ✅ Actuel
- Affichage du défi du jour
- Changement automatique quotidien

### **Phase 2 : Validation des Défis**
- Bouton "J'ai relevé le défi"
- Historique des défis complétés
- Statistiques (% de défis réussis)

### **Phase 3 : Badges**
- Badge "7 jours d'affilée"
- Badge "30 jours sans interruption"
- Badge "365 défis complétés"

### **Phase 4 : Social**
- Partager son défi sur les réseaux
- Défier des amis
- Classement mensuel

---

## 📝 Personnalisation

### **Modifier les Défis**

Édite `constants/dailyChallenges.ts` :

```typescript
export const DAILY_CHALLENGES = [
  "Ton défi personnalisé 1",
  "Ton défi personnalisé 2",
  // ... continue jusqu'à 365
];
```

### **Ajouter une Catégorie**

Créer un fichier `dailyChallengesYoga.ts` avec 365 défis yoga :

```typescript
export const YOGA_CHALLENGES = [
  "30 min de Hatha Yoga",
  "Salutation au soleil x10",
  // ...
];
```

---

## 🎮 Gamification

### **Niveaux de Difficulté**

```typescript
function getDifficulty(dayOfYear: number): string {
  if (dayOfYear <= 90) return '🟢 Débutant';
  if (dayOfYear <= 180) return '🟡 Intermédiaire';
  if (dayOfYear <= 270) return '🟠 Avancé';
  return '🔴 Expert';
}
```

### **Points par Défi**

```typescript
const POINTS_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
  extreme: 100,
};
```

---

## 🐛 Dépannage

### **Le défi ne change pas**
→ Vérifier que `getDayOfYear()` retourne bien le bon jour

### **Défis en doublon**
→ Vérifier qu'il y a exactement 365 défis dans le tableau

### **Année bissextile (366 jours)**
→ Le modulo `% 365` gère automatiquement le jour supplémentaire

---

## ✅ Checklist d'Implémentation

- [x] Créer `constants/dailyChallenges.ts`
- [x] Implémenter `getDailyChallenge()`
- [x] Implémenter `getDayOfYear()`
- [x] Intégrer dans `home.tsx`
- [x] Design de la carte défi
- [ ] Système de validation (Phase 2)
- [ ] Historique des défis (Phase 2)
- [ ] Badges de progression (Phase 3)

---

**Le système est maintenant prêt ! Chaque jour apporte un nouveau défi motivant ! 💪🔥**
