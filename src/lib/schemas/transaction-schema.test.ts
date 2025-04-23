import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recréer le schéma de validation comme il est défini dans transaction-form.tsx
// puisqu'il n'est pas exporté dans un fichier séparé
const formSchema = z.object({
  // Type de transaction: revenu ou dépense
  transactionType: z.enum(["income", "expense"], {
    required_error: "Veuillez sélectionner le type de transaction",
  }),
  // Le montant est toujours positif dans le formulaire
  amount: z.coerce.number({
    invalid_type_error: "Le montant doit être un nombre valide"
  }).positive("Le montant doit être positif"),
  description: z.string().min(1, "La description est requise"),
  date: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  categoryId: z.string().optional(),
  bankAccountId: z.string().min(1, "Veuillez sélectionner un compte bancaire"),
});

describe('formSchema (Transaction Form Schema)', () => {
  // Test 1: Données valides complètes
  it('should validate successfully with valid full data', () => {
    const validData = {
      transactionType: "expense",
      amount: 100,
      description: "Courses alimentaires",
      date: new Date(),
      categoryId: "some-category-id",
      bankAccountId: "some-bank-account-id"
    };
    
    const result = formSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  // Test 2: Données valides avec categoryId optionnel
  it('should validate successfully without categoryId', () => {
    const validData = {
      transactionType: "income",
      amount: 500,
      description: "Salaire",
      date: new Date(),
      // categoryId est omis (optionnel)
      bankAccountId: "some-bank-account-id"
    };
    
    const result = formSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.transactionType).toBe("income");
      expect(result.data.amount).toBe(500);
      expect(result.data.description).toBe("Salaire");
      expect(result.data.categoryId).toBeUndefined();
      expect(result.data.bankAccountId).toBe("some-bank-account-id");
    }
  });

  // Test 3: Données invalides - Description vide
  it('should fail validation if description is empty', () => {
    const invalidData = {
      transactionType: "expense",
      amount: 50,
      description: "", // Description vide
      date: new Date(),
      bankAccountId: "some-bank-account-id"
    };
    
    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("La description est requise");
    }
  });

  // Test 4: Données invalides - Montant non numérique
  it('should fail validation if amount is not a number', () => {
    const invalidData = {
      transactionType: "expense",
      amount: "not-a-number" as unknown as number, // Montant invalide
      description: "Test",
      date: new Date(),
      bankAccountId: "some-bank-account-id"
    };
    
    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le montant doit être un nombre valide");
    }
  });

  // Test 5: Données invalides - Montant négatif
  it('should fail validation if amount is negative', () => {
    const invalidData = {
      transactionType: "expense",
      amount: -50, // Montant négatif
      description: "Test",
      date: new Date(),
      bankAccountId: "some-bank-account-id"
    };
    
    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le montant doit être positif");
    }
  });

  // Test 6: Données invalides - Date invalide
  it('should fail validation if date is invalid', () => {
    const invalidData = {
      transactionType: "expense",
      amount: 50,
      description: "Test",
      date: "not-a-date" as unknown as Date, // Date invalide
      bankAccountId: "some-bank-account-id"
    };
    
    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 7: Données invalides - Type de transaction invalide
  it('should fail validation if transaction type is invalid', () => {
    const invalidData = {
      transactionType: "invalid-type" as "income" | "expense", // Type invalide
      amount: 50,
      description: "Test",
      date: new Date(),
      bankAccountId: "some-bank-account-id"
    };
    
    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 8: Données invalides - bankAccountId manquant
  it('should fail validation if bankAccountId is missing', () => {
    const invalidData = {
      transactionType: "expense",
      amount: 50,
      description: "Test",
      date: new Date(),
      // bankAccountId est omis (requis)
    };
    
    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      // Message est 'Required' par défaut, on l'accepte
      expect(issueMessage === "Required" || issueMessage?.includes("Veuillez sélectionner un compte bancaire")).toBe(true);
    }
  });

  // Test 9: Données invalides - bankAccountId vide
  it('should fail validation if bankAccountId is empty', () => {
    const invalidData = {
      transactionType: "expense",
      amount: 50,
      description: "Test",
      date: new Date(),
      bankAccountId: "" // Vide
    };
    
    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Veuillez sélectionner un compte bancaire");
    }
  });
}); 