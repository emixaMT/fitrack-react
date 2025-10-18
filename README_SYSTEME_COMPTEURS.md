# 🎯 Système de Compteurs de Séances

> **Tracking rapide et automatique de vos séances avec mise à jour en temps réel**

---

## ⚡ TL;DR (Trop Long, Pas Lu)

**Ce qui a changé :**
- Clic sur "+1 séance" → **Ne crée plus de séance complète**
- Incrémente simplement un **compteur par type de sport**
- Le graphique donut se met à jour **automatiquement en temps réel**
- Plus rapide, plus simple, plus performant

**Pour installer :**
1. Exécuter `migrations/create_session_counters_table.sql` dans Supabase
2. Activer Realtime pour la table `session_counters`
3. C'est prêt ! ✅

**Temps d'installation : 5 minutes**

---

## 📚 Documentation complète

### 🚀 Installation
📄 **[README_INSTALLATION.md](./README_INSTALLATION.md)**
- Guide d'installation pas à pas (5 min)
- Tous les scripts SQL à exécuter
- Tests de vérification

**👉 Commencez ici si vous installez le système**

---

### 📖 Comprendre le système
📄 **[NOUVEAU_SYSTEME_SEANCES.md](./NOUVEAU_SYSTEME_SEANCES.md)**
- Fonctionnement détaillé
- Avantages du nouveau système
- Exemples d'utilisation
- FAQ complète

**👉 Lisez ceci pour comprendre le concept**

---

### 🔄 Rafraîchissement automatique
📄 **[REFRESH_AUTOMATIQUE.md](./REFRESH_AUTOMATIQUE.md)**
- Comment fonctionne le temps réel
- Architecture Supabase Realtime
- Métriques de performance
- Dépannage complet

**👉 Pour comprendre pourquoi le donut se met à jour tout seul**

---

### 🧪 Tests
📄 **[TEST_REALTIME.md](./TEST_REALTIME.md)**
- Checklist de tests complète
- Vérification de la subscription
- Tests multi-onglets
- Debug avancé

**👉 Pour tester que tout fonctionne correctement**

---

### 🔧 Guide technique
📄 **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**
- Architecture détaillée
- Fichiers modifiés
- API du service
- Dépannage technique

**👉 Pour les développeurs**

---

### 📚 Index complet
📄 **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)**
- Index de toute la documentation
- Workflows par cas d'usage
- Structure du projet
- Checklist complète

**👉 Pour naviguer dans toute la doc**

---

## 🎯 Démarrage rapide

### Étape 1 : Créer la table (1 minute)

Dans Supabase SQL Editor :
```sql
-- Copier et exécuter : migrations/create_session_counters_table.sql
```

### Étape 2 : Activer Realtime (30 secondes)

1. Supabase → Database → Replication
2. Trouver `session_counters`
3. Cocher la case ✅

### Étape 3 : Tester (30 secondes)

1. Ouvrir l'app
2. Cliquer sur "+1 séance"
3. Choisir un type
4. ✅ Le donut se met à jour automatiquement

---

## ✨ Fonctionnalités

### 🎨 Interface
- **Bouton "+1 séance"** sur la page Home
- **Modal de sélection** du type de sport
- **Graphique donut** dans User → Performances
- **Tooltips interactifs** au clic

### ⚡ Performance
- **Temps réel** : Mise à jour en < 500ms
- **Multi-onglets** : Synchronisation automatique
- **Léger** : Base de données optimisée
- **Rapide** : Pas de séances vides créées

### 🔒 Sécurité
- **RLS activé** : Chaque utilisateur voit uniquement ses données
- **Policies strictes** : SELECT, INSERT, UPDATE, DELETE protégés
- **Filter Realtime** : Événements filtrés par user_id

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Application React                   │
│                                                      │
│  ┌──────────────┐      ┌───────────────────────┐  │
│  │ Page Home    │      │ Page User             │  │
│  │              │      │                       │  │
│  │ [+1 séance] ──────► │ 🍩 Graphique Donut   │  │
│  └──────────────┘      └───────────────────────┘  │
│         │                        ▲                  │
└─────────┼────────────────────────┼──────────────────┘
          │                        │
          │ incrementCounter()     │ Realtime
          ▼                        │ Subscription
┌─────────────────────────────────────────────────────┐
│              Supabase Backend                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Table: session_counters                     │  │
│  │  ┌────────┬───────────┬───────────┬───────┐ │  │
│  │  │user_id │ month_key │ sport_type│ count │ │  │
│  │  ├────────┼───────────┼───────────┼───────┤ │  │
│  │  │ abc123 │ 2025-10   │ muscu     │  15   │ │  │
│  │  │ abc123 │ 2025-10   │ running   │   8   │ │  │
│  │  └────────┴───────────┴───────────┴───────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  📡 Supabase Realtime WebSocket                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Technologies utilisées

