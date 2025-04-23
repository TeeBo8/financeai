import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import des schémas depuis le routeur de transactions
// Note: comme ils ne sont pas exportés, nous les recréons ici pour les tests
const createTransactionSchema = z.object({
  amount: z.number({ invalid_type_error: "Le montant doit être un nombre" }),
  description: z.string().min(1, { message: "La description est requise" }),
  date: z.date({ required_error: "La date est requise" }),
  categoryId: z.string().nullable(), // Accepte n'importe quelle chaîne ou null
  bankAccountId: z.string().min(1, "L'ID du compte bancaire est requis."),
});

// Schéma de base pour les transactions (utilisé pour create et update)
const transactionInputSchemaBase = z.object({
  description: z.string().min(1, "La description est requise"),
  amount: z.coerce.number(), // Accepte positif/négatif
  date: z.date(),
  categoryId: z.string().nullable(), // Accepte n'importe quelle chaîne ou null
  bankAccountId: z.string().min(1, "L'ID du compte bancaire est requis."),
});

// Schéma d'update (base partielle + id obligatoire)
const updateTransactionSchema = transactionInputSchemaBase.partial().extend({
  id: z.string().min(1, "ID de transaction requis pour la mise à jour."),
});

describe('createTransactionSchema (Create Transaction Input Schema)', () => {
  // Test 1: Données valides complètes
  it('devrait valider des données complètes valides', () => {
    const validData = {
      amount: 100,
      description: "Courses alimentaires",
      date: new Date(),
      categoryId: "cat123",
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  // Test 2: Validation avec un montant positif
  it('devrait valider avec un montant positif', () => {
    const validData = {
      amount: 50.75,
      description: "Revenus",
      date: new Date(),
      categoryId: "cat123",
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Test 3: Validation avec un montant négatif
  it('devrait valider avec un montant négatif', () => {
    const validData = {
      amount: -25.50,
      description: "Facture électricité",
      date: new Date(),
      categoryId: "cat123",
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Test 4: Validation sans categoryId (null)
  it('devrait valider sans categoryId (null)', () => {
    const validData = {
      amount: 75,
      description: "Transaction sans catégorie",
      date: new Date(),
      categoryId: null,
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBeNull();
    }
  });

  // Test 5: Échec si description manquante ou vide
  it('devrait échouer si la description est vide', () => {
    const invalidData = {
      amount: 100,
      description: "", // Description vide
      date: new Date(),
      categoryId: "cat123",
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("La description est requise");
    }
  });

  // Test 6: Échec si montant non numérique
  it('devrait échouer si le montant n\'est pas numérique', () => {
    const invalidData = {
      amount: "pas-un-nombre" as unknown as number,
      description: "Transaction test",
      date: new Date(),
      categoryId: "cat123",
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le montant doit être un nombre");
    }
  });

  // Test 7: Échec si date invalide
  it('devrait échouer si la date est invalide', () => {
    const invalidData = {
      amount: 100,
      description: "Transaction test",
      date: "pas-une-date" as unknown as Date,
      categoryId: "cat123",
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 8: Échec si bankAccountId manquant
  it('devrait échouer si bankAccountId est manquant', () => {
    const invalidData = {
      amount: 100,
      description: "Transaction test",
      date: new Date(),
      categoryId: "cat123",
      // bankAccountId manquant
    };
    
    const result = createTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 9: Échec si bankAccountId vide
  it('devrait échouer si bankAccountId est vide', () => {
    const invalidData = {
      amount: 100,
      description: "Transaction test",
      date: new Date(),
      categoryId: "cat123",
      bankAccountId: "",
    };
    
    const result = createTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("L'ID du compte bancaire est requis");
    }
  });

  // Test 10: Échec si categoryId invalide (non string)
  it('devrait échouer si categoryId est invalide (non string)', () => {
    const invalidData = {
      amount: 100,
      description: "Transaction test",
      date: new Date(),
      categoryId: 123 as unknown as string,
      bankAccountId: "acc456",
    };
    
    const result = createTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('updateTransactionSchema (Update Transaction Input Schema)', () => {
  // Test 1: Données valides complètes
  it('devrait valider des données complètes valides avec id', () => {
    const validData = {
      id: "tx789",
      amount: 100,
      description: "Courses alimentaires modifiées",
      date: new Date(),
      categoryId: "cat123",
      bankAccountId: "acc456",
    };
    
    const result = updateTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  // Test 2: Validation avec seulement l'id et un champ (description)
  it('devrait valider avec seulement l\'id et la description', () => {
    const validData = {
      id: "tx789",
      description: "Description modifiée",
    };
    
    const result = updateTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Test 3: Validation avec seulement l'id et un champ (montant)
  it('devrait valider avec seulement l\'id et le montant', () => {
    const validData = {
      id: "tx789",
      amount: 200.50,
    };
    
    const result = updateTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Test 4: Validation avec seulement l'id et un champ (date)
  it('devrait valider avec seulement l\'id et la date', () => {
    const validData = {
      id: "tx789",
      date: new Date(),
    };
    
    const result = updateTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Test 5: Validation avec seulement l'id et un champ (categoryId)
  it('devrait valider avec seulement l\'id et categoryId', () => {
    const validData = {
      id: "tx789",
      categoryId: "newcat123",
    };
    
    const result = updateTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Test 6: Validation avec mise à null de categoryId
  it('devrait valider avec la mise à null de categoryId', () => {
    const validData = {
      id: "tx789",
      categoryId: null,
    };
    
    const result = updateTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBeNull();
    }
  });

  // Test 7: Échec si id manquant
  it('devrait échouer si id est manquant', () => {
    const invalidData = {
      description: "Transaction modifiée",
      amount: 150,
    };
    
    const result = updateTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 8: Échec si id vide
  it('devrait échouer si id est vide', () => {
    const invalidData = {
      id: "",
      description: "Transaction modifiée",
    };
    
    const result = updateTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("ID de transaction requis");
    }
  });

  // Test 9: Échec si description fournie mais vide
  it('devrait échouer si description est fournie mais vide', () => {
    const invalidData = {
      id: "tx789",
      description: "", // Description vide
    };
    
    const result = updateTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("La description est requise");
    }
  });

  // Test 10: Échec si montant fourni mais invalide
  it('devrait échouer si montant est fourni mais invalide', () => {
    const invalidData = {
      id: "tx789",
      amount: "pas-un-nombre" as unknown as number,
    };
    
    const result = updateTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 11: Échec si date fournie mais invalide
  it('devrait échouer si date est fournie mais invalide', () => {
    const invalidData = {
      id: "tx789",
      date: "pas-une-date" as unknown as Date,
    };
    
    const result = updateTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 12: Échec si bankAccountId fourni mais vide
  it('devrait échouer si bankAccountId est fourni mais vide', () => {
    const invalidData = {
      id: "tx789",
      bankAccountId: "",
    };
    
    const result = updateTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("L'ID du compte bancaire est requis");
    }
  });
}); 