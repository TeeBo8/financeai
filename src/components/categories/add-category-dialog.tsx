"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useCategoryDialogStore } from "@/stores/useCategoryDialogStore";

export function AddCategoryDialog() {
    const { openCreateDialog } = useCategoryDialogStore();

    return (
        <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une catégorie
        </Button>
    );
} 