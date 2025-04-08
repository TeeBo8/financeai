"use client";

import { useState } from "react";
// Importera le composant de liste qu'on va créer
import { BudgetList } from "~/components/budgets/budget-list"; 
// Importera le composant formulaire plus tard
import { BudgetForm } from "~/components/budgets/budget-form";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos budgets mensuels, hebdomadaires...
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Ajouter un Budget</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un budget</DialogTitle>
              <DialogDescription>
                Créez un nouveau budget pour suivre vos dépenses
              </DialogDescription>
            </DialogHeader>
            <BudgetForm onFormSubmit={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Utiliser le composant BudgetList */}
      <BudgetList />

    </div>
  );
} 