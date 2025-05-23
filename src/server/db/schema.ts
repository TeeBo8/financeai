import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
// Commenté pour éviter l'erreur dans les tests de Vitest
// import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const pgTable = pgTableCreator((name) => `finance-ai_${name}`);

// --- ENUMS (si nécessaire plus tard) ---
// export const accountTypeEnum = pgEnum('account_type', ['checking', 'savings', 'credit_card', 'cash', 'investment', 'loan', 'other']);

// --- TABLES ---

export const users = pgTable("user", {
  // Garder text pour l'ID utilisateur pour compatibilité avec Auth.js
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()), // Ou conserver la méthode de génération d'ID par défaut d'Auth.js si différente
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(), // S'assurer que l'email est unique
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 255 }),
  
  // <<< AJOUT TEMPORAIRE pour correspondre à la base >>>
  subscriptionTier: varchar("subscriptionTier", { length: 50 }).default('free').notNull(),
  
  // <<< COLONNES À AJOUTER DANS LA BASE >>>
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId") // Doit correspondre au type de users.id
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 })
      // Remplacé la référence de type AdapterAccount par une chaîne littérale
      .$type<string>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    userIdIdx: index("account_userId_idx").on(account.userId),
  })
);

export const sessions = pgTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 }).primaryKey(),
    userId: text("userId") // Doit correspondre au type de users.id
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  })
);

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(), // Token doit être unique
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }), // Clé primaire composite standard
  })
);


// --- FinanceAI Specific Tables ---

export const categories = pgTable("category", {
  // Utilisation d'ID text avec préfixe pour la clarté
  id: text("id").primaryKey().$defaultFn(() => `cat_${crypto.randomUUID()}`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  icon: varchar("icon", { length: 50 }).default('💡').notNull(),
  color: varchar("color", { length: 7 }).default('#ffffff').notNull(), // Format HEX #RRGGBB
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index("category_userId_idx").on(table.userId),
}));

// =======================================
// <<< NOUVELLE TABLE : bankAccounts >>>
// =======================================
export const bankAccounts = pgTable("bank_account", {
  id: text("id").primaryKey().$defaultFn(() => `acc_${crypto.randomUUID()}`), // ID text préfixé
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Lié à l'utilisateur
  name: varchar("name", { length: 256 }).notNull(), // Nom du compte (ex: Compte Courant LCL)
  // On pourrait ajouter : type (courant, épargne...), devise, solde initial/actuel plus tard
  icon: text("icon"), // Emoji ou nom d'icône (optionnel)
  color: varchar("color", { length: 7 }), // Code hexadécimal #RRGGBB (optionnel)
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index("bank_account_userId_idx").on(table.userId),
}));


export const transactions = pgTable("transaction", {
  id: text("id").primaryKey().$defaultFn(() => `tx_${crypto.randomUUID()}`), // ID text préfixé
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 256 }).notNull(),
  // Utiliser decimal pour les montants monétaires pour éviter les pbs de floating point
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  categoryId: text("categoryId")
    .references(() => categories.id, { onDelete: "set null" }), // Permet catégorie nulle, et la supprime si catégorie parente supprimée

  // =============================================
  // <<< COLONNE AJOUTÉE : bankAccountId >>>
  // =============================================
  bankAccountId: text("bankAccountId")
    .notNull() // Une transaction DOIT appartenir à un compte
    .references(() => bankAccounts.id, { onDelete: "cascade" }), // Si le compte est supprimé, supprimer les transactions associées
                                                                // Alternative: 'restrict' pour empêcher la suppression du compte s'il a des transactions. Cascade est plus simple ici.
  
  // <<< NOUVELLE COLONNE POUR LIER LES TRANSFERTS >>>
  transferId: text("transfer_id"), // Optionnel: pour lier deux transactions d'un transfert
}, (table) => ({
  userIdx: index("transaction_userId_idx").on(table.userId),
  categoryIdx: index("transaction_categoryId_idx").on(table.categoryId),
  bankAccountIdx: index("transaction_bankAccountId_idx").on(table.bankAccountId), // <<< INDEX AJOUTÉ >>>
  dateIdx: index("transaction_date_idx").on(table.date), // Index sur la date, souvent utilisé pour filtrer/trier
  // <<< NOUVEL INDEX SUR transferId >>>
  transferIdx: index("transaction_transferId_idx").on(table.transferId), // Index pour retrouver les paires
}));


export const budgets = pgTable("budget", {
  id: text("id").primaryKey().$defaultFn(() => `bud_${crypto.randomUUID()}`), // ID text préfixé
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  // Suppression de categoryId car on utilisera maintenant budgetsToCategories
  // Utiliser decimal pour les montants monétaires
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  period: varchar("period", { length: 50 }).notNull().default('MONTHLY'), // 'MONTHLY', 'YEARLY', 'CUSTOM'
  // Rendre startDate et endDate optionnels pour les périodes standard
  startDate: timestamp("start_date", { mode: "date" }), // Optionnel - pour période custom
  endDate: timestamp("end_date", { mode: "date" }), // Optionnel - pour période custom
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index("budget_userId_idx").on(table.userId),
}));

