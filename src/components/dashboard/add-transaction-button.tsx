"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TransactionForm } from "~/components/transactions/transaction-form";

export function AddTransactionButton() {
  return (
    <TransactionForm>
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Ajouter Transaction
      </Button>
    </TransactionForm>
  );
} 