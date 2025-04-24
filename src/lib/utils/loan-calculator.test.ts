import { describe, expect, it } from 'vitest';
import { calculateMonthlyPayment } from './loan-calculator';

describe('calculateMonthlyPayment', () => {
  it('should calculate the correct monthly payment for standard values', () => {
    // Exemple: 100000€ à 3.5% sur 20 ans
    const principal = 100000;
    const annualRate = 3.5;
    const years = 20;
    const expectedMonthlyPayment = 579.96; // Vérifié avec une calculatrice en ligne
    expect(calculateMonthlyPayment(principal, annualRate, years)).toBeCloseTo(expectedMonthlyPayment, 2);
  });

  it('should calculate correctly with zero interest rate', () => {
    const principal = 12000;
    const annualRate = 0;
    const years = 10;
    const expectedMonthlyPayment = 100.00; // 12000 / (10 * 12)
    expect(calculateMonthlyPayment(principal, annualRate, years)).toBeCloseTo(expectedMonthlyPayment, 2);
  });

  it('should calculate correctly for a short duration', () => {
    const principal = 5000;
    const annualRate = 5;
    const years = 1;
    const expectedMonthlyPayment = 428.04; // Vérifié avec une calculatrice en ligne
    expect(calculateMonthlyPayment(principal, annualRate, years)).toBeCloseTo(expectedMonthlyPayment, 2);
  });

  it('should calculate correctly for a large amount', () => {
    const principal = 500000;
    const annualRate = 4;
    const years = 25;
    const expectedMonthlyPayment = 2639.18; // Vérifié avec une calculatrice en ligne
    expect(calculateMonthlyPayment(principal, annualRate, years)).toBeCloseTo(expectedMonthlyPayment, 2);
  });

  it('should handle very low interest rates', () => {
    const principal = 10000;
    const annualRate = 0.1; // Taux très bas
    const years = 5;
    const expectedMonthlyPayment = 167.14; // Vérifié avec une calculatrice en ligne
    expect(calculateMonthlyPayment(principal, annualRate, years)).toBeCloseTo(expectedMonthlyPayment, 1);
  });
}); 