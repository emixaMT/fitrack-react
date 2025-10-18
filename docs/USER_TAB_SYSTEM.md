# Système d'onglets pour la page User

## 🎯 Vue d'ensemble

La page User a été réorganisée en deux volets distincts avec un système d'onglets pour améliorer l'expérience utilisateur et éviter la surcharge d'informations.

## 📑 Structure des volets

### **1. Volet Performances** (Par défaut)
Ce volet affiche :
- ✅ **Mon évolution** : Graphique de l'évolution du poids
- ✅ **Mes performances** :
  - SBD (Squat, Bench, Deadlift) avec total
  - Performances de running (si présentes)
  - Performances Hyrox (Solo/Double, si présentes)

**Icône** : `barbell` (haltère)

### **2. Volet Succès**
Ce volet affiche :
- ✅ **Barre de niveau** : XP actuel et progression
- ✅ **Badges** : Collection de badges avec statistiques
  - Badges débloqués/total
  - Points accumulés
  - Affichage des 3 premiers (extensible)
- ✅ **Calendrier des défis** : Historique des défis complétés

**Icône** : `trophy` (trophée)

## 🎨 Design des onglets

### Onglet actif
- Fond : Indigo (#4f46e5)
- Texte : Blanc (#ffffff)
- Icône : Blanc

### Onglet inactif
- Fond : Carte (colors.card)
- Texte : Gris secondaire (colors.textSecondary)
- Icône : Gris secondaire

### Style
- Bordure arrondie : 12px
- Padding vertical : 12px
- Padding horizontal : 16px
- Gap entre icône et texte : 8px
- Disposition : Flexbox row

## 💻 Implémentation technique

### État de gestion
```typescript
const [activeTab, setActiveTab] = useState<'performances' | 'success'>('performances');
```

### Structure du code
```tsx
{/* Système d'onglets */}
<View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
  <Pressable onPress={() => setActiveTab('performances')} {...}>
    Performances
  </Pressable>
  <Pressable onPress={() => setActiveTab('success')} {...}>
    Succès
  </Pressable>
</View>

{/* Volet Succès */}
{activeTab === 'success' && (
  <View>
    {/* Contenu succès */}
  </View>
)}

{/* Volet Performances */}
{activeTab === 'performances' && (
  <View>
    {/* Contenu performances */}
  </View>
)}
```

## 🚀 Avantages

### Pour l'utilisateur
- ✅ **Interface moins chargée** : Un seul volet affiché à la fois
- ✅ **Navigation claire** : Icônes et labels explicites
- ✅ **Priorité aux performances** : Volet principal par défaut
- ✅ **Accès rapide** : Un tap pour changer de volet

### Pour le développement
- ✅ **Code organisé** : Séparation logique des sections
- ✅ **Maintenable** : Facile d'ajouter d'autres volets
- ✅ **Performant** : Seul le volet actif est rendu
- ✅ **Responsive** : S'adapte au thème (dark/light)

## 📊 Organisation du contenu

### Volet Performances
```
┌─────────────────────────┐
│   Mon évolution         │
│   [Graphique poids]     │
│                         │
│   Mes performances      │
│   [SBD]                 │
│   [Running]             │
│   [Hyrox]               │
└─────────────────────────┘
```

### Volet Succès
```
┌─────────────────────────┐
│   [Barre de niveau]     │
│                         │
│   Mes succès            │
│   [Badges]              │
│   [Statistiques]        │
│                         │
│   [Calendrier défis]    │
└─────────────────────────┘
```

## 🔄 Éléments toujours visibles

Certains éléments restent visibles quel que soit l'onglet actif :

1. **Header** : Avatar, gradient, bouton paramètres
2. **Streak Badge** : Flamme de série (gauche)
3. **Bouton déconnexion** : Toujours en bas de page

## 🎯 Logique de priorisation

Le volet "Performances" est défini comme principal car :
- 📈 Suivi du poids (objectif fréquent)
- 💪 Performances sportives (motivation)
- 📊 Données évolutives (mises à jour régulières)

Le volet "Succès" est complémentaire :
- 🏆 Gamification (récompenses)
- 📅 Historique (consultation ponctuelle)
- ⭐ Progression (long terme)

## 🔮 Évolutions possibles

1. **Animation de transition** : Animer le changement d'onglet
2. **Badge de notification** : Indiquer les nouveaux badges dans l'onglet
3. **Sauvegarde de préférence** : Mémoriser l'onglet préféré de l'utilisateur
4. **Troisième onglet** : Ajouter "Statistiques" ou "Social"
5. **Swipe gesture** : Permettre le swipe pour changer d'onglet

## 🎨 Thème

Le système d'onglets s'adapte automatiquement au thème :
- Utilise `colors.card` pour le fond des onglets inactifs
- Utilise `colors.textSecondary` pour le texte inactif
- Utilise `colors.background` pour le fond général
- Conserve l'indigo (#4f46e5) pour l'onglet actif (cohérence de marque)

## 📱 Responsive

Les onglets utilisent `flex: 1` pour occuper chacun 50% de la largeur, garantissant une disposition équilibrée sur tous les écrans.

---

**Système d'onglets implémenté avec succès ! 🎉**