// Table de jointure Budget <-> Catégorie
export const budgetsToCategories = pgTable("budgets_to_categories", {
  budgetId: text("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (t) => ({
  // Clé primaire composite
  pk: primaryKey({ columns: [t.budgetId, t.categoryId] }),
}));

// --- Nouvelle Table: Recurring Transactions ---
export const recurringTransactions = pgTable("recurring_transaction", {
  id: text("id").primaryKey().$defaultFn(() => `rec_${crypto.randomUUID()}`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 256 }).notNull(),
  notes: text("notes"), // Notes optionnelles
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Montant (peut être positif ou négatif)
  frequency: varchar("frequency", { length: 50 }).notNull(), // Ex: 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
  interval: integer("interval").notNull().default(1), // Ex: 1 = tous les mois, 2 = tous les 2 mois
  startDate: timestamp("start_date", { mode: "date" }).notNull(), // Date de début
  endDate: timestamp("end_date", { mode: "date" }), // Date de fin (optionnelle)
  nextOccurrenceDate: timestamp("next_occurrence_date", { mode: "date" }).notNull(), // Prochaine date d'exécution
  bankAccountId: text("bankAccountId")
    .notNull()
    .references(() => bankAccounts.id, { onDelete: 'restrict' }), // Compte associé (RESTRICT pour éviter suppression compte si utilisé)
  categoryId: text("categoryId")
    .references(() => categories.id, { onDelete: 'set null' }), // Catégorie (optionnelle, SET NULL si catégorie supprimée)
  isSubscription: boolean("is_subscription").notNull().default(false), // Nouveau champ
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index("recurring_transaction_userId_idx").on(table.userId),
  bankAccountIdx: index("recurring_transaction_bankAccountId_idx").on(table.bankAccountId),
  nextOccurrenceDateIdx: index("recurring_transaction_nextOccurrenceDate_idx").on(table.nextOccurrenceDate),
}));

// --- Nouvelle Table: Savings Goals ---
export const savingsGoals = pgTable("savings_goal", {
  id: text("id").primaryKey().$defaultFn(() => `goal_${crypto.randomUUID()}`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  targetDate: timestamp("target_date", { mode: "date" }), // Nullable
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).notNull().default('0.00'),
  icon: varchar("icon", { length: 50 }).default('🎯'), // Nullable avec default
  color: varchar("color", { length: 7 }).default('#A855F7'), // Nullable avec default (format HEX)
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index("savings_goal_userId_idx").on(table.userId),
}));

// --- Relations pour Savings Goals ---
export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  user: one(users, {
    fields: [savingsGoals.userId],
    references: [users.id],
  }),
}));

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts), // Auth.js accounts
  sessions: many(sessions), // Auth.js sessions
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  bankAccounts: many(bankAccounts),
  recurringTransactions: many(recurringTransactions), // Nouvelle relation
  savingsGoals: many(savingsGoals), // Nouvelle relation
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
  budgets: many(budgets),
  budgetsToCategories: many(budgetsToCategories),
  recurringTransactions: many(recurringTransactions), // Nouvelle relation
  savingsGoals: many(savingsGoals), // Nouvelle relation
}))

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  user: one(users, { fields: [bankAccounts.userId], references: [users.id] }),
  transactions: many(transactions),
  recurringTransactions: many(recurringTransactions), // Nouvelle relation
  savingsGoals: many(savingsGoals), // Nouvelle relation
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  bankAccount: one(bankAccounts, { // <<< RELATION AJOUTÉE >>> Transaction -> BankAccount
    fields: [transactions.bankAccountId],
    references: [bankAccounts.id],
  }),
}))

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  user: one(users, { fields: [budgets.userId], references: [users.id] }),
  budgetsToCategories: many(budgetsToCategories),
  savingsGoals: many(savingsGoals),
}))

export const budgetsToCategoriesRelations = relations(budgetsToCategories, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetsToCategories.budgetId],
    references: [budgets.id],
  }),
  category: one(categories, {
    fields: [budgetsToCategories.categoryId],
    references: [categories.id],
  }),
}))

// Relations Auth.js (souvent gérées par l'adapter, mais bon à avoir pour la clarté)
export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

// Nouvelle relation pour les transactions récurrentes
export const recurringTransactionsRelations = relations(recurringTransactions, ({ one }) => ({
  user: one(users, { fields: [recurringTransactions.userId], references: [users.id] }),
  bankAccount: one(bankAccounts, { fields: [recurringTransactions.bankAccountId], references: [bankAccounts.id] }),
  category: one(categories, { fields: [recurringTransactions.categoryId], references: [categories.id] }),
}))
