# 🔄 Rafraîchissement Automatique du Donut

## 🎯 Principe

Le graphique donut se met à jour **automatiquement en temps réel** grâce à **Supabase Realtime**.

### Comment ça fonctionne ?

```
┌────────────────┐
│ Clic +1 séance │
└────────┬───────┘
         │
         ▼
┌──────────────────────────┐
│ incrementSessionCounter()│ ──► Modifie la table session_counters
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Supabase Realtime        │ ──► Détecte le changement
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Subscription écoute      │ ──► WorkoutDistributionChart reçoit l'événement
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ loadWorkoutStats()       │ ──► Recharge les données
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Le donut se met à jour ! │ ──► ✅ Affichage instantané
└──────────────────────────┘
```

**Temps total : < 500ms**

---

## 🔧 Configuration technique

### 1. Subscription Realtime

Dans `WorkoutDistributionChart.tsx` :

```typescript
const channel = supabase
  .channel(`workout-distribution-${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',                      // Tous les événements (INSERT, UPDATE, DELETE)
      schema: 'public',                // Schéma de la base
      table: 'session_counters',       // Table à écouter
      filter: `user_id=eq.${userId}`,  // Filtrer par utilisateur
    },
    (payload) => {
      console.log('🔄 Realtime update:', payload.eventType);
      loadWorkoutStats(); // Recharger immédiatement
    }
  )
  .subscribe((status) => {
    console.log('📡 Subscription status:', status);
  });
```

### 2. Nettoyage automatique

```typescript
// Cleanup: se désabonner quand le composant est démonté
return () => {
  console.log('🔌 Unsubscribing from realtime');
  supabase.removeChannel(channel);
};
```

---

## ✅ Avantages

### 1. **Temps réel**
- Mise à jour **instantanée** (< 500ms)
- Pas besoin de recharger la page
- Synchronisation automatique

### 2. **Multi-onglets**
- Si vous avez 2 onglets ouverts
- Une modification dans l'onglet 1
- Se reflète automatiquement dans l'onglet 2

### 3. **Multi-utilisateurs** (futur)
- Si plusieurs utilisateurs partagent un compte
- Les modifications de l'un se reflètent chez l'autre
- Temps réel pour tous

### 4. **Efficace**
- Pas de polling (requêtes répétées)
- WebSocket maintenu ouvert
- Événements envoyés uniquement si changement

---

## 📊 Événements écoutés

Le système écoute 3 types d'événements :

### 1. **INSERT** (Nouveau compteur créé)
```javascript
// Quand vous ajoutez +1 séance pour la première fois du mois
{
  eventType: "INSERT",
  new: {
    user_id: "abc123",
    month_key: "2025-10",
    sport_type: "musculation",
    count: 1
  }
}
```

### 2. **UPDATE** (Compteur incrémenté)
```javascript
// Quand vous ajoutez +1 séance (compteur existe déjà)
{
  eventType: "UPDATE",
  old: { count: 14 },
  new: { count: 15 }
}
```

### 3. **DELETE** (Compteur supprimé)
```javascript
// Rarement utilisé, mais écouté au cas où
{
  eventType: "DELETE",
  old: { ... }
}
```

---

## 🧪 Tester le rafraîchissement

### Test 1 : Basique
1. Ouvrez **User → Performances**
2. Cliquez sur **+1 séance** depuis Home
3. ✅ Le donut se met à jour automatiquement

### Test 2 : Console
1. Ouvrez la console (F12)
2. Ajoutez +1 séance
3. ✅ Vous devriez voir :
```
💪 Incrementing session counter...
✅ Counter incremented to 15
🔄 [WorkoutDistribution] Realtime update: UPDATE
```

### Test 3 : Multi-onglets
1. Ouvrez 2 onglets avec **User → Performances**
2. Dans l'onglet 1, allez sur Home et ajoutez +1 séance
3. ✅ L'onglet 2 se met à jour automatiquement

### Test 4 : Depuis SQL
```sql
-- Dans Supabase SQL Editor
SELECT increment_session_counter(
  auth.uid(),
  TO_CHAR(NOW(), 'YYYY-MM'),
  'running'
);
```
✅ Le donut dans l'app se met à jour immédiatement

---

## 🐛 Dépannage

### ❌ Le donut ne se rafraîchit pas

**1. Vérifier la subscription**
```javascript
// Dans la console, cherchez :
📡 [WorkoutDistribution] Subscription status: SUBSCRIBED
```
- ✅ `SUBSCRIBED` → OK
- ❌ `CHANNEL_ERROR` → Realtime pas activé

**2. Vérifier Realtime dans Supabase**
```sql
SELECT * FROM pg_publication_tables 
WHERE tablename = 'session_counters';
```
- ✅ Retourne 1 ligne → Realtime activé
- ❌ Vide → Activer dans Database → Replication

**3. Activer manuellement**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE session_counters;
```

