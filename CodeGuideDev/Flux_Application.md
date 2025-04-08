# Document de Flux d'Application

## Flux d'Inscription et Connexion

1. L'utilisateur accède à la page d'accueil
2. Clique sur "S'inscrire" ou "Se connecter"
3. Remplit le formulaire ou utilise OAuth
4. Est redirigé vers le tableau de bord après authentification


## Flux d'Importation de Transactions

1. L'utilisateur accède à la section "Transactions"
2. Clique sur "Importer des transactions"
3. Choisit la méthode d'import (manuel, API bancaire)
4. Confirme l'import
5. Le système catégorise automatiquement les transactions
6. L'utilisateur peut ajuster les catégories si nécessaire


## Flux d'Analyse IA

1. Le système analyse les transactions en arrière-plan
2. Génère des insights via l'AI SDK
3. Affiche les tendances et recommandations sur le tableau de bord
4. L'utilisateur peut interagir avec les recommandations


## Flux de Création de Budget

1. L'utilisateur accède à la section "Budgets"
2. Clique sur "Créer un budget"
3. Sélectionne une catégorie et définit un montant
4. Confirme la création
5. Le système commence à suivre les dépenses par rapport au budget


## Flux d'Abonnement Premium

1. L'utilisateur clique sur une fonctionnalité premium
2. Est informé qu'il s'agit d'une fonctionnalité premium
3. Clique sur "Passer à Premium"
4. Sélectionne un plan d'abonnement
5. Complète le paiement via Stripe
6. Est redirigé vers la fonctionnalité débloquée


## Flux de Notifications

1. Le système détecte un événement important (dépassement de budget, objectif atteint)
2. Génère une notification dans l'application
3. Envoie un email via Resend si l'utilisateur a activé cette option
4. L'utilisateur peut cliquer sur la notification pour accéder à la section concernée 