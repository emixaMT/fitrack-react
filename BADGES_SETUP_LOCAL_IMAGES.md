# 🎨 Configuration des Images Locales pour les Badges

## ✅ Configuration Complète

Votre système est maintenant configuré pour charger automatiquement les images depuis `src/assets/badges/` !

---

## 📁 Structure des Dossiers

```
src/
  assets/
    badges/
      first_workout.png
      note_taker.png
      workout_10.png
      workout_50.png
      workout_100.png
      workout_250.png
      heavy_lifter.png
      bench_king.png
      deadlift_beast.png
      early_bird.png
      note_master.png
      weight_tracker.png
      crossfit_lover.png
      runner.png
      cyclist.png
      streak_7.png
      streak_30.png
      monthly_goal.png
      monthly_goal_3.png
```

---

## 🎯 Liste des Badges à Créer

Voici la liste des 18 badges qui ont besoin d'images :

### Badges Communs (4)
- ✅ `first_workout.png` - Premier Pas
- ✅ `note_taker.png` - Archiviste
- ✅ `weight_tracker.png` - Suivi du Poids
- ✅ `monthly_goal.png` - Objectif Mensuel

### Badges Rares (10)
- ✅ `workout_10.png` - Débutant Motivé
- ✅ `workout_50.png` - Athlète Régulier
- ✅ `early_bird.png` - Lève-Tôt
- ✅ `heavy_lifter.png` - Force Brute
- ✅ `bench_king.png` - Roi du Développé
- ✅ `note_master.png` - Maître des Notes
- ✅ `crossfit_lover.png` - Addict CrossFit
- ✅ `runner.png` - Coureur
- ✅ `cyclist.png` - Cycliste
- ✅ `streak_7.png` - Semaine Parfaite

### Badges Épiques (4)
- ✅ `workout_100.png` - Centurion
- ✅ `streak_30.png` - Un Mois de Fer
- ✅ `deadlift_beast.png` - Bête de Soulevé
- ✅ `monthly_goal_3.png` - Triple Champion

### Badges Légendaires (1)
- ✅ `workout_250.png` - Légende

---

## 📐 Format des Images

### Spécifications Recommandées

| Propriété | Valeur |
|-----------|--------|
| **Dimensions** | 512x512px (carré) |
| **Format** | PNG avec transparence |
| **Poids** | < 100 KB par image |
| **Résolution** | 72 DPI minimum |

### Exemple de Commande ImageMagick

Si vous avez des images à redimensionner :

```bash
# Redimensionner une image
convert image.png -resize 512x512 -quality 85 badge.png

# Traiter un dossier entier
for img in *.png; do
  convert "$img" -resize 512x512 -quality 85 "resized_$img"
done
```

---

## 🎨 Design Guidelines

### Par Rareté

#### Commun (Gris)
- **Couleurs** : Gris (#9CA3AF), Blanc
- **Style** : Simple, minimaliste
- **Exemple** : Médaille de base, étoile simple

#### Rare (Bleu)
- **Couleurs** : Bleu (#3B82F6), Cyan
- **Style** : Brillant, avec des reflets
- **Exemple** : Trophée bleu, étoile brillante

#### Épique (Violet)
- **Couleurs** : Violet (#A855F7), Magenta
- **Style** : Lumineux, effet de particules
- **Exemple** : Couronne violette, gemme éclatante

#### Légendaire (Or)
- **Couleurs** : Or (#F59E0B), Jaune brillant
- **Style** : Éclatant, effet 3D, rayonnant
- **Exemple** : Couronne d'or, trophée doré avec rayons

---

## 🚀 Comment Ajouter vos Images

### Étape 1 : Créer/Obtenir les Images

Vous pouvez :
- ✅ Les créer vous-même (Figma, Photoshop, Canva)
- ✅ Utiliser des générateurs IA (Midjourney, DALL-E)
- ✅ Utiliser des icônes de sites gratuits (Flaticon, Noun Project)
- ✅ Commander à un designer

### Étape 2 : Placer les Images

1. Assurez-vous que le dossier existe : `src/assets/badges/`
2. Copiez vos images PNG dans ce dossier
3. Renommez-les selon les codes des badges (voir liste ci-dessus)

### Étape 3 : Tester

```bash
# Relancez votre app
npm start

# Ou rebuilder si nécessaire
npx expo prebuild --clean
npx expo run:android
```

---

## 🧪 Tester un Badge Spécifique

Pour tester si votre image s'affiche correctement :

```typescript
// Testez dans votre console ou un screen de test
import { BADGE_IMAGES } from './constantes/badgeImages';

// Vérifier si l'image est chargée
console.log('first_workout:', BADGE_IMAGES['first_workout']);

// Si undefined ou null, l'image n'est pas trouvée
```

---

## 🔧 Ajouter un Nouveau Badge avec Image

### 1. Créer l'image
Placez `mon_nouveau_badge.png` dans `src/assets/badges/`

### 2. Ajouter dans badgeImages.ts

```typescript
export const BADGE_IMAGES: Record<string, any> = {
  // ... badges existants
  
  mon_nouveau_badge: require('../src/assets/badges/mon_nouveau_badge.png'),
};
```

### 3. Créer le badge en base de données

```sql
INSERT INTO public.badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'mon_nouveau_badge',
  'Mon Nouveau Badge',
  'Description du badge',
  '🎯', -- Emoji fallback
  'special',
  'rare',
  'custom_condition',
  100,
  50
);
```

---

## 📋 Checklist de Vérification

Avant de considérer que c'est terminé :

- [ ] Toutes les 18 images sont créées (512x512px, PNG)
- [ ] Les images sont placées dans `src/assets/badges/`
- [ ] Les noms de fichiers correspondent exactement aux codes badges
- [ ] Les images font moins de 100 KB chacune
- [ ] L'app a été relancée
- [ ] Les badges s'affichent correctement sur la page user
- [ ] Les badges s'affichent dans la modal de détails
- [ ] Les notifications de badges fonctionnent

---

## 🐛 Troubleshooting

### "Image not found" ou badge avec emoji

**Problème** : Le badge affiche l'emoji au lieu de l'image

**Solutions** :
1. Vérifiez que le fichier existe : `src/assets/badges/[code].png`
2. Vérifiez que le nom du fichier correspond EXACTEMENT au code du badge
3. Relancez l'app : `npm start`
4. Si Android, rebuilder : `npx expo run:android`

### L'image ne s'affiche pas après ajout

**Problème** : Vous avez ajouté une image mais elle ne s'affiche pas

**Solutions** :
1. Vérifiez que vous l'avez ajoutée dans `constantes/badgeImages.ts`
2. Vérifiez le `require()` path (doit être `../src/assets/badges/...`)
3. Relancez le Metro bundler
4. Clear cache : `npx expo start -c`

### "Cannot find module"

**Problème** : Erreur lors du chargement

**Solutions** :
1. Vérifiez que le fichier existe physiquement
2. Vérifiez le chemin dans le `require()`
3. Utilisez un chemin relatif correct depuis `constantes/`
4. Rebuild : `npx expo prebuild --clean`

---

## 💡 Conseils Pro

### Pour le Design
1. Gardez un style cohérent pour tous les badges
2. Utilisez des contours pour qu'ils ressortent sur fond sombre
3. Évitez les détails trop fins (lisibilité en small)
4. Testez à différentes tailles

### Pour l'Optimisation
1. Utilisez TinyPNG pour compresser
2. Gardez la transparence (PNG)
3. Exportez en @2x pour la clarté
4. Limitez le nombre de couleurs

### Pour la Maintenance
1. Gardez les sources (PSD, Figma)
2. Utilisez un naming cohérent
3. Documentez les couleurs utilisées
4. Versionnez vos assets

---

## 📚 Ressources Utiles

### Outils de Design
- **Figma** : https://figma.com
- **Canva** : https://canva.com
- **GIMP** : Gratuit et puissant

### Icônes et Assets
- **Flaticon** : https://flaticon.com
- **Noun Project** : https://thenounproject.com
- **Icons8** : https://icons8.com

### Optimisation
- **TinyPNG** : https://tinypng.com
- **Squoosh** : https://squoosh.app
- **ImageOptim** : https://imageoptim.com

### Inspiration
- **Dribbble** : Recherchez "achievement badges"
- **Pinterest** : Recherchez "game badges design"
- **Behance** : Projets de gamification

---

## ✨ Exemple Complet

Voici un workflow complet pour ajouter un badge avec image :

### 1. Design
```
Créer badge_exemple.png (512x512px, PNG, < 100 KB)
```

### 2. Placer le Fichier
```
src/assets/badges/badge_exemple.png
```

### 3. Configurer
```typescript
// constantes/badgeImages.ts
export const BADGE_IMAGES: Record<string, any> = {
  // ...
  badge_exemple: require('../src/assets/badges/badge_exemple.png'),
};
```

### 4. Créer en Base
```sql
INSERT INTO public.badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES ('badge_exemple', 'Badge Exemple', 'Un exemple de badge', '🏆', 'special', 'rare', 'example', 1, 50);
```

### 5. Tester
```bash
npm start
# L'image devrait maintenant s'afficher automatiquement !
```

---

## 🎉 C'est Prêt !

Votre système est configuré pour charger automatiquement les images locales. Il vous suffit maintenant de :

1. Créer vos 18 images de badges
2. Les placer dans `src/assets/badges/`
3. Relancer l'app

Les images s'afficheront automatiquement partout où les badges sont utilisés (page user, modal, notifications) ! 🚀

---

**Besoin d'aide ?** Consultez les autres documentations :
- `BADGES_README.md` - Documentation générale
- `BADGES_CUSTOM_IMAGES.md` - Guide complet des visuels personnalisés
- `BADGES_QUICK_START.md` - Démarrage rapide
