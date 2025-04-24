export function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (annualRate <= 0 || years <= 0) {
    // Si le taux est 0, la mensualité est simplement le principal divisé par le nombre de mois
    if (annualRate === 0) return principal / (years * 12);
    // Pour l'instant, on assume des inputs valides > 0 grâce à la validation Zod
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;

  // Cas spécial si le taux est très proche de 0 pour éviter division par zéro
  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  const monthlyPayment =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return monthlyPayment;
}

export function calculateLoanDetails(principal: number, annualRate: number, years: number) {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const numberOfPayments = years * 12;
  const totalRepaid = monthlyPayment * numberOfPayments;
  const totalCost = totalRepaid - principal;

  return {
    monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
    totalRepaid: parseFloat(totalRepaid.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
  };
} 