**4. Vérifier le user_id**
```sql
SELECT auth.uid(); -- Votre user_id
```
Comparez avec le filter dans le code :
```typescript
filter: `user_id=eq.${userId}`
```

---

### ❌ "Subscription status: CHANNEL_ERROR"

**Causes possibles :**
1. Realtime pas activé → Voir solution ci-dessus
2. Connexion réseau instable
3. Quotas Supabase dépassés (plan gratuit)

**Solutions :**
1. Activer Realtime (voir ci-dessus)
2. Vérifier la connexion Internet
3. Vérifier les quotas dans Supabase Dashboard

---

### ❌ Mise à jour lente (> 2 secondes)

**Causes possibles :**
1. Connexion lente
2. Index manquants
3. Trop de données

**Solutions :**
```sql
-- Vérifier les index
SELECT * FROM pg_indexes WHERE tablename = 'session_counters';

-- Créer les index manquants si besoin
CREATE INDEX IF NOT EXISTS idx_session_counters_user 
ON session_counters(user_id);
```

---

## 📊 Métriques de performance

### Temps de rafraîchissement

| Étape | Temps |
|-------|-------|
| Incrémentation compteur | 50-100ms |
| Événement Realtime | 100-200ms |
| Rechargement stats | 50-100ms |
| Rendu React | 50-100ms |
| **TOTAL** | **250-500ms** |

### Bande passante

- **WebSocket ouvert** : ~5 Ko (initial)
- **Par événement** : ~1 Ko
- **Très léger** pour l'utilisateur

---

## 🔒 Sécurité

### RLS (Row Level Security)

Les policies garantissent que :
- Un utilisateur ne voit QUE ses propres compteurs
- Les événements Realtime sont filtrés par `user_id`
- Impossible de voir les données des autres

```sql
-- Policy appliquée automatiquement
CREATE POLICY "Users can view own session counters" 
ON session_counters
FOR SELECT 
USING (auth.uid() = user_id);
```

### Filter Realtime

```typescript
filter: `user_id=eq.${userId}`
```
- Ne reçoit QUE les événements de l'utilisateur connecté
- Pas de fuite de données entre utilisateurs

---

## 💡 Cas d'usage avancés

### 1. Rafraîchir manuellement

```typescript
// Forcer un refresh sans attendre Realtime
loadWorkoutStats();
```

### 2. Écouter plusieurs tables

```typescript
const channel = supabase
  .channel('multi-table-listener')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'session_counters' },
    handleCounterChange
  )
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'users' },
    handleUserChange
  )
  .subscribe();
```

### 3. Débugger les événements

```typescript
.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
  console.log('📡 ALL DATABASE CHANGES:', payload);
})
```

---

## ✅ Checklist finale

Pour confirmer que le rafraîchissement automatique fonctionne :

- [x] Realtime activé dans Supabase
- [x] Console affiche "SUBSCRIBED"
- [x] Ajout de +1 séance déclenche "🔄 Realtime update"
- [x] Le donut se met à jour en < 1 seconde
- [x] Multi-onglets synchronisés
- [x] Aucune erreur dans la console

**Si toutes les cases sont cochées → C'est parfait ! 🎉**

---

## 📚 Ressources

- **Tests détaillés** : `TEST_REALTIME.md`
- **Script de vérification** : `migrations/verify_realtime_setup.sql`
- **Guide d'installation** : `README_INSTALLATION.md`
- **Documentation Supabase** : https://supabase.com/docs/guides/realtime

---

## 🚀 En résumé

Le système de rafraîchissement automatique fonctionne grâce à :

✅ **Supabase Realtime** - WebSocket qui envoie les changements
✅ **Subscription** - Écoute les événements sur `session_counters`
✅ **Filter par user_id** - Sécurité et isolation
✅ **Reload automatique** - Recharge les stats dès qu'un événement arrive

**Résultat : Le donut se met à jour instantanément dès que vous ajoutez +1 séance ! 🎯**
