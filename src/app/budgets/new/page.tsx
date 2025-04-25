"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import Link from "next/link";

export default function NewBudgetPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("0");
  const [period, setPeriod] = useState("MONTHLY");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: categories } = api.category.getAll.useQuery();
  
  // Création de budget simplifiée
  const createBudget = api.budget.create.useMutation({
    onSuccess: () => {
      toast.success("Budget créé avec succès!");
      
      // Force la revalidation du cache avant redirection
      router.refresh();
      
      // Attendre un peu avant de rediriger pour s'assurer que le cache est invalidé
      setTimeout(() => {
        router.push("/budgets");
      }, 300);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
      setIsLoading(false);
    }
  });
  
  // Basculer une catégorie
  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };
  
  // Soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error("Le nom est requis");
      return;
    }
    
    if (parseFloat(amount) <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }
    
    setIsLoading(true);
    
    createBudget.mutate({
      name,
      amount: parseFloat(amount),
      period: period as "MONTHLY" | "YEARLY",
      categoryIds: selectedCategories
    });
  };
  
  return (
    <div className="container py-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nouveau Budget</h1>
        <Link href="/budgets">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 border rounded-lg p-6">
        {/* Nom du budget */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nom du budget</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Courses mensuelles"
            disabled={isLoading}
          />
        </div>
        
        {/* Montant */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Montant alloué</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            placeholder="Ex: 150"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Montant maximum que vous souhaitez dépenser
          </p>
        </div>
        
        {/* Période */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Période</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          >
            <option value="MONTHLY">Mensuel</option>
            <option value="YEARLY">Annuel</option>
          </select>
          <p className="text-sm text-muted-foreground">
            À quelle fréquence ce budget se renouvelle-t-il ?
          </p>
        </div>
        
        {/* Catégories */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Catégories (optionnel)</label>
          <div className="border rounded-md p-3">
            {!categories || categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune catégorie disponible</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => !isLoading && toggleCategory(cat.id)}
                    className={`
                      p-2 rounded flex items-center gap-2 cursor-pointer
                      ${selectedCategories.includes(cat.id) ? 'bg-primary/10' : 'hover:bg-muted'}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                      selectedCategories.includes(cat.id) ? 'bg-primary text-primary-foreground' : ''
                    }`}>
                      {selectedCategories.includes(cat.id) && <Check className="h-3 w-3" />}
                    </div>
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Link href="/budgets">
            <Button variant="outline" type="button" disabled={isLoading}>
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Création en cours..." : "Créer le budget"}
          </Button>
        </div>
      </form>
    </div>
  );
} 