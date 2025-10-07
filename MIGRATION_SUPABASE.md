# Guide de Migration Firebase → Supabase

## ✅ Travail Effectué

Votre projet a été migré de Firebase vers Supabase. Voici ce qui a été fait :

### 1. **Configuration**
- ✅ Installation de `@supabase/supabase-js`
- ✅ Création de `config/supabaseConfig.ts` (remplace `firebaseConfig.ts`)
- ✅ Configuration du storage adapté (AsyncStorage pour mobile, localStorage pour web)

### 2. **Services Migrés**
- ✅ `services/supabaseAuth.ts` - Authentification (login, register, logout)
- ✅ `services/userService.ts` - Gestion des profils utilisateurs

### 3. **Composants et Écrans Migrés**
- ✅ Écrans d'authentification (`(auth)/index.tsx`, `(auth)/register.tsx`)
- ✅ Écran home avec gestion des sessions mensuelles
- ✅ Écrans workout et notes avec temps réel
- ✅ Écran utilisateur (user.tsx)
- ✅ Hooks (`useWeightHistory`, `useHeaderAvatar`)
- ✅ Composants (`manualSlider`, etc.)

### 4. **Fonctionnalités Maintenues**
- ✅ Authentification email/password
- ✅ Temps réel (Realtime subscriptions Supabase)
- ✅ Gestion des sessions utilisateurs
- ✅ Création de séances (musculation, crossfit, running, vélo)
- ✅ Gestion des notes
- ✅ Suivi des performances
- ✅ Historique de poids

---

## 🔧 Configuration Requise

### 1. **Créer un Projet Supabase**
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **URL du projet** et votre **Anon Key**

### 2. **Variables d'Environnement**
Créez ou mettez à jour votre fichier `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

---

## 📊 Structure de la Base de Données Supabase

Créez les tables suivantes dans votre projet Supabase (SQL Editor) :

### Table: `users`
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  photo_url TEXT,
  avatar_id TEXT,
  active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  monthly_sessions INTEGER DEFAULT 0,
  monthly_target INTEGER DEFAULT 10,
  month_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Table: `seances`
```sql
CREATE TABLE public.seances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  category TEXT,
  id_user UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercices JSONB DEFAULT '[]'::jsonb,
  objectifs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes par utilisateur
CREATE INDEX idx_seances_user ON public.seances(id_user);

-- Enable RLS
ALTER TABLE public.seances ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own seances" ON public.seances
  FOR SELECT USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own seances" ON public.seances
  FOR INSERT WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own seances" ON public.seances
  FOR UPDATE USING (auth.uid() = id_user);

CREATE POLICY "Users can delete own seances" ON public.seances
  FOR DELETE USING (auth.uid() = id_user);
```

### Table: `notes`
```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  id_user UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes par utilisateur
CREATE INDEX idx_notes_user ON public.notes(id_user);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = id_user);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = id_user);
```

### Table: `performances`
```sql
CREATE TABLE public.performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  squat INTEGER,
  bench INTEGER,
  deadlift INTEGER,
  running JSONB DEFAULT '[]'::jsonb,
  hyrox JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own performances" ON public.performances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performances" ON public.performances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performances" ON public.performances
  FOR UPDATE USING (auth.uid() = user_id);
```

### Table: `weight_entries`
```sql
CREATE TABLE public.weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes par utilisateur
CREATE INDEX idx_weight_entries_user ON public.weight_entries(user_id);
CREATE INDEX idx_weight_entries_date ON public.weight_entries(date);

-- Enable RLS
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own weights" ON public.weight_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weights" ON public.weight_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weights" ON public.weight_entries
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 🔄 Activer le Temps Réel (Realtime)

Dans Supabase Dashboard → Database → Replication :
1. Activez la réplication pour les tables suivantes :
   - `users`
   - `seances`
   - `notes`
   - `weight_entries`

---

## 🧹 Nettoyage Firebase (Optionnel)

Une fois que vous avez vérifié que tout fonctionne, vous pouvez supprimer les dépendances Firebase :

```bash
npm uninstall firebase
```

Supprimez aussi les fichiers Firebase inutilisés :
- `.firebaserc`
- `firebase.json`
- `storage.rules`
- `GoogleService-Info.plist`
- `google-services.json`

---

## 📝 Migration des Données (Si nécessaire)

Si vous avez des données existantes dans Firebase, vous devrez les exporter et les importer dans Supabase :

1. **Export depuis Firebase** : Utilisez l'outil Firebase Admin SDK
2. **Import vers Supabase** : Utilisez l'API Supabase ou le SQL Editor

---

## 🧪 Tests

Avant de déployer en production :

1. ✅ Testez la connexion / inscription
2. ✅ Testez la création de séances
3. ✅ Testez les notes
4. ✅ Vérifiez le temps réel (ouvrez l'app sur 2 appareils)
5. ✅ Testez les performances
6. ✅ Testez l'historique de poids

---

## ⚠️ Points d'Attention

### Différences Firebase → Supabase

1. **IDs**: 
   - Firebase : chaînes auto-générées
   - Supabase : UUID (compatibilité maintenue avec `user.id`)

2. **Timestamps**:
   - Firebase : `serverTimestamp()`
   - Supabase : `new Date().toISOString()` ou `NOW()` en SQL

3. **Queries**:
   - Firebase : `collection()`, `query()`, `where()`
   - Supabase : `.from('table').select().eq()`

4. **Real-time**:
   - Firebase : `onSnapshot()`
   - Supabase : `.channel().on('postgres_changes')`

---

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase Dashboard
2. Vérifiez les policies RLS
3. Consultez la documentation Supabase
4. Vérifiez que les variables d'environnement sont correctes

---

**Migration complétée le** : 2025-10-06
**Version Supabase** : @supabase/supabase-js (latest)
