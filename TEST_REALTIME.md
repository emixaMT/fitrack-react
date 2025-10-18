# 🧪 Test du Rafraîchissement Automatique du Donut

## 📋 Checklist de test

### ✅ Préparation

1. **Vérifier que Realtime est activé dans Supabase**
   - Allez dans Supabase → Database → Replication
   - Cherchez `session_counters`
   - Assurez-vous que la réplication est activée ✅

2. **Ouvrir la console du navigateur**
   - F12 ou Clic droit → Inspecter
   - Onglet Console
   - Vous verrez les logs en temps réel

### 🧪 Test 1 : Subscription active

**Procédure :**
1. Ouvrez l'application
2. Allez dans **User** → Onglet **Performances**
3. Regardez la console

**Résultat attendu :**
```
📡 [WorkoutDistribution] Subscription status: SUBSCRIBED
```

✅ **Si vous voyez ce message** → La subscription est active !
❌ **Si vous ne le voyez pas** → Voir section Dépannage ci-dessous

---

### 🧪 Test 2 : Incrémentation depuis l'application

**Procédure :**
1. Gardez la page **User → Performances** ouverte
2. Ouvrez un autre onglet avec la page **Home**
3. Cliquez sur **+1 séance**
4. Choisissez un type (ex: Musculation)
5. Retournez sur l'onglet **User → Performances**

**Résultat attendu dans la console :**
```
💪 Incrementing session counter for category: musculation
✅ Counter incremented to X for musculation
🔄 [WorkoutDistribution] Realtime update: INSERT {...}
```

**Résultat attendu visuel :**
- Le graphique donut se met à jour automatiquement
- Le nombre dans la légende change
- Le nombre au centre du donut augmente

✅ **Si le donut se met à jour automatiquement** → Realtime fonctionne !
❌ **Si le donut ne change pas** → Voir section Dépannage

---

### 🧪 Test 3 : Incrémentation depuis Supabase (test avancé)

**Procédure :**
1. Gardez la page **User → Performances** ouverte
2. Ouvrez Supabase SQL Editor
3. Exécutez :
```sql
-- Remplacez YOUR_USER_ID par votre vrai user_id
SELECT increment_session_counter(
  'YOUR_USER_ID'::uuid,
  '2025-10'::text,
  'running'::text
);
```
4. Retournez sur votre application

**Résultat attendu :**
- Console affiche : `🔄 [WorkoutDistribution] Realtime update: UPDATE`
- Le donut se met à jour automatiquement
- Le compteur "running" augmente de 1

✅ **Si ça fonctionne** → Realtime est parfaitement configuré !

---

### 🧪 Test 4 : Multi-onglets (test de synchronisation)

**Procédure :**
1. Ouvrez 2 onglets de votre application
2. Dans les deux, allez sur **User → Performances**
3. Dans le premier onglet, cliquez sur **Home** puis **+1 séance**
4. Regardez le deuxième onglet

**Résultat attendu :**
- Le donut dans le **deuxième onglet** se met à jour automatiquement
- Sans recharger la page
- En temps réel

✅ **Si les deux onglets se synchronisent** → Parfait !

---

## 🔍 Vérification dans la console

### Logs normaux (tout fonctionne)

```javascript
// Au chargement de la page User
📡 [WorkoutDistribution] Subscription status: SUBSCRIBED

// Quand vous ajoutez +1 séance
💪 Incrementing session counter for category: musculation
✅ Counter incremented to 15 for musculation

// Mise à jour automatique du graphique
🔄 [WorkoutDistribution] Realtime update: INSERT {
  eventType: "INSERT",
  new: { user_id: "...", sport_type: "musculation", count: 15 }
}
```

### Logs d'erreur

```javascript
// Subscription échouée
📡 [WorkoutDistribution] Subscription status: CHANNEL_ERROR
❌ Problème : Realtime n'est pas activé

// Pas de mise à jour
// Aucun log "🔄" après avoir ajouté une séance
❌ Problème : Realtime n'écoute pas les changements
```

---

## 🐛 Dépannage

### ❌ Le donut ne se rafraîchit pas

