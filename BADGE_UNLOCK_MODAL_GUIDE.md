# 🎉 Modal de Déblocage de Badge - Guide d'Intégration

## 📋 Composants Créés

### **1. BadgeUnlockModal.tsx**
Modal animé pour afficher un badge débloqué avec :
- ✨ Fond opaque avec effet de blur
- 🎨 Cercles animés en arrière-plan (gradient de la rareté)
- 🔄 Animation de rotation et pulse
- ⭐ Particules/confettis animés
- 🎯 Badge au centre avec aura lumineuse
- 📊 Informations du badge (nom, description, points)
- 🎨 Couleurs dynamiques selon la rareté

### **2. useBadgeUnlockNotification.tsx**
Hook pour gérer la notification automatique :
- 🔔 Détection en temps réel des nouveaux badges
- 📝 Queue de badges (si plusieurs débloqués en même temps)
- ✅ Marquage automatique comme "vu"
- 🔄 Gestion de l'état global

### **3. BadgeUnlockProvider.tsx**
Provider global à placer à la racine de l'app :
- 🌐 Affichage automatique du modal
- 👤 Gestion de l'utilisateur connecté
- 📊 Indicateur de badges en attente

---

## 🚀 Installation

### **Étape 1 : Ajouter le Provider dans votre Layout**

Modifiez votre fichier `src/app/_layout.tsx` :

```tsx
import { BadgeUnlockProvider } from '../components/badges/BadgeUnlockProvider';

export default function RootLayout() {
  return (
    <BadgeUnlockProvider>
      {/* Votre layout existant */}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* ... autres routes */}
      </Stack>
    </BadgeUnlockProvider>
  );
}
```

### **Étape 2 : Vérifier les Imports**

Assurez-vous que ces fichiers existent :
- ✅ `types/badge.ts` (type Badge)
- ✅ `config/supabaseConfig.ts` (client Supabase)
- ✅ `constantes/badgeImages.ts` (fonction getBadgeImage)

---

## 🎯 Utilisation

### **Automatique (Recommandé)**

Une fois le provider installé, le modal s'affiche **automatiquement** quand :
1. Un badge est débloqué via `checkAndUnlockBadges()`
2. L'utilisateur a des badges non vus (champ `is_new = true`)

```typescript
// Exemple : après création de séance
const { error } = await supabase.from('seances').insert(seanceData);
await checkAndUnlockBadges(userId);
// → Le modal s'affiche automatiquement si badge débloqué !
```

### **Manuelle**

Si vous voulez contrôler manuellement l'affichage :

```tsx
import { BadgeUnlockModal } from '../components/badges/BadgeUnlockModal';
import { useState } from 'react';

function MyComponent() {
  const [showBadge, setShowBadge] = useState(false);
  const [badge, setBadge] = useState<Badge | null>(null);

  const handleBadgeUnlock = (newBadge: Badge) => {
    setBadge(newBadge);
    setShowBadge(true);
  };

  return (
    <>
      <View>
        {/* Votre contenu */}
      </View>

      <BadgeUnlockModal
        visible={showBadge}
        badge={badge}
        onClose={() => setShowBadge(false)}
      />
    </>
  );
}
```

---

## 🎨 Personnalisation

### **Couleurs par Rareté**

Les couleurs sont définies dans `BadgeUnlockModal.tsx` :

```typescript
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return '#9CA3AF';  // Gris
    case 'rare':
      return '#3B82F6';  // Bleu
    case 'epic':
      return '#8B5CF6';  // Violet
    case 'legendary':
      return '#F59E0B';  // Or
  }
};
```

### **Animations**

Modifiez les durées d'animation :

```typescript
// Animation d'entrée plus rapide
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 200, // Au lieu de 300
  useNativeDriver: true,
})

// Pulse plus lent
Animated.timing(pulseAnim, {
  toValue: 1.1,
  duration: 1500, // Au lieu de 1000
  useNativeDriver: true,
})
```

### **Taille du Modal**

Dans `BadgeUnlockModal.tsx` :

```typescript
content: {
  width: width * 0.9,  // 90% au lieu de 85%
  maxWidth: 450,       // Augmenter si besoin
}
```

---

## 🎬 Comportement

### **Queue de Badges**

Si plusieurs badges sont débloqués en même temps :
1. Le premier s'affiche immédiatement
2. Les suivants sont mis en queue
3. Quand l'utilisateur ferme le modal → badge suivant affiché
4. Un indicateur "+X badges en attente" s'affiche en bas à droite

### **Badges Non Vus**

