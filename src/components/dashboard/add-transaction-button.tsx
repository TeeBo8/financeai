"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useTransactionDialogStore } from "~/stores/useTransactionDialogStore";

export function AddTransactionButton() {
  const { openDialog } = useTransactionDialogStore();

  const handleClick = () => {
    openDialog(undefined, { showAddAndNew: true });
  };

  return (
    <Button onClick={handleClick}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Ajouter Transaction
    </Button>
  );
} 