**Solution 1 : Vérifier Realtime dans Supabase**
```sql
-- Vérifier que Realtime est activé pour session_counters
SELECT 
  schemaname, 
  tablename, 
  publication_name
FROM pg_publication_tables
WHERE tablename = 'session_counters';
```

Si vide, activer manuellement :
1. Supabase → Database → Replication
2. Trouver `session_counters`
3. Cocher la case

**Solution 2 : Vérifier les policies RLS**
```sql
-- Vérifier que les policies existent
SELECT * FROM pg_policies 
WHERE tablename = 'session_counters';
```

Doit retourner 4 policies (SELECT, INSERT, UPDATE, DELETE).

**Solution 3 : Forcer la reconnexion**
```typescript
// Dans la console du navigateur
supabase.removeAllChannels()
// Puis recharger la page
```

**Solution 4 : Vérifier le filter**
```sql
-- Vérifier votre user_id
SELECT auth.uid();
```

Copiez l'ID et vérifiez dans la console que le filter correspond :
```javascript
filter: `user_id=eq.VOTRE_USER_ID`
```

---

### ❌ "Subscription status: CHANNEL_ERROR"

**Causes possibles :**
1. Realtime pas activé → Voir Solution 1 ci-dessus
2. Plan Supabase gratuit limité → Vérifier les quotas
3. Connexion réseau → Vérifier votre connexion

**Solution :**
```bash
# Vérifier l'URL Supabase dans config
# Elle doit se terminer par .supabase.co
```

---

### ❌ Le compteur s'incrémente mais le graphique ne change pas

**Diagnostic :**
1. Ouvrez la console
2. Cherchez `🔄 [WorkoutDistribution] Realtime update`

**Si vous voyez le log :**
```javascript
🔄 [WorkoutDistribution] Realtime update: INSERT
```
→ Realtime fonctionne, problème de rendu React

**Solution :**
```typescript
// Le composant se rafraîchit normalement via useState
// Vérifier qu'il n'y a pas d'erreur dans getMonthlyStats()
```

**Si vous ne voyez PAS le log :**
→ Realtime ne reçoit pas les événements

**Solution :**
- Vérifier que le `user_id` dans le filter est correct
- Vérifier que la table s'appelle bien `session_counters`
- Vérifier les policies RLS

---

## 🎯 Test final

Pour confirmer que tout fonctionne :

1. ✅ Ouvrez **User → Performances**
2. ✅ Console affiche : `📡 Subscription status: SUBSCRIBED`
3. ✅ Cliquez sur **+1 séance** depuis Home
4. ✅ Console affiche : `🔄 Realtime update`
5. ✅ Le donut se met à jour automatiquement
6. ✅ Le nombre change sans recharger

**Si tous les ✅ sont verts → C'est parfait ! 🎉**

---

## 📊 Test de performance

Pour tester la rapidité :

1. Chronométrez le temps entre :
   - Clic sur "+1 séance"
   - Mise à jour du graphique

**Résultat attendu : < 500ms**

Si c'est plus long :
- Vérifier la connexion réseau
- Vérifier les index SQL
- Vérifier les queries dans getMonthlyStats()

---

## 🔧 Debug avancé

### Voir tous les événements Realtime

```javascript
// Dans la console navigateur
supabase
  .channel('debug-all')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    console.log('📡 ALL CHANGES:', payload)
  })
  .subscribe()
```

### Tester l'incrémentation manuellement

```typescript
// Dans la console navigateur
import { incrementSessionCounter } from './services/sessionCounterService'

// Incrémenter musculation
incrementSessionCounter('YOUR_USER_ID', 'musculation')
  .then(count => console.log('✅ New count:', count))
```

---

## ✅ Confirmation finale

Après tous ces tests, vous devriez avoir :

- ✅ Subscription active et confirmée dans la console
- ✅ Donut se met à jour en < 500ms après ajout de séance
- ✅ Synchronisation multi-onglets fonctionnelle
- ✅ Logs clairs dans la console
- ✅ Aucune erreur RLS ou Realtime

**Le système de rafraîchissement automatique est opérationnel ! 🚀**
