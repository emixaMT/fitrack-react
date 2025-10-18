# 🚀 Installation du Nouveau Système de Compteurs

## 📝 Étapes d'installation (5 minutes)

### ✅ Étape 1 : Créer la table et les fonctions
**Temps estimé : 1 minute**

1. Ouvrez votre dashboard **Supabase** : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Cliquez sur **New Query**
5. Copiez le contenu du fichier : `migrations/create_session_counters_table.sql`
6. Collez-le dans l'éditeur
7. Cliquez sur **Run** ▶️
8. ✅ Vérifiez que "Success. No rows returned" apparaît

### ✅ Étape 2 : Activer Realtime (OBLIGATOIRE)
**Temps estimé : 1 minute**

1. Dans Supabase, allez dans **Database** → **Replication**
2. Cherchez la table `session_counters`
3. Activez la réplication en cochant la case
4. Attendez 5-10 secondes que la configuration se propage

**Vérification :**
Dans SQL Editor, exécutez :
```sql
SELECT * FROM pg_publication_tables WHERE tablename = 'session_counters';
```
✅ Doit retourner 1 ligne → Realtime est activé
❌ Retourne vide → Réessayez l'étape ci-dessus

**Alternative (si l'interface ne marche pas) :**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE session_counters;
```

5. ✅ Le graphique se mettra maintenant à jour en temps réel automatiquement

### ✅ Étape 3 : Migrer les données existantes (OPTIONNEL)
**Temps estimé : 1 minute**

**⚠️ Uniquement si vous avez déjà des séances enregistrées**

1. Dans **SQL Editor**, créez une nouvelle query
2. Copiez le contenu de : `migrations/migrate_existing_seances.sql`
3. Lisez les commentaires pour comprendre ce que fait le script
4. Exécutez le script
5. ✅ Vérifiez le résumé des compteurs créés

### ✅ Étape 4 : Tester le rafraîchissement automatique
**Temps estimé : 2 minutes**

**Test basique :**
1. Ouvrez votre application
2. Allez dans **User** → Onglet **Performances**
3. Ouvrez la console (F12) et regardez les logs
4. ✅ Vous devriez voir : `📡 [WorkoutDistribution] Subscription status: SUBSCRIBED`

**Test du refresh automatique :**
1. Gardez **User → Performances** ouvert
2. Ouvrez un autre onglet avec **Home**
3. Cliquez sur **+1 séance** et choisissez un type
4. Retournez sur **User → Performances**
5. ✅ **Le donut se met à jour automatiquement** (sans recharger)
6. ✅ Dans la console : `🔄 [WorkoutDistribution] Realtime update`

**Test interactif :**
1. Cliquez sur une ligne de la légende
2. ✅ Le pourcentage s'affiche

**Si le donut ne se rafraîchit pas automatiquement** → Voir `TEST_REALTIME.md`

### ✅ Étape 5 : Vérification complète du système
**Temps estimé : 1 minute**

**Exécuter le script de diagnostic :**
1. Dans SQL Editor, ouvrez : `migrations/verify_realtime_setup.sql`
2. Copiez et exécutez tout le script
3. Regardez les résultats

**Résultats attendus :**
```
check_type          | status
--------------------|---------
Table exists        | ✅ OK
Realtime enabled    | ✅ OK
RLS Policies        | ✅ OK
Function exists     | ✅ OK
Indexes created     | ✅ OK
```

✅ **Si tous sont OK** → Le système est prêt !
❌ **Si un est FAILED** → Suivez les instructions dans le script

**Vérifier vos données :**
```sql
-- Vérifier vos compteurs
SELECT * FROM session_counters 
WHERE user_id = auth.uid()
ORDER BY month_key DESC, sport_type;
```

✅ Vous devriez voir vos compteurs (peut être vide si première utilisation)

---

## 🎯 Résultat attendu

Après installation, vous aurez :

### ✅ Dans l'application
- **Page Home** : Bouton "+1 séance" qui ouvre une modal
- **Modal** : Choix entre Musculation / CrossFit / Course / Vélo
- **Graphique donut** : Dans User → Performances, affiche la répartition
- **Temps réel** : Le graphique se met à jour instantanément

### ✅ Dans Supabase
- **Table `session_counters`** créée avec les compteurs
- **Fonction SQL** `increment_session_counter()` disponible
- **Policies RLS** actives pour la sécurité
- **Realtime** activé pour les mises à jour automatiques

---

## 🐛 Dépannage

### ❌ Erreur "function increment_session_counter does not exist"
**Solution :** Exécutez à nouveau `create_session_counters_table.sql`

### ❌ Le graphique ne s'affiche pas
**Solution :** 
1. Vérifiez que vous avez au moins 1 séance enregistrée
2. Dans SQL Editor : `SELECT * FROM session_counters WHERE user_id = auth.uid()`
3. Si vide, cliquez sur "+1 séance" pour créer un compteur

### ❌ Le graphique ne se met pas à jour en temps réel
**Solution :**
1. Vérifiez que Realtime est activé (Étape 2)
2. Rechargez l'application
3. Ouvrez la console et cherchez : "🔄 [WorkoutDistribution] Realtime update"

### ❌ "Row level security policy violated"
**Solution :**
1. Vérifiez que les policies ont été créées
2. Dans SQL Editor :
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'session_counters';
```
3. Si vide, exécutez à nouveau le script de création

### ❌ Mes anciennes séances ne sont pas comptées
**Solution :**
- C'est normal ! Les compteurs sont vides par défaut
- Exécutez le script de migration (Étape 3) pour importer l'historique
- Ou recommencez à tracker avec le nouveau système

---

## 📊 Vérification complète

Pour vérifier que tout fonctionne, exécutez dans SQL Editor :

```sql
-- 1. Vérifier la table
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'session_counters';
-- Doit retourner : 1

-- 2. Vérifier la fonction
SELECT COUNT(*) as function_exists 
FROM pg_proc 
WHERE proname = 'increment_session_counter';
-- Doit retourner : 1

-- 3. Vérifier les policies
SELECT COUNT(*) as policies_count 
FROM pg_policies 
WHERE tablename = 'session_counters';
-- Doit retourner : 4 (SELECT, INSERT, UPDATE, DELETE)

-- 4. Vérifier vos données
SELECT 
  month_key,
  sport_type,
  count
FROM session_counters
WHERE user_id = auth.uid()
ORDER BY month_key DESC, sport_type;
-- Doit afficher vos compteurs (peut être vide si première utilisation)
```

---

## 📚 Documentation

- **Guide utilisateur** : `NOUVEAU_SYSTEME_SEANCES.md`
- **Guide technique** : `MIGRATION_GUIDE.md`
- **Script SQL principal** : `migrations/create_session_counters_table.sql`
- **Script migration données** : `migrations/migrate_existing_seances.sql`
- **Service TypeScript** : `services/sessionCounterService.ts`

---

## 🎉 C'est prêt !

Vous pouvez maintenant utiliser le système de compteurs de séances.

**Prochaines étapes :**
1. Testez en ajoutant plusieurs séances
2. Explorez le graphique donut dans User → Performances
3. Consultez `NOUVEAU_SYSTEME_SEANCES.md` pour plus de détails

**Bon tracking ! 💪🏃🚴**
