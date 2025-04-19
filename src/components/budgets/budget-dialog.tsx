"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { BudgetForm } from "./budget-form"; 

interface BudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  budgetToEdit?: any;
}

export function BudgetDialog(props: BudgetDialogProps) {
  // Version ultra simplifiée pour éviter tout problème de rendu

  // Format minimal des données pour le formulaire
  const formData = props.budgetToEdit ? {
    id: props.budgetToEdit.id,
    name: props.budgetToEdit.name,
    amount: typeof props.budgetToEdit.amount === 'string' ? parseFloat(props.budgetToEdit.amount) : props.budgetToEdit.amount,
    period: props.budgetToEdit.period as "MONTHLY" | "YEARLY",
    categoryIds: props.budgetToEdit.budgetsToCategories?.map((btc: any) => btc.categoryId) || []
  } : null;

  if (!props.isOpen) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) props.onClose(); }}>
      <DialogContent className="sm:max-w-lg">
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