Au démarrage de l'app :
- ✅ Tous les badges avec `is_new = true` sont chargés
- ✅ Affichés dans l'ordre de déblocage
- ✅ Marqués comme vus après fermeture du modal

### **Temps Réel**

Le système écoute les insertions dans `user_badges` :
- 🔔 Détection instantanée via Supabase Realtime
- 🎯 Affichage automatique du modal
- ✅ Pas besoin de recharger la page

---

## 🧪 Test

### **Test 1 : Débloquer un Badge Manuellement**

```sql
-- Insérer un badge non vu
INSERT INTO user_badges (user_id, badge_id, is_new)
VALUES (
  '93b0400c-3a5e-4878-a573-6796c08cebb7',
  (SELECT id FROM badges WHERE code = 'first_workout'),
  true
);
```

→ Le modal devrait s'afficher immédiatement !

### **Test 2 : Débloquer Plusieurs Badges**

```sql
DO $$
BEGIN
  FOR badge_code IN ARRAY['first_workout', 'workout_10', 'note_taker'] LOOP
    INSERT INTO user_badges (user_id, badge_id, is_new)
    VALUES (
      '93b0400c-3a5e-4878-a573-6796c08cebb7',
      (SELECT id FROM badges WHERE code = badge_code),
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
```

→ Les 3 badges s'afficheront un par un !

### **Test 3 : Via l'Application**

1. Créez une séance dans l'app
2. Le système vérifie automatiquement les badges
3. Si conditions remplies → modal s'affiche !

---

## 🎭 Effets Visuels

### **Animations Incluses**

1. **Fade In** - Apparition progressive du fond opaque
2. **Scale + Spring** - Badge qui "pop" au centre
3. **Rotation** - Cercles d'arrière-plan qui tournent
4. **Pulse** - Aura qui pulse autour du badge
5. **Particules** - Confettis animés qui tombent
6. **Gradient** - Couleurs dégradées selon la rareté

### **Effets par Rareté**

| Rareté | Couleur | Effet |
|--------|---------|-------|
| Common | Gris | Pulse basique |
| Rare | Bleu | Pulse + rotation |
| Epic | Violet | Pulse + rotation + particules |
| Legendary | Or | Pulse intense + rotation + confettis dorés |

---

## 📱 Responsive

Le modal s'adapte automatiquement :
- ✅ 85% de la largeur d'écran
- ✅ Max 400px sur tablettes
- ✅ Centré verticalement et horizontalement
- ✅ Fonctionne sur iOS et Android

---

## 🔧 Dépendances

Packages requis :
- ✅ `react-native` (Animated, Modal)
- ✅ `expo-linear-gradient` (gradients)
- ✅ `@supabase/supabase-js` (temps réel)

Si `expo-linear-gradient` n'est pas installé :

```bash
npx expo install expo-linear-gradient
```

---

## 🐛 Debugging

### **Modal ne s'affiche pas ?**

1. **Vérifier le Provider**
```tsx
// S'assurer qu'il englobe toute l'app
<BadgeUnlockProvider>
  <YourApp />
</BadgeUnlockProvider>
```

2. **Vérifier les badges non vus**
```sql
SELECT * FROM user_badges 
WHERE user_id = '...' AND is_new = true;
```

3. **Console logs**
```typescript
// Ajouter dans useBadgeUnlockNotification
console.log('Badge à afficher:', badgeToShow);
console.log('Queue:', queue);
```

### **Animations saccadées ?**

Assurez-vous d'utiliser `useNativeDriver: true` :

```typescript
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ← Important !
})
```

---

## 🎉 C'est Prêt !

### **Workflow Complet**

```
Utilisateur crée une séance
        ↓
Badge débloqué via checkAndUnlockBadges()
        ↓
Insert dans user_badges avec is_new = true
        ↓
useBadgeUnlockNotification détecte (Realtime)
        ↓
Badge ajouté à la queue
        ↓
BadgeUnlockModal s'affiche avec animation
        ↓
Utilisateur ferme le modal
        ↓
Badge marqué is_new = false
        ↓
Badge suivant affiché (si queue non vide)
```

**Les badges s'affichent maintenant avec un effet WOW ! 🚀✨**

---

## 💡 Améliorations Futures (Optionnelles)

- 🔊 Ajouter un son de déblocage
- 🎆 Animation de feux d'artifice pour les légendaires
- 📸 Bouton "Partager" pour partager le badge
- 🏆 Statistiques (X badges débloqués sur Y)
- ⏱️ Fermeture automatique après 5 secondes
- 🎨 Thème clair/sombre