- **React Native** : Framework mobile
- **Supabase** : Backend (BaaS)
- **Supabase Realtime** : Temps réel via WebSocket
- **PostgreSQL** : Base de données
- **RLS (Row Level Security)** : Sécurité
- **React Native SVG** : Graphique donut personnalisé
- **TypeScript** : Type-safety

---

## 📈 Métriques

### Performance
- **Temps de réponse** : < 500ms
- **Taille base** : ~100 lignes/utilisateur/an (vs 1000+ avec séances)
- **Bande passante** : ~1 Ko par événement Realtime

### Scalabilité
- **Utilisateurs** : Illimité (limité par plan Supabase)
- **Compteurs** : 4 types × 12 mois × N utilisateurs
- **Realtime** : WebSocket maintenu ouvert

---

## 🐛 Dépannage rapide

### Le donut ne se rafraîchit pas
```sql
-- Vérifier que Realtime est activé
SELECT * FROM pg_publication_tables WHERE tablename = 'session_counters';
```
→ Si vide, activer dans Database → Replication

### "CHANNEL_ERROR" dans la console
- Realtime pas activé → Voir ci-dessus
- Connexion réseau → Vérifier Internet
- Quotas dépassés → Vérifier plan Supabase

### Le compteur ne s'incrémente pas
```sql
-- Tester manuellement
SELECT increment_session_counter(
  auth.uid(),
  TO_CHAR(NOW(), 'YYYY-MM'),
  'musculation'
);
```

**Plus de solutions** → [`TEST_REALTIME.md`](./TEST_REALTIME.md)

---

## 📝 Scripts SQL disponibles

| Script | Description | Quand l'utiliser |
|--------|-------------|------------------|
| `create_session_counters_table.sql` | Création table + fonction | **Installation (obligatoire)** |
| `migrate_existing_seances.sql` | Migration données existantes | Optionnel (si données à migrer) |
| `verify_realtime_setup.sql` | Diagnostic complet | Vérification post-installation |
| `update_all_badges.sql` | Mise à jour badges | Système de gamification |

---

## 💻 API TypeScript

### Service principal

```typescript
import { 
  incrementSessionCounter,
  getMonthlyStats,
  getTotalHistoricalSessions,
  getTotalByType
} from './services/sessionCounterService';

// Incrémenter un compteur
await incrementSessionCounter(userId, 'musculation');

// Stats du mois actuel
const stats = await getMonthlyStats(userId);
// { musculation: 15, crossfit: 8, running: 12, velo: 5, total: 40 }

// Total historique
const total = await getTotalHistoricalSessions(userId);
// 142

// Total par type
const muscu = await getTotalByType(userId, 'musculation');
// 58
```

---

## ✅ Checklist d'installation

- [ ] ✅ Script SQL principal exécuté
- [ ] ✅ Realtime activé
- [ ] ✅ Console affiche "SUBSCRIBED"
- [ ] ✅ +1 séance fonctionne
- [ ] ✅ Donut s'affiche
- [ ] ✅ Refresh automatique testé
- [ ] ✅ Aucune erreur

**Toutes les cases cochées ?** → **C'est parfait ! 🎉**

---

## 🚀 Prochaines étapes

1. **Installer le système** → [`README_INSTALLATION.md`](./README_INSTALLATION.md)
2. **Tester** → [`TEST_REALTIME.md`](./TEST_REALTIME.md)
3. **Comprendre** → [`NOUVEAU_SYSTEME_SEANCES.md`](./NOUVEAU_SYSTEME_SEANCES.md)
4. **Développer** → [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)

---

## 📞 Support

- **Tests** : [`TEST_REALTIME.md`](./TEST_REALTIME.md)
- **Dépannage** : [`REFRESH_AUTOMATIQUE.md`](./REFRESH_AUTOMATIQUE.md)
- **Vérification** : `migrations/verify_realtime_setup.sql`
- **Index complet** : [`DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md)

---

## 🎉 Résultat final

Après installation, vous aurez :

✅ Un système de **tracking ultra-rapide** (1 clic = +1 séance)
✅ Un **graphique donut interactif** qui se met à jour automatiquement
✅ Une **synchronisation en temps réel** entre tous vos onglets
✅ Une **base de données optimisée** et performante
✅ Un **système évolutif** pour les futures fonctionnalités

**Bon tracking ! 💪🏃🚴**
