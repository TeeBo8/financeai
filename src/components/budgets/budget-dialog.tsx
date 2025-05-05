"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BudgetForm } from "./budget-form"; 

// Type pour les catégories liées au budget
interface BudgetToCategory {
  categoryId: string;
}

// Type pour le budget
interface Budget {
  id: string;
  name: string;
  amount: number | string;
  period: "MONTHLY" | "YEARLY";
  budgetsToCategories: BudgetToCategory[];
}

// Type pour les données du formulaire
interface FormData {
  id: string;
  name: string;
  amount: number;
  period: "MONTHLY" | "YEARLY";
  categoryIds: string[];
  isSubscription: boolean;
}

interface BudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  budgetToEdit?: Budget;
}

export function BudgetDialog(props: BudgetDialogProps) {
  // Version ultra simplifiée pour éviter tout problème de rendu

  // Format minimal des données pour le formulaire
  const formData: FormData | null = props.budgetToEdit ? {
    id: props.budgetToEdit.id,
    name: props.budgetToEdit.name,
    amount: typeof props.budgetToEdit.amount === 'string' ? parseFloat(props.budgetToEdit.amount) : props.budgetToEdit.amount,
    period: props.budgetToEdit.period,
    categoryIds: props.budgetToEdit.budgetsToCategories?.map(btc => btc.categoryId) || [],
    isSubscription: false
  } : null;

  if (!props.isOpen) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) props.onClose(); }}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {props.isEditing ? "Modifier le budget" : "Créer un nouveau budget"}
          </DialogTitle>
          <DialogDescription>
            {props.isEditing ? "Modifier les détails du budget existant" : "Ajoutez un nouveau budget pour suivre vos dépenses"}
          </DialogDescription>
        </DialogHeader>
        <BudgetForm 
          initialData={formData} 
          onClose={props.onClose} 
        />
      </DialogContent>
    </Dialog>
  );
} 