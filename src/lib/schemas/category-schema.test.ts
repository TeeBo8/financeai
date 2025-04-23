import { describe, it, expect } from 'vitest';
import { categoryFormSchema } from './category-schema';

describe('categoryFormSchema (Category Form Schema)', () => {
  // Test 1: Données valides complètes
  it('should validate successfully with valid full data', () => {
    const validData = {
      name: "Alimentation",
      icon: "🍕",
      color: "#FF5733",
    };
    
    const result = categoryFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });
  
  // Test 2: Données valides avec champs optionnels omis
  it('should validate successfully with only required fields and apply defaults', () => {
    const partialData = {
      name: "Transport",
      // icon et color sont omis (optionnels)
    };
    
    const result = categoryFormSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      // Vérifier le nom est présent
      expect(result.data.name).toBe("Transport");
      // Vérifier que icon et color sont undefined
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });
  
  // Test 3: Données invalides - Nom manquant
  it('should fail validation if name is empty', () => {
    const invalidData = {
      name: "",
      icon: "🚗",
      color: "#123456",
    };
    
    const result = categoryFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Le nom de la catégorie est requis");
    }
  });
  
  // Test 4: Données invalides - Format de couleur invalide
  it('should fail validation if color format is invalid', () => {
    const invalidData = {
      name: "Loisirs",
      icon: "🎮",
      color: "pas-une-couleur", // Format de couleur invalide
    };
    
    const result = categoryFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueMessage = result.error.issues[0]?.message;
      expect(issueMessage).toContain("Format de couleur invalide");
    }
  });
  
  // Test 5: Données valides avec une chaîne vide pour la couleur
  it('should validate successfully with empty string for color', () => {
    const validData = {
      name: "Divers",
      icon: "📦",
      color: "", // Chaîne vide pour la couleur
    };
    
    const result = categoryFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("");
    }
  });
  
  // Test 6: Valide avec un format de couleur en 3 caractères
  it('should validate successfully with 3-character hex color', () => {
    const validData = {
      name: "Santé",
      icon: "💊",
      color: "#F00", // Format couleur hexadécimal court (3 caractères)
    };
    
    const result = categoryFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("#F00");
    }
  });
}); 