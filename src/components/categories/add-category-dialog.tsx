"use client";

import React, { useState } from 'react';
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "~/components/ui/dialog";
import { CategoryForm } from './category-form'; // On va créer ce composant

export function AddCategoryDialog() {
    const [isOpen, setIsOpen] = useState(false);

    const handleCloseDialog = () => {
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une catégorie
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouvelle Catégorie</DialogTitle>
                     <DialogDescription>
                        Entrez le nom de votre nouvelle catégorie.
                     </DialogDescription>
                </DialogHeader>
                {/* Le formulaire en mode création */}
                <CategoryForm onFormSubmit={handleCloseDialog} />
            </DialogContent>
        </Dialog>
    );
} 