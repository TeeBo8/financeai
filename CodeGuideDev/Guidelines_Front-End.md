# Guidelines Front-End

## Principes de Design

- **Simplicité :** Interfaces épurées et intuitives
- **Cohérence :** Utilisation cohérente des composants et patterns
- **Réactivité :** Design responsive pour tous les appareils
- **Accessibilité :** Contraste adéquat, navigation au clavier, textes alternatifs


## Système de Design

- **Composants :** Utilisation de shadcn/ui pour les composants de base
- **Typographie :**
  - Titres: Inter, semi-bold
  - Corps: Inter, regular
  - Tailles: 14px (base), 16px (sous-titres), 20px-32px (titres)

- **Couleurs :**
  - Primaire: `#3B82F6` (bleu)
  - Secondaire: `#10B981` (vert)
  - Accent: `#8B5CF6` (violet)
  - Fond: `#FFFFFF` (clair), `#F3F4F6` (gris clair)
  - Texte: `#1F2937` (foncé), `#6B7280` (gris)


## Structure des Pages

- **Layout principal :** Barre latérale + zone de contenu principale
- **Navigation :** Barre latérale pour navigation principale, breadcrumbs pour navigation secondaire
- **Composants communs :**
  - Cartes pour afficher les données financières
  - Tableaux pour lister les transactions
  - Graphiques pour visualiser les tendances
  - Formulaires pour la saisie de données


## État et Gestion des Données

- Utilisation de React Query pour la gestion des données côté client
- État global minimal avec Context API
- Gestion des formulaires avec React Hook Form
- Validation avec Zod


## Feedback Utilisateur

- Toasts pour les notifications éphémères
- Modales pour les actions importantes
- Skeletons pour les états de chargement
- Messages d'erreur explicites 