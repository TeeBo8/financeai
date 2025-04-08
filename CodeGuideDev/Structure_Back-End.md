# Structure Back-End

## Architecture

- Architecture basée sur les API Routes de Next.js
- Séparation claire entre la logique métier et l'accès aux données
- Utilisation de middlewares pour l'authentification et la validation


## Couches d'Application

1. **API Routes :** Points d'entrée HTTP
2. **Services :** Logique métier
3. **Repositories :** Accès aux données via Drizzle ORM
4. **Utilitaires :** Fonctions d'aide et intégrations


## Modèle de Données

```plaintext
- Users
  - id (PK)
  - email
  - name
  - passwordHash
  - createdAt
  - subscription_tier

- Transactions
  - id (PK)
  - userId (FK)
  - amount
  - description
  - category_id (FK)
  - date
  - is_recurring

- Categories
  - id (PK)
  - name
  - icon
  - color
  - parent_id (FK, self-referential)

- Budgets
  - id (PK)
  - userId (FK)
  - category_id (FK)
  - amount
  - period (monthly, weekly)
  - start_date

- Subscriptions
  - id (PK)
  - userId (FK)
  - plan_id
  - status
  - start_date
  - end_date
  - payment_method
```

## Sécurité

- Authentification via Auth.js
- Validation des entrées avec Zod
- Rate limiting pour prévenir les abus
- Sanitization des données pour prévenir les injections


## Intégrations

- Supabase pour la base de données
- AI SDK pour l'analyse des données
- Stripe pour les paiements
- Resend pour les emails 