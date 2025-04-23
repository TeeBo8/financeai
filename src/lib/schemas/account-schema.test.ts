// Fichier de test pour le schéma Zod de compte
// Contenu à ajouter avec le prochain prompt 

import { describe, it, expect } from 'vitest';
import { accountFormSchema } from './account-schema'; // Nom corrigé selon le fichier source

describe('accountFormSchema', () => {
  // Test 1: Données valides complètes
  it('should validate successfully with valid full data', () => {
    const validData = {
      name: 'Compte Courant',
      icon: '🏦',
      color: '#1ABC9C',
    };
    const result = accountFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    // Vérifie que les données parsées sont correctes (optionnel mais bien)
    if (result.success) {
        expect(result.data).toEqual(validData);
    }
  });

  // Test 2: Données valides avec valeurs par défaut pour icon et color
  it('should validate successfully and apply defaults for icon and color', () => {
    const validData = {
      name: 'Compte Épargne',
      // icon et color sont omis
    };
    const result = accountFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    // Vérifie que les valeurs par défaut sont appliquées
    if (result.success) {
      expect(result.data.name).toBe('Compte Épargne');
      // Pour les champs optionnels qui utilisent transform, on s'attend à ce qu'ils soient undefined
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });

  // Test 3: Données invalides - Nom vide
  it('should fail validation if name is empty', () => {
    const invalidData = {
      name: '', // Nom vide
      icon: '❓',
      color: '#FF0000',
    };
    const result = accountFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    // Optionnel: vérifier le message d'erreur spécifique
    // if (!result.success) {
    //   expect(result.error.errors[0].message).toContain("Le nom du compte est requis");
    // }
  });

   // Test 4: Données invalides - Nom trop long (si une limite est définie)
   // it('should fail validation if name is too long', () => { ... });

   // Test 5: Données invalides - Couleur incorrecte (format non hexadécimal)
   it('should fail validation if color format is invalid', () => {
    const invalidData = {
      name: 'Test Color',
      icon: '🎨',
      color: 'pasunecouleur', // Format invalide
    };
    const result = accountFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
     // Optionnel: vérifier le message d'erreur spécifique
     // if (!result.success) {
     //   expect(result.error.errors[0].message).toContain("Format couleur invalide");
     // }
   });

   // Test 6: Données invalides - Icône trop longue (si limite définie)
   // it('should fail validation if icon is too long', () => { ... });

   // Ajoute d'autres tests pour les cas limites ou contraintes spécifiques si nécessaire
}); 