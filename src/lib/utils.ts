import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export const formatDate = (date: Date | string): string => {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
};

export function getCssVariableValue(variableName: string): string {
  if (typeof window === 'undefined') {
    // Retourner une valeur par défaut côté serveur ou lors du build
    if (variableName === '--primary') return '#007bff'; // Bleu par défaut
    if (variableName === '--destructive') return '#dc3545'; // Rouge par défaut
    return '#000000'; // Noir par défaut
  }
  // Récupère la valeur calculée de la variable CSS sur l'élément racine (<html>)
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}
