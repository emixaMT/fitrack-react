# 🔄 Guide de Migration - Système de Compteurs de Séances

## 📋 Vue d'ensemble

Le système a été modifié pour utiliser des **compteurs de séances simples** au lieu de créer des séances complètes dans la table `seances`. Cela permet un tracking rapide et efficace des séances sans avoir à gérer des exercices.

## ✨ Changements principaux

### 1. **Nouvelle table `session_counters`**
- Stocke les compteurs de séances par type (musculation, crossfit, running, vélo)
- Organisée par mois (format `YYYY-MM`)
- Chaque ligne = un compteur pour un type de sport dans un mois donné

### 2. **Nouveau service `sessionCounterService.ts`**
Fonctions disponibles :
- `incrementSessionCounter(userId, sportType)` - Incrémente un compteur
- `getMonthlyStats(userId, monthKey?)` - Stats du mois
- `getMonthlyTotal(userId)` - Total du mois actuel
- `getTotalHistoricalSessions(userId)` - Total historique toutes séances
- `getTotalByType(userId, sportType)` - Total par type de sport

### 3. **Modifications de l'UI**
- **home.tsx** : Le bouton "+1 séance" incrémente maintenant un compteur au lieu de créer une séance
- **WorkoutDistributionChart** : Lit maintenant depuis `session_counters` au lieu de `seances`

## 🚀 Étapes de migration

### Étape 1 : Exécuter le script SQL
```bash
# Dans l'éditeur SQL de Supabase, exécuter :
migrations/create_session_counters_table.sql
```

Ce script crée :
- La table `session_counters`
- Les index pour optimiser les requêtes
- Les policies RLS pour la sécurité
- La fonction `increment_session_counter()`
- Une vue `user_monthly_session_totals`

### Étape 2 : Migration des données existantes (optionnel)

Si vous avez déjà des séances dans la table `seances`, vous pouvez les migrer :

```sql
-- Migrer les séances existantes vers les compteurs
INSERT INTO session_counters (user_id, month_key, sport_type, count)
SELECT 
  id_user as user_id,
  TO_CHAR(created_at, 'YYYY-MM') as month_key,
  category as sport_type,
  COUNT(*) as count
FROM seances
WHERE category IN ('musculation', 'crossfit', 'running', 'velo')
GROUP BY id_user, TO_CHAR(created_at, 'YYYY-MM'), category
ON CONFLICT (user_id, month_key, sport_type) 
DO UPDATE SET count = session_counters.count + EXCLUDED.count;
```

### Étape 3 : Vérification

```sql
-- Vérifier les compteurs créés
SELECT * FROM session_counters ORDER BY updated_at DESC;

-- Vérifier le total pour un utilisateur
SELECT 
  user_id,
  month_key,
  SUM(count) as total_sessions
FROM session_counters
WHERE user_id = 'VOTRE_USER_ID'
GROUP BY user_id, month_key
ORDER BY month_key DESC;
```

## 📊 Fonctionnement du nouveau système

### Quand l'utilisateur clique sur "+1 séance" :

1. **Modal de sélection** : L'utilisateur choisit le type (Musculation, CrossFit, Course, Vélo)
2. **Incrémentation** : Le compteur du mois actuel est incrémenté pour ce type
3. **Mise à jour en temps réel** : Le graphique donut se met à jour automatiquement
4. **Compteur mensuel** : Le compteur `monthly_sessions` dans la table `users` est également incrémenté
5. **Badges** : Le système de badges continue de fonctionner normalement

### Architecture

```
┌─────────────────┐
│ Bouton +1 séance│
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│ SessionTypeModal   │ ──► Utilisateur choisit le type
└────────┬───────────┘
         │
         ▼
┌──────────────────────────────┐
│ incrementSessionCounter()     │ ──► Incrémente le compteur
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Table: session_counters      │
│ ┌─────────┬─────────┬──────┐ │
│ │ user_id │ muscul. │ 15   │ │
│ │ user_id │ running │ 8    │ │
│ │ user_id │ crossfit│ 12   │ │
│ └─────────┴─────────┴──────┘ │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Realtime Subscription        │ ──► Écoute les changements
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ WorkoutDistributionChart     │ ──► Se met à jour automatiquement
└──────────────────────────────┘
```

## 🔄 Temps réel

Le système utilise les **Supabase Realtime subscriptions** :
- Le graphique donut écoute les changements sur `session_counters`
- Dès qu'un compteur est incrémenté, le graphique se met à jour
- Aucun rechargement de page nécessaire

## 📝 Note importante

### Table `seances` toujours disponible
- La table `seances` existe toujours pour les séances détaillées
- Vous pouvez toujours créer des séances complètes avec exercices
- Les compteurs sont indépendants et servent uniquement au tracking rapide

### Double système
Vous avez maintenant 2 systèmes parallèles :
1. **Compteurs rapides** (`session_counters`) - Pour le tracking quotidien
2. **Séances détaillées** (`seances`) - Pour le journal d'entraînement complet

## 🎯 Avantages du nouveau système

✅ **Plus rapide** : Incrémentation instantanée, pas de formulaire
✅ **Plus simple** : 1 clic pour tracker une séance
✅ **Performant** : Queries optimisées avec index
✅ **Temps réel** : Mise à jour instantanée du graphique
✅ **Statistiques précises** : Compteurs par type de sport
✅ **Scalable** : Pas de multiplication des lignes dans `seances`

## 🐛 Dépannage

### Le graphique ne se met pas à jour ?
1. Vérifier que Realtime est activé dans Supabase
2. Vérifier les logs dans la console (🔄 [WorkoutDistribution] Realtime update)
3. Vérifier les policies RLS sur `session_counters`

### Les compteurs sont à 0 ?
1. Vérifier que le script SQL a été exécuté
2. Vérifier la fonction `increment_session_counter()` existe
3. Tester manuellement : `SELECT * FROM session_counters WHERE user_id = 'YOUR_ID'`

### Erreur lors de l'incrémentation ?
1. Vérifier les logs de la fonction RPC
2. Vérifier que l'utilisateur est bien authentifié
3. Vérifier le format de `sportType` (doit être : musculation | crossfit | running | velo)

## 📚 Ressources

- **Script SQL** : `migrations/create_session_counters_table.sql`
- **Service** : `services/sessionCounterService.ts`
- **Component** : `components/WorkoutDistributionChart.tsx`
- **Home** : `src/app/(tabs)/home.tsx`
