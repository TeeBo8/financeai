import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './utils'; // Ajout de formatDate à l'import

describe('formatCurrency', () => {
  // Test 1: Nombre positif simple
  it('should format a positive number correctly', () => {
    expect(formatCurrency(1234.56)).toBe('1\u202f234,56\u00a0€'); // Note: Utilise les caractères Unicode pour les espaces insécables
  });

  // Test 2: Nombre négatif
  it('should format a negative number correctly', () => {
    // Attention: Le format exact peut varier (signe avant/après €, espace?)
    // Vérifie le rendu réel ou ajuste l'assertion. L'espace insécable est probable.
    expect(formatCurrency(-500)).toBe('-500,00\u00a0€');
  });

  // Test 3: Nombre zéro
  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('0,00\u00a0€');
  });

  // Test 4: Nombre avec beaucoup de décimales (doit être arrondi à 2)
  it('should round the number to two decimal places', () => {
    expect(formatCurrency(99.987)).toBe('99,99\u00a0€'); // Arrondi supérieur
    expect(formatCurrency(100.123)).toBe('100,12\u00a0€'); // Arrondi inférieur
  });

  // Test 5: Grand nombre (vérifier séparateur de milliers)
  it('should format large numbers with thousand separators', () => {
    expect(formatCurrency(1000000)).toBe('1\u202f000\u202f000,00\u00a0€'); // Note: espace insécable fin comme séparateur
  });

  // Test 6: Très petit nombre
  it('should format small numbers correctly', () => {
     expect(formatCurrency(0.05)).toBe('0,05\u00a0€');
  });
});

describe('formatDate', () => {
  // Test 1: Date valide (objet Date)
  it('should format a valid Date object correctly', () => {
    const date = new Date(2025, 3, 25); // Mois est 0-indexé (3 = Avril)
    expect(formatDate(date)).toBe('25 avr. 2025');
  });

  // Test 2: Date valide (chaîne ISO)
  it('should format a valid ISO date string correctly', () => {
    const dateString = '2024-12-31T10:00:00Z';
    expect(formatDate(dateString)).toBe('31 déc. 2024');
  });

  // Test 3: Date valide (autre format de chaîne si pertinent)
  it('should format another valid date string format correctly', () => {
    const dateString = '01/01/2026'; // Format MM/DD/YYYY
    // Attention: new Date() peut mal interpréter ce format selon le locale
    // Préférer ISO string ou objet Date pour les tests.
    // Mais si ta fonction est censée le gérer :
    expect(formatDate(dateString)).toBe('01 janv. 2026'); // Vérifie le résultat réel
  });

  // Test 4: Date au début du mois/année
  it('should format dates at the beginning of month/year', () => {
    expect(formatDate(new Date(2023, 0, 1))).toBe('01 janv. 2023'); // 1er Janvier
  });

  // Test 5: Date à la fin du mois/année
   it('should format dates at the end of month/year', () => {
     expect(formatDate(new Date(2024, 11, 31))).toBe('31 déc. 2024'); // 31 Décembre
   });
}); 