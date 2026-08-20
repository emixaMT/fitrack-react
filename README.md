# Fitrack

Application mobile de suivi de séances sportives, inspirée de Hevy et Strong.
Tracking, badges, niveaux, classement entre amis, défis quotidiens et thèmes personnalisables.

## Aperçu

Fitrack est une application React Native / Expo permettant de :

- **Tracker ses séances** — musculation, crossfit, running, vélo
- **Suivre sa progression** — records personnels, historique, graphiques
- **Débloquer des badges** — 19 badges répartis en 4 raretés
- **Monter en niveau** — système d'XP et de niveaux
- **Défis quotidiens** — un défi par jour avec explications détaillées
- **Amis et classement** — ajouter des amis par QR code, code ami ou email
- **Notes** — journal d'entraînement
- **Thèmes** — light/dark mode + couleur d'accent personnalisable

## Stack technique

| Domaine | Technologie |
|---------|-------------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navigation | Expo Router 6 |
| Langage | TypeScript 5.9 (strict mode) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Styling | NativeWind + ThemeContext personnalisé |
| Icônes | Ionicons (monochromes flat) |
| Animations | Lottie (flamme de streak) |
| State | React Context + hooks personnalisés |

## Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Compte Supabase avec un projet actif
- iOS Simulator ou Android Studio (pour le développement natif)

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/emixaMT/fitrack-react.git
cd fitrack-react

# 2. Installer les dépendances
npm install --legacy-peer-deps

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase :
#   EXPO_PUBLIC_SUPABASE_URL=your-project-url
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 4. Lancer l'app
npm start
```

## Configuration Supabase

### 1. Tables et RLS

Exécutez les fichiers SQL suivants dans le SQL Editor de Supabase, dans cet ordre :

1. **`supabase/rls_core_tables.sql`** — Active RLS sur les tables core (seances, notes, users, user_badges, performances, weight_entries, badges)
2. **`supabase/friends_schema.sql`** — Crée la table `friends` avec ses policies
3. **`supabase/friend_code_schema.sql`** — Ajoute la colonne `friend_code` + trigger d'auto-génération
4. **`migrations/create_session_counters_table.sql`** — Crée la table `session_counters`

### 2. Storage

Créez un bucket public nommé `avatars` dans Supabase → Storage pour les photos de profil.

### 3. Scripts optionnels

Des scripts admin sont disponibles dans `scripts/` :

- `add_monthly_goal.sql` — Configure l'objectif mensuel
- `removeAllBadges.sql` — Supprime tous les badges d'un utilisateur
- `resetBadgesSystem.sql` — Reset complet du système de badges
- `unlockAllBadges.sql` — Débloque tous les badges pour un utilisateur

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur de développement Expo |
| `npm run android` | Lance sur émulateur Android |
| `npm run ios` | Lance sur simulateur iOS |
| `npm run web` | Lance en mode web |
| `npm run type-check` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run audit` | Audit de sécurité des dépendances |
| `npm run deploy` | Build web + déploiement EAS |
| `npm run build:android:dev` | Build Android développement (EAS) |
| `npm run build:android:prod` | Build Android production (EAS) |
| `npm run build:ios:dev` | Build iOS développement (EAS) |
| `npm run build:ios:prod` | Build iOS production (EAS) |

## Structure du projet

```
fitrack-react/
├── src/
│   └── app/                    # Routes Expo Router
│       ├── (auth)/             # Authentification (login, register)
│       ├── (tabs)/             # Onglets principaux
│       │   ├── home.tsx        # Accueil (défis, slider, stats)
│       │   ├── workout.tsx     # Liste des séances (swipe to delete)
│       │   ├── note.tsx        # Notes
│       │   ├── amis.tsx        # Amis + classement + QR code
│       │   └── user.tsx        # Profil + badges + performances
│       ├── seances/            # Détail et création de séances
│       │   ├── [id].tsx        # Vue détail (export, records)
│       │   ├── create/         # Création en 2 étapes
│       │   └── edit/[id].tsx   # Édition
│       ├── compte/             # Édition du profil + performances
│       └── notes/              # Création de notes
├── components/                 # Composants réutilisables
│   ├── badges/                 # Système de badges
│   ├── SwipeableRow.tsx        # Swipe gauche pour supprimer
│   ├── Toast.tsx               # Notifications toast
│   ├── StreakFlame.tsx         # Animation flamme (Lottie)
│   └── ...
├── services/                   # Logique métier + API
│   ├── supabaseAuth.ts         # Authentification
│   ├── userService.ts          # Gestion utilisateurs
│   ├── friendsService.ts       # Amis + codes amis + classement
│   ├── badgeService.ts         # Badges + déblocage auto
│   ├── seanceIO.ts             # Export/import séances (JSON)
│   └── ...
├── hooks/                      # Hooks personnalisés
│   ├── useMonthlyProgress.ts   # Progression mensuelle + realtime
│   ├── useExerciseRecords.ts   # Records personnels
│   ├── useHeaderAvatar.tsx     # Avatar avec realtime
│   └── ...
├── contexts/                   # Contexts React
│   ├── AuthContext.tsx         # État d'authentification
│   ├── ThemeContext.tsx        # Thème + couleur d'accent
│   └── LevelContext.tsx        # Niveau et XP
├── constants/                  # Constantes
│   ├── sport.tsx               # Métadonnées des sports
│   ├── avatars.tsx             # Avatars prédéfinis
│   ├── badgeImages.ts          # Images des badges
│   └── challengeDetails.ts     # 23 défis quotidiens
├── config/
│   └── supabaseConfig.ts       # Configuration Supabase
├── utils/
│   ├── validation.ts           # Validation UUID, mot de passe, sanitisation
│   ├── logger.ts               # Logger (no-op en production)
│   └── styles.ts               # Styles partagés
├── supabase/                   # Schémas SQL de référence
└── scripts/                    # Scripts admin SQL
```

## Fonctionnalités

### Tracking de séances

- 4 catégories : musculation, crossfit, running, vélo
- Création en 2 étapes (choix du sport → détails)
- Exercices avec séries, reps, charge
- Objectifs endurance (km, vitesse, dénivelé, durée)
- Édition et suppression (swipe gauche)
- Export et import JSON (partage natif)

### Records personnels

- Calcul automatique du volume (charge x reps)
- Indicateur "Nouveau record" lors de la création
- Historique des max par exercice

### Système de badges

- 19 badges en 4 raretés (commun, rare, épique, légendaire)
- Déblocage automatique après chaque séance
- Notifications push à l'unlock
- Modal de visualisation avec détails

### Niveaux et XP

- Système d'XP basé sur les séances
- Barre de progression visuelle
- Mises à jour en temps réel (Supabase Realtime)

### Amis et classement

- Ajout par **QR code** (scan caméra)
- Ajout par **code ami** (8 caractères, saisie manuelle)
- Ajout par **email**
- Classement par badges et séances mensuelles
- Demandes d'amitié (envoi, acceptation, refus)
- Code ami unique par utilisateur (généré côté serveur)

### Défis quotidiens

- 23 défis avec explications détaillées
- Techniques, conseils, matériel, difficulté
- Calendrier de progression
- Modal explicatif complet

### Thèmes

- Light et dark mode (gris très foncé)
- Couleur d'accent personnalisable (cyan/teal par défaut)
- Application cohérente sur tous les écrans
- Icônes monochromes flat (Ionicons)

### Sécurité

- Row Level Security (RLS) sur toutes les tables
- Validation UUID sur les routes paramétrées
- SecureStore pour les tokens d'auth (mobile)
- Mot de passe fort requis (8+ caractères, majuscule, minuscule, chiffre, spécial)
- Logs désactivés en production
- HTTPS enforced sur Supabase
- Rate limiting sur l'authentification
- Checks d'ownership sur delete/update

## Déploiement

### Web (EAS)

```bash
npm run deploy
```

### Mobile (EAS Build)

```bash
# Connexion
npm run eas:login

# Android
npm run build:android:dev   # développement
npm run build:android:prod  # production

# iOS
npm run build:ios:dev       # développement
npm run build:ios:prod      # production
```

## Licence

Projet privé. Tous droits réservés.

## Auteur

**Maxime Thonneau** — [GitHub](https://github.com/emixaMT)
