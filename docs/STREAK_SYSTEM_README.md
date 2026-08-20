# 🔥 Système de Streak

## 📊 Fonctionnement

Le système de streak est basé sur l'**incrémentation de `monthly_sessions`** et non plus sur la création de séances.

### Avantages
- ✅ **Anti-spam** : Une seule incrémentation par jour maximum
- ✅ **Fiable** : Basé sur l'action consciente de l'utilisateur (cliquer sur +1)
- ✅ **Historique** : Conservation de toutes les dates d'incrémentation
- ✅ **Performance** : Table dédiée et indexée

---

## 🗄️ Structure de la Base de Données

### Table `streak_history`

```sql
CREATE TABLE streak_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date) -- Un seul enregistrement par jour
);
```

### Index
```sql
CREATE INDEX idx_streak_history_user_date ON streak_history(user_id, date DESC);
```

---

## 🚀 Installation

### 1. Créer la Table dans Supabase

**Option A : Via SQL Editor (Recommandé)**
1. Ouvrir le **SQL Editor** dans Supabase Dashboard
2. Coller le contenu de `create_streak_history_table.sql`
3. Exécuter le script

**Option B : Via CLI Supabase**
```bash
supabase db push
```

### 2. Vérifier la Création
```sql
-- Dans SQL Editor
SELECT * FROM streak_history LIMIT 1;
```

---

## 🔄 Flux de Fonctionnement

### 1. Incrémentation du Compteur
```
Utilisateur clique sur +1
    ↓
monthly_sessions++
    ↓
Enregistre la date du jour dans streak_history
    ↓
Hook useStreak se met à jour en temps réel
```

### 2. Calcul de la Streak
```
1. Récupérer toutes les dates de streak_history
2. Trier par ordre décroissant
3. Commencer depuis aujourd'hui
4. Vérifier la continuité jour par jour
5. S'arrêter au premier "trou"
```

### Exemple
```
Dates dans streak_history :
- 2025-10-16 (aujourd'hui) ✅
- 2025-10-15 ✅
- 2025-10-14 ✅
- 2025-10-12 ❌ (trou le 13)

→ Streak = 3 jours
```

---

## 🎯 Garanties du Système

### Protection Anti-Spam
```sql
UNIQUE(user_id, date)
```
→ **Impossible** d'enregistrer plusieurs fois la même date

### Sécurité (RLS)
```sql
auth.uid() = user_id
```
→ Chaque utilisateur voit **uniquement** son historique

### Atomicité
```typescript
upsert({ user_id, date }, { 
  onConflict: 'user_id,date',
  ignoreDuplicates: true 
})
```
→ Si la date existe déjà, **aucune action** (silent fail)

---

## 📝 Code Clé

### Enregistrement de la Date
```typescript
// Dans home.tsx - handleAddSession()
const today = new Date().toISOString().split('T')[0];
await supabase
  .from('streak_history')
  .upsert(
    { user_id: session.user.id, date: today },
    { onConflict: 'user_id,date', ignoreDuplicates: true }
  );
```

### Calcul de la Streak
```typescript
// Dans useStreak.ts
const { data: streakHistory } = await supabase
  .from('streak_history')
  .select('date')
  .eq('user_id', userId)
  .order('date', { ascending: false });
```

### Temps Réel
```typescript
supabase
  .channel(`streak-${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'streak_history',
    filter: `user_id=eq.${userId}`,
  }, () => {
    calculateStreak(); // Recalcule automatiquement
  })
```

---

## 🐛 Dépannage

### Erreur "relation streak_history does not exist"
→ La table n'a pas été créée. Exécuter le script SQL.

### Streak = 0 alors que j'ai incrémenté
→ Vérifier dans SQL Editor :
```sql
SELECT * FROM streak_history 
WHERE user_id = 'your-user-id' 
ORDER BY date DESC;
```

### Streak ne se met pas à jour
→ Vérifier les RLS policies :
```sql
SELECT * FROM pg_policies WHERE tablename = 'streak_history';
```

---

## 🎨 Composant StreakFlame

Le composant affiche la flamme avec la streak calculée :
```tsx
<StreakFlame streakDays={streakDays} size="medium" />
```

### États
- **0 jour** : Flamme grise éteinte
- **1+ jours** : Flamme animée
- **Couleurs** : Évoluent selon la streak (orange → or)

---

## ✅ Checklist de Migration

- [ ] Exécuter `create_streak_history_table.sql` dans Supabase
- [ ] Vérifier que la table existe (`SELECT * FROM streak_history`)
- [ ] Tester l'incrémentation (+1 sur la home)
- [ ] Vérifier qu'une date est ajoutée dans streak_history
- [ ] Vérifier que la flamme affiche "1 jour"
- [ ] Tester le lendemain pour vérifier la continuité
- [ ] Tester de ne pas incrémenter un jour pour vérifier le reset

---

## 📚 Ressources

- **Hook** : `hooks/useStreak.ts`
- **Composant** : `components/StreakFlame.tsx`
- **Logique** : `src/app/(tabs)/home.tsx` (fonction `handleAddSession`)
- **SQL** : `docs/create_streak_history_table.sql`
