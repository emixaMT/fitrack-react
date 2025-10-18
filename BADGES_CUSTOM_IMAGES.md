# 🎨 Guide des Visuels Personnalisés pour les Badges

Ce guide explique comment utiliser des images personnalisées pour vos badges au lieu des emojis par défaut.

---

## 📋 Table des Matières

1. [Méthodes d'Intégration](#méthodes-dintégration)
2. [Option 1: Images Supabase Storage](#option-1-images-supabase-storage)
3. [Option 2: Images Locales (Assets)](#option-2-images-locales-assets)
4. [Option 3: URLs Externes](#option-3-urls-externes)
5. [Exemples de Code](#exemples-de-code)
6. [Bonnes Pratiques](#bonnes-pratiques)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Méthodes d'Intégration

Le système de badges supporte **3 méthodes** pour afficher des visuels personnalisés :

| Méthode | Avantages | Inconvénients |
|---------|-----------|---------------|
| **Supabase Storage** | Facile à gérer, hébergement inclus, URLs stables | Nécessite configuration Storage |
| **Assets Locales** | Performances optimales, pas de connexion requise | Taille de l'app augmentée |
| **URLs Externes** | Pas de setup, flexible | Dépend d'un service externe |

### Priorité d'Affichage

Le composant Badge affiche dans cet ordre :
1. ✅ `image_url` (si présent) - Supabase Storage ou URL externe
2. ✅ `image_local` (si présent) - Image locale
3. ✅ `icon` (emoji) - Fallback par défaut

---

## Option 1: Images Supabase Storage

### Étape 1 : Créer un Bucket Storage

1. Ouvrez votre projet Supabase
2. Allez dans **Storage** → **Create a new bucket**
3. Nommez-le `badges`
4. Cochez **Public bucket** ✅
5. Cliquez sur **Create bucket**

### Étape 2 : Uploader vos Images

1. Cliquez sur le bucket `badges`
2. Cliquez sur **Upload files**
3. Uploadez vos images (PNG, JPG, SVG recommandés)
4. **Format recommandé** : 512x512px, PNG transparent

### Étape 3 : Configurer les Policies

Exécutez ce SQL dans **SQL Editor** :

```sql
-- Permettre la lecture publique des images
CREATE POLICY "Public badge images"
ON storage.objects FOR SELECT
USING (bucket_id = 'badges');
```

### Étape 4 : Ajouter le Champ image_url

Exécutez le fichier `supabase_badges_image_support.sql` :

```sql
ALTER TABLE public.badges 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Étape 5 : Mettre à Jour vos Badges

```sql
-- Obtenir l'URL de l'image uploadée
-- Format: https://VOTRE_PROJET.supabase.co/storage/v1/object/public/badges/nom-fichier.png

-- Mettre à jour un badge existant
UPDATE public.badges 
SET image_url = 'https://tlcmvzbdzodrtyymimlu.supabase.co/storage/v1/object/public/badges/first_workout.png'
WHERE code = 'first_workout';

-- Créer un nouveau badge avec image
INSERT INTO public.badges (code, name, description, icon, image_url, category, rarity, condition_type, condition_value, points)
VALUES (
  'strength_master',
  'Maître de la Force',
  'Atteignez 500kg total SBD',
  '💪', -- Fallback emoji
  'https://tlcmvzbdzodrtyymimlu.supabase.co/storage/v1/object/public/badges/strength_master.png',
  'performance',
  'legendary',
  'total_sbd',
  500,
  500
);
```

---

## Option 2: Images Locales (Assets)

### Étape 1 : Organiser vos Assets

Créez une structure de dossiers :

```
assets/
  badges/
    common/
      first_workout.png
      note_taker.png
    rare/
      workout_10.png
      heavy_lifter.png
    epic/
      workout_100.png
      streak_30.png
    legendary/
      workout_250.png
```

### Étape 2 : Créer un Fichier de Configuration

Créez `constantes/badgeImages.ts` :

```typescript
// FILE: constantes/badgeImages.ts

export const BADGE_IMAGES = {
  // Common badges
  first_workout: require('../assets/badges/common/first_workout.png'),
  note_taker: require('../assets/badges/common/note_taker.png'),
  
  // Rare badges
  workout_10: require('../assets/badges/rare/workout_10.png'),
  heavy_lifter: require('../assets/badges/rare/heavy_lifter.png'),
  
  // Epic badges
  workout_100: require('../assets/badges/epic/workout_100.png'),
  streak_30: require('../assets/badges/epic/streak_30.png'),
  
  // Legendary badges
  workout_250: require('../assets/badges/legendary/workout_250.png'),
  
  // ... ajoutez tous vos badges
};

export type BadgeCode = keyof typeof BADGE_IMAGES;
```

### Étape 3 : Mapper les Images aux Badges

Modifiez `services/badgeService.ts` :

```typescript
import { BADGE_IMAGES, BadgeCode } from '../constantes/badgeImages';

// Dans la fonction getAllBadges ou getUserBadges
export const getAllBadges = async (): Promise<Badge[]> => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: true });

    if (error) throw error;
    
    // Mapper les images locales
    return (data || []).map(badge => ({
      ...badge,
      image_local: BADGE_IMAGES[badge.code as BadgeCode],
    }));
  } catch (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }
};
```

---

## Option 3: URLs Externes

### Utilisation Simple

Mettez à jour directement vos badges avec des URLs externes :

```sql
-- Utiliser une image depuis un CDN
UPDATE public.badges 
SET image_url = 'https://cdn.example.com/badges/first_workout.png'
WHERE code = 'first_workout';

-- Utiliser une image depuis imgur, cloudinary, etc.
UPDATE public.badges 
SET image_url = 'https://i.imgur.com/abc123.png'
WHERE code = 'workout_10';
```

### CDN Recommandés

- **Imgur** : Gratuit, facile
- **Cloudinary** : Optimisation d'images incluse
- **GitHub** : Si votre projet est open source
- **Vercel/Netlify** : Si vous avez déjà un hosting

---

## 🔧 Exemples de Code

### Exemple 1 : Badge avec Image Supabase Storage

```typescript
// Créer un badge dans votre code
import { supabase } from './config/supabaseConfig';

const createBadgeWithImage = async () => {
  const { data, error } = await supabase
    .from('badges')
    .insert({
      code: 'marathon_runner',
      name: 'Marathonien',
      description: 'Complétez un marathon',
      icon: '🏃',
      image_url: 'https://votre-projet.supabase.co/storage/v1/object/public/badges/marathon.png',
      category: 'workout_type',
      rarity: 'epic',
      condition_type: 'marathon_completed',
      condition_value: 1,
      points: 300,
    });
  
  return data;
};
```

### Exemple 2 : Badge avec Image Locale

```typescript
// constantes/badgeImages.ts
export const BADGE_IMAGES = {
  marathon_runner: require('../assets/badges/marathon_runner.png'),
};

// services/badgeService.ts
import { BADGE_IMAGES } from '../constantes/badgeImages';

export const getBadgeWithLocalImage = (badgeCode: string) => {
  return {
    ...badge,
    image_local: BADGE_IMAGES[badgeCode],
  };
};
```

### Exemple 3 : Badge avec Image Dynamique

```typescript
// Choisir dynamiquement entre URL et local
export const getBadgeImage = (badge: Badge) => {
  if (badge.image_url) {
    // Utiliser l'image depuis Supabase ou URL externe
    return { uri: badge.image_url };
  } else if (BADGE_IMAGES[badge.code]) {
    // Utiliser l'image locale
    return BADGE_IMAGES[badge.code];
  } else {
    // Fallback sur l'emoji
    return null;
  }
};
```

---

## 🎨 Bonnes Pratiques

### Taille et Format des Images

| Aspect | Recommandation | Raison |
|--------|----------------|--------|
| **Dimensions** | 512x512px | S'affiche bien à toutes les tailles |
| **Format** | PNG avec transparence | Meilleure qualité, fond transparent |
| **Poids** | < 100 KB | Chargement rapide |
| **Ratio** | 1:1 (carré) | S'intègre dans les cercles |

### Optimisation

```bash
# Utiliser TinyPNG ou ImageOptim pour compresser
# Exemple avec ImageMagick:
convert badge.png -resize 512x512 -quality 85 badge_optimized.png
```

### Naming Convention

```
[badge_code]_[size].png

Exemples:
- first_workout_512.png
- marathon_runner_512.png
- strength_master_512.png
```

### Design Tips

1. ✅ **Utilisez des couleurs vives** qui correspondent à la rareté
2. ✅ **Ajoutez un contour** pour ressortir sur fond sombre
3. ✅ **Gardez le design simple** (lisible en petit)
4. ✅ **Utilisez des icônes vectorielles** quand possible
5. ✅ **Testez sur différentes tailles** (small, medium, large)

---

## 🎭 Exemples de Design

### Badge Commun (Common)
```
- Couleurs: Gris, blanc
- Style: Simple, minimaliste
- Exemples: Médaille de base, étoile simple
```

### Badge Rare (Rare)
```
- Couleurs: Bleu, cyan
- Style: Brillant, avec des reflets
- Exemples: Trophée bleu, étoile brillante
```

### Badge Épique (Epic)
```
- Couleurs: Violet, magenta
- Style: Lumineux, effet de particules
- Exemples: Couronne violette, gemme
```

### Badge Légendaire (Legendary)
```
- Couleurs: Or, jaune brillant
- Style: Éclatant, effet 3D
- Exemples: Couronne d'or, trophée doré
```

---

## 📦 Structure Recommandée du Projet

```
test/
├── assets/
│   └── badges/
│       ├── common/
│       │   ├── first_workout.png
│       │   └── note_taker.png
│       ├── rare/
│       │   ├── workout_10.png
│       │   └── heavy_lifter.png
│       ├── epic/
│       │   ├── workout_100.png
│       │   └── streak_30.png
│       └── legendary/
│           └── workout_250.png
├── constantes/
│   └── badgeImages.ts
└── services/
    └── badgeService.ts
```

---

## 🐛 Troubleshooting

### L'image ne s'affiche pas

**Problème** : L'image apparaît cassée ou ne charge pas

**Solutions** :
1. Vérifiez que l'URL est correcte
2. Vérifiez les policies Supabase Storage (si Storage)
3. Testez l'URL dans un navigateur
4. Vérifiez que le bucket est public
5. Regardez les logs React Native pour les erreurs

### L'image est floue

**Problème** : L'image apparaît pixelisée

**Solutions** :
1. Augmentez la résolution (utilisez 512x512px minimum)
2. Utilisez PNG au lieu de JPG
3. Vérifiez `resizeMode="contain"` dans le composant Image

### L'image ne s'affiche pas sur Android/iOS

**Problème** : Fonctionne en dev mais pas en production

**Solutions** :
1. Pour images locales : Vérifiez que les assets sont inclus dans le build
2. Pour URLs : Vérifiez les permissions réseau dans AndroidManifest.xml / Info.plist
3. Testez avec une URL HTTPS (pas HTTP)

### Performance lente

**Problème** : L'app ralentit avec beaucoup de badges

**Solutions** :
1. Optimisez la taille des images (< 100 KB chacune)
2. Utilisez le lazy loading
3. Activez le cache des images
4. Considérez utiliser des images locales

---

## 🚀 Workflow Recommandé

### 1. Design
- Créez vos designs de badges dans Figma/Photoshop
- Exportez en PNG 512x512px avec transparence

### 2. Optimisation
- Compressez avec TinyPNG ou ImageOptim
- Visez < 100 KB par image

### 3. Upload
- **Option A** : Uploadez sur Supabase Storage
- **Option B** : Ajoutez dans `/assets/badges/`

### 4. Configuration
- Mettez à jour le SQL avec les URLs (Option A)
- Ou configurez `badgeImages.ts` (Option B)

### 5. Test
- Testez sur différents appareils
- Vérifiez les 3 tailles (small, medium, large)
- Testez avec connexion lente

---

## 📚 Ressources

### Outils de Design
- **Figma** : Design d'interface
- **Canva** : Templates de badges
- **Flaticon** : Icônes vectorielles
- **Noun Project** : Icônes minimalistes

### Outils d'Optimisation
- **TinyPNG** : Compression PNG
- **ImageOptim** : Compression (Mac)
- **Squoosh** : Compression en ligne

### Inspiration
- **Dribbble** : Designs de badges
- **Pinterest** : Collections de badges
- **Behance** : Projets de gamification

---

## 💡 Conseils Pro

1. **Cohérence visuelle** : Gardez le même style pour tous les badges
2. **Thème** : Adaptez le design à votre application fitness
3. **Accessibilité** : Ajoutez toujours un emoji fallback
4. **Version** : Gardez une version SVG pour une évolution future
5. **Documentation** : Documentez la signification de chaque badge

---

## ✅ Checklist d'Intégration

- [ ] Choisir une méthode (Storage / Local / Externe)
- [ ] Créer/obtenir les images des badges
- [ ] Optimiser les images (< 100 KB)
- [ ] Configurer Supabase Storage (si applicable)
- [ ] Ajouter la colonne `image_url` à la table
- [ ] Mettre à jour les badges existants
- [ ] Tester sur différents appareils
- [ ] Vérifier les performances
- [ ] Ajouter des fallbacks (emojis)
- [ ] Documenter pour votre équipe

---

**Prêt à personnaliser vos badges ! 🎨**

Pour toute question, consultez les autres documentations :
- `BADGES_README.md` - Documentation générale
- `BADGES_QUICK_START.md` - Démarrage rapide
- `BADGES_INTEGRATION_EXAMPLES.md` - Exemples de code
