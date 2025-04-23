import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recréer les schémas depuis category.ts
// Schéma de base pour création/modification
const categoryInputSchemaBase = z.object({
    name: z.string().min(1, "Le nom de la catégorie est requis").max(50, "Le nom ne peut pas dépasser 50 caractères"),
    icon: z.string().max(50, "L'icône est trop longue").optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
    color: z.string()
           .regex(/^#[0-9A-Fa-f]{6}$/, "Format couleur invalide (ex: #FF5733)")
           .optional()
           .nullable()
           .or(z.literal(''))
           .transform(val => val === '' ? null : val),
});

// Schéma pour la procédure update
const categoryUpdateSchema = categoryInputSchemaBase.partial().extend({
    id: z.string().min(1, "ID de catégorie requis."),
});

describe('categoryInputSchemaBase (schema for create procedure)', () => {
  // Test 1: Données valides complètes
  it('should validate successfully with valid complete data', () => {
    const validData = {
      name: "Alimentation",
      icon: "🍕",
      color: "#FF5733"
    };
    
    const result = categoryInputSchemaBase.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Alimentation",
        icon: "🍕",
        color: "#FF5733"
      });
    }
  });
  
  // Test 2: Données valides avec champs optionnels omis
  it('should validate successfully with only required fields', () => {
    const partialData = {
      name: "Transport"
      // icon et color sont omis (optionnels)
    };
    
    const result = categoryInputSchemaBase.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Transport");
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 3: Transformation des chaînes vides
  it('should transform empty strings to null for icon and color', () => {
    const data = {
      name: "Catégorie test",
      icon: "",
      color: ""
    };
    
    const result = categoryInputSchemaBase.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Catégorie test");
      expect(result.data.icon).toBeNull();
      expect(result.data.color).toBeNull();
    }
  });
  
  // Test 4: Données invalides - Nom manquant
  it('should fail validation if name is missing', () => {
    const invalidData = {
      // name est manquant (requis)
      icon: "🚗",
      color: "#123456"
    };
    
    const result = categoryInputSchemaBase.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      // Accepter soit le message personnalisé, soit le message par défaut de Zod
      expect(issueMessage === "Required" || issueMessage?.includes("Le nom de la catégorie est requis")).toBe(true);
    }
  });
  
  // Test 5: Données invalides - Nom vide
  it('should fail validation if name is empty', () => {
    const invalidData = {
      name: "", // Nom vide
      icon: "🚗",
      color: "#123456"
    };
    
    const result = categoryInputSchemaBase.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le nom de la catégorie est requis");
    }
  });
  
  // Test 6: Données invalides - Nom trop long
  it('should fail validation if name is too long', () => {
    const longName = "a".repeat(51); // 51 caractères
    const invalidData = {
      name: longName,
      icon: "🚗",
      color: "#123456"
    };
    
    const result = categoryInputSchemaBase.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage?.includes("50 caractères") || issueMessage?.includes("50")).toBe(true);
    }
  });
  
  // Test 7: Données invalides - Icône trop longue
  it('should fail validation if icon is too long', () => {
    const longIcon = "🔥".repeat(26); // Plus de 50 caractères
    const invalidData = {
      name: "Catégorie test",
      icon: longIcon,
      color: "#123456"
    };
    
    const result = categoryInputSchemaBase.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("trop longue");
    }
  });
  
  // Test 8: Données invalides - Format de couleur invalide
  it('should fail validation if color format is invalid', () => {
    const invalidData = {
      name: "Catégorie test",
      color: "pas-une-couleur-hex" // Format invalide
    };
    
    const result = categoryInputSchemaBase.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Format couleur invalide");
    }
  });
  
  // Test 9: Données invalides - Format de couleur hexadécimal court (3 caractères)
  it('should fail validation if color format is short hex (#RGB instead of #RRGGBB)', () => {
    const invalidData = {
      name: "Catégorie test",
      color: "#F00" // Format court invalide selon le regex défini
    };
    
    const result = categoryInputSchemaBase.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Format couleur invalide");
    }
  });
});

describe('categoryUpdateSchema (schema for update procedure)', () => {
  // Test 1: Données valides complètes
  it('should validate successfully with valid complete data', () => {
    const validData = {
      id: "category-123",
      name: "Nouveau nom",
      icon: "🎮",
      color: "#AABBCC"
    };
    
    const result = categoryUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        id: "category-123",
        name: "Nouveau nom",
        icon: "🎮",
        color: "#AABBCC"
      });
    }
  });
  
  // Test 2: Données valides avec id et name seulement
  it('should validate successfully with only id and name', () => {
    const partialData = {
      id: "category-123",
      name: "Nouveau nom"
      // icon et color sont omis (optionnels)
    };
    
    const result = categoryUpdateSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("category-123");
      expect(result.data.name).toBe("Nouveau nom");
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 3: Données valides avec id et icon seulement
  it('should validate successfully with only id and icon', () => {
    const partialData = {
      id: "category-123",
      icon: "🚗"
      // name et color sont omis (optionnels pour update)
    };
    
    const result = categoryUpdateSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("category-123");
      expect(result.data.icon).toBe("🚗");
      expect(result.data.name).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 4: Données valides avec id et color seulement
  it('should validate successfully with only id and color', () => {
    const partialData = {
      id: "category-123",
      color: "#112233"
      // name et icon sont omis (optionnels pour update)
    };
    
    const result = categoryUpdateSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("category-123");
      expect(result.data.color).toBe("#112233");
      expect(result.data.name).toBeUndefined();
      expect(result.data.icon).toBeUndefined();
    }
  });
  
  // Test 5: Données valides avec id seulement
  it('should validate successfully with only id', () => {
    const partialData = {
      id: "category-123"
      // Tous les autres champs sont omis (optionnels pour update)
    };
    
    const result = categoryUpdateSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("category-123");
      expect(result.data.name).toBeUndefined();
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 6: Données valides avec chaînes vides transformées en null
  it('should transform empty strings to null for icon and color', () => {
    const data = {
      id: "category-123",
      name: "Catégorie test",
      icon: "",
      color: ""
    };
    
    const result = categoryUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("category-123");
      expect(result.data.name).toBe("Catégorie test");
      expect(result.data.icon).toBeNull();
      expect(result.data.color).toBeNull();
    }
  });
  
  // Test 7: Données invalides - id manquant
  it('should fail validation if id is missing', () => {
    const invalidData = {
      // id est manquant (requis)
      name: "Nouveau nom",
      icon: "🎮",
      color: "#AABBCC"
    };
    
    const result = categoryUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some(issue => issue.path.includes('id'))).toBe(true);
    }
  });
  
  // Test 8: Données invalides - id vide
  it('should fail validation if id is empty', () => {
    const invalidData = {
      id: "", // id vide
      name: "Nouveau nom",
      icon: "🎮",
      color: "#AABBCC"
    };
    
    const result = categoryUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some(issue => issue.path.includes('id'))).toBe(true);
    }
  });
  
  // Test 9: Données invalides - name fourni mais vide
  it('should fail validation if name is provided but empty', () => {
    const invalidData = {
      id: "category-123",
      name: "", // name vide
      icon: "🎮",
      color: "#AABBCC"
    };
    
    const result = categoryUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le nom de la catégorie est requis");
    }
  });
  
  // Test 10: Données invalides - name fourni mais trop long
  it('should fail validation if name is provided but too long', () => {
    const longName = "a".repeat(51); // 51 caractères
    const invalidData = {
      id: "category-123",
      name: longName,
    };
    
    const result = categoryUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage?.includes("50 caractères") || issueMessage?.includes("50")).toBe(true);
    }
  });
  
  // Test 11: Données invalides - format de couleur invalide
  it('should fail validation if color format is invalid', () => {
    const invalidData = {
      id: "category-123",
      color: "not-a-color" // Format invalide
    };
    
    const result = categoryUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Format couleur invalide");
    }
  });
  
  // Test 12: Données invalides - icône trop longue
  it('should fail validation if icon is too long', () => {
    const longIcon = "🔥".repeat(26); // Plus de 50 caractères
    const invalidData = {
      id: "category-123",
      icon: longIcon
    };
    
    const result = categoryUpdateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("trop longue");
    }
  });
}); 