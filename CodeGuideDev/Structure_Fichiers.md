# Document de Structure des Fichiers

```
financeai/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   └── import/
│   │   │       └── page.tsx
│   │   ├── budgets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── insights/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── transactions/
│   │   │   ├── route.ts
│   │   │   └── import/
│   │   │       └── route.ts
│   │   ├── budgets/
│   │   │   └── route.ts
│   │   ├── insights/
│   │   │   └── route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/
│   │   │   │   └── route.ts
│   │   │   └── supabase/
│   │   │       └── route.ts
│   │   └── ai/
│   │       └── analyze/
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   └── [shadcn components]
│   ├── dashboard/
│   │   ├── overview-card.tsx
│   │   ├── recent-transactions.tsx
│   │   ├── spending-chart.tsx
│   │   └── budget-progress.tsx
│   ├── transactions/
│   │   ├── transaction-list.tsx
│   │   ├── transaction-filters.tsx
│   │   └── import-form.tsx
│   ├── budgets/
│   │   ├── budget-form.tsx
│   │   ├── budget-list.tsx
│   │   └── budget-detail.tsx
│   ├── insights/
│   │   ├── insight-card.tsx
│   │   └── recommendation-list.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── footer.tsx
│   └── shared/
│       ├── loading-state.tsx
│       ├── error-boundary.tsx
│       └── empty-state.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── ai/
│   │   ├── analyze-transactions.ts
│   │   └── generate-insights.ts
│   ├── auth/
│   │   └── auth-options.ts
│   ├── api/
│   │   ├── transactions.ts
│   │   ├── budgets.ts
│   │   └── insights.ts
│   ├── utils/
│   │   ├── date-utils.ts
│   │   ├── currency-utils.ts
│   │   └── validation.ts
│   └── config/
│       └── site.ts
├── emails/
│   ├── components/
│   │   ├── button.tsx
│   │   └── layout.tsx
│   ├── budget-alert.tsx
│   ├── weekly-summary.tsx
│   └── welcome.tsx
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   └── icons/
│   │       └── [category icons]
│   └── fonts/
│       └── inter/
├── types/
│   ├── transaction.ts
│   ├── budget.ts
│   ├── user.ts
│   └── insight.ts
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── drizzle.config.ts
```

## Description des répertoires principaux

### `/app`
Structure principale de l'application Next.js utilisant l'App Router. Contient les routes, les pages et les API routes.

- `(auth)` - Groupe de routes pour l'authentification
- `(dashboard)` - Groupe de routes pour les fonctionnalités principales de l'application
- `api` - Points d'entrée API de l'application

### `/components`
Composants React réutilisables organisés par fonctionnalité.

- `ui` - Composants UI de base (shadcn/ui)
- `dashboard`, `transactions`, `budgets`, etc. - Composants spécifiques aux fonctionnalités
- `shared` - Composants partagés à travers l'application

### `/lib`
Logique métier, utilitaires et configurations.

- `db` - Schéma de base de données et configurations Drizzle ORM
- `ai` - Fonctionnalités d'intelligence artificielle
- `api` - Clients API pour les différentes ressources
- `utils` - Fonctions utilitaires

### `/emails`
Templates d'emails pour les notifications et les alertes, utilisant Resend.

### `/public`
Ressources statiques accessibles publiquement.

### `/types`
Définitions TypeScript pour les entités principales de l'application. 