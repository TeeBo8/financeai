import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recréer les schémas depuis bankAccount.ts
const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

// Schéma pour la procédure create
const bankAccountInputSchema = z.object({
  name: z.string().min(1, { message: "Le nom du compte est requis." }).max(256, { message: "Le nom du compte est trop long (max 256 caractères)." }),
  icon: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  color: z.string()
         .regex(hexColorRegex, { message: "Format couleur invalide (ex: #FFF)." })
         .optional()
         .or(z.literal(''))
         .transform(val => val === '' ? null : val),
});

// Schéma pour la procédure update
const bankAccountUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { message: "Le nom du compte est requis." }).max(256).optional(),
  icon: bankAccountInputSchema.shape.icon.optional(),
  color: bankAccountInputSchema.shape.color.optional(),
});

describe('bankAccountInputSchema (schema for create procedure)', () => {
  // Test 1: Données valides complètes
  it('should validate successfully with valid complete data', () => {
    const validData = {
      name: "Compte courant",
      icon: "💰",
      color: "#FF5733"
    };
    
    const result = bankAccountInputSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Compte courant",
        icon: "💰",
        color: "#FF5733"
      });
    }
  });
  
  // Test 2: Données valides avec champs optionnels omis
  it('should validate successfully with only required fields', () => {
    const partialData = {
      name: "Compte épargne"
      // icon et color sont omis (optionnels)
    };
    
    const result = bankAccountInputSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Compte épargne");
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 3: Transformation des chaînes vides
  it('should transform empty strings to null for icon and color', () => {
    const data = {
      name: "Compte test",
      icon: "",
      color: ""
    };
    
    const result = bankAccountInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Compte test");
      expect(result.data.icon).toBeNull();
      expect(result.data.color).toBeNull();
    }
  });
  
  // Test 4: Valide couleur en format court (#RGB)
  it('should validate short hex color format (#RGB)', () => {
    const data = {
      name: "Compte couleur courte",
      color: "#F00"  // Rouge en format court
    };
    
    const result = bankAccountInputSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("#F00");
    }
  });
  
  // Test 5: Données invalides - Nom manquant
  it('should fail validation if name is missing', () => {
    const invalidData = {
      // name est manquant (requis)
      icon: "💳",
      color: "#123456"
    };
    
    const result = bankAccountInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      // Accepter soit le message personnalisé, soit le message par défaut de Zod
      expect(issueMessage === "Required" || issueMessage?.includes("Le nom du compte est requis")).toBe(true);
    }
  });
  
  // Test 6: Données invalides - Nom vide
  it('should fail validation if name is empty', () => {
    const invalidData = {
      name: "", // Nom vide
      icon: "💳",
      color: "#123456"
    };
    
    const result = bankAccountInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le nom du compte est requis");
    }
  });
  
  // Test 7: Données invalides - Nom trop long
  it('should fail validation if name is too long', () => {
    const longName = "a".repeat(257); // 257 caractères
    const invalidData = {
      name: longName,
      icon: "💳",
      color: "#123456"
    };
    
    const result = bankAccountInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("trop long");
    }
  });
  
  // Test 8: Données invalides - Format de couleur invalide
  it('should fail validation if color format is invalid', () => {
    const invalidData = {
      name: "Compte test",
      color: "pas-une-couleur-hex" // Format invalide
    };
    
    const result = bankAccountInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Format couleur invalide");
    }
  });
});

describe('bankAccountUpdateSchema (schema for update procedure)', () => {
  // Test 1: Données valides complètes
  it('should validate successfully with valid complete data', () => {
    const validData = {
      id: "account-123",
      name: "Nouveau nom",
      icon: "💸",
      color: "#AABBCC"
    };
    
    const result = bankAccountUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        id: "account-123",
        name: "Nouveau nom",
        icon: "💸",
        color: "#AABBCC"
      });
    }
  });
  
  // Test 2: Données valides avec id et name seulement
  it('should validate successfully with only id and name', () => {
    const partialData = {
      id: "account-123",
      name: "Nouveau nom"
      // icon et color sont omis (optionnels)
    };
    
    const result = bankAccountUpdateSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("account-123");
      expect(result.data.name).toBe("Nouveau nom");
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 3: Données valides avec id et icon seulement
  it('should validate successfully with only id and icon', () => {
    const partialData = {
      id: "account-123",
      icon: "🏦"
      // name et color sont omis (optionnels pour update)
    };
    
    const result = bankAccountUpdateSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("account-123");
      expect(result.data.icon).toBe("🏦");
      expect(result.data.name).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 4: Données valides avec id et color seulement
  it('should validate successfully with only id and color', () => {
    const partialData = {
      id: "account-123",
      color: "#112233"
      // name et icon sont omis (optionnels pour update)
    };
    
    const result = bankAccountUpdateSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("account-123");
      expect(result.data.color).toBe("#112233");
      expect(result.data.name).toBeUndefined();
      expect(result.data.icon).toBeUndefined();
    }
  });
  
  // Test 5: Données valides avec chaînes vides transformées en null
  it('should transform empty strings to null for icon and color', () => {
    const data = {
      id: "account-123",
      name: "Compte test",
      icon: "",
      color: ""
    };
    
    const result = bankAccountUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("account-123");
      expect(result.data.name).toBe("Compte test");
      expect(result.data.icon).toBeNull();
      expect(result.data.color).toBeNull();
    }
  });
  
  // Test 6: Données invalides - id manquant
  it('should fail validation if id is missing', () => {
    const invalidData = {
      // id est manquant (requis)
      name: "Nouveau nom",
      icon: "💰",
      color: "#AABBCC"
    };
    
    const result = bankAccountUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some(issue => issue.path.includes('id'))).toBe(true);
    }
  });
  
  // Test 7: Données invalides - id vide
  it('should fail validation if id is empty', () => {
    const invalidData = {
      id: "", // id vide
      name: "Nouveau nom",
      icon: "💰",
      color: "#AABBCC"
    };
    
    const result = bankAccountUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some(issue => issue.path.includes('id'))).toBe(true);
    }
  });
  
  // Test 8: Données invalides - name fourni mais vide
  it('should fail validation if name is provided but empty', () => {
    const invalidData = {
      id: "account-123",
      name: "", // name vide
      icon: "💰",
      color: "#AABBCC"
    };
    
    const result = bankAccountUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le nom du compte est requis");
    }
  });
  
  // Test 9: Données invalides - format de couleur invalide
  it('should fail validation if color format is invalid', () => {
    const invalidData = {
      id: "account-123",
      name: "Compte test",
      color: "not-a-color" // Format invalide
    };
    
    const result = bankAccountUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Format couleur invalide");
    }
  });
  
  // Test 10: Données invalides - name trop long
  it('should fail validation if name is too long', () => {
    const longName = "a".repeat(257); // 257 caractères
    const invalidData = {
      id: "account-123",
      name: longName
    };
    
    const result = bankAccountUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      // Accepter soit le message personnalisé, soit le message par défaut de Zod
      expect(issueMessage?.includes("256") || issueMessage?.includes("trop long")).toBe(true);
    }
  });
}); 