import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

// Type pour le budget avec les dépenses
export interface BudgetWithSpending {
  id: string;
  name: string;
  userId: string;
  amount: number;
  period: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  spentAmount: number;
  remainingAmount: number;
  categoryDisplay: string;
  categories: Array<{
    id: string;
    name: string;
  }>;
}

interface BudgetCardProps {
  budget: BudgetWithSpending;
  onEdit: (budget: BudgetWithSpending) => void;
  onDeleteRequest: (budget: BudgetWithSpending) => void;
}

export function BudgetCard({ budget, onEdit, onDeleteRequest }: BudgetCardProps) {
  const { name, amount, spentAmount, remainingAmount, period, categoryDisplay } = budget;
  const percentage = amount > 0 ? (spentAmount / amount) * 100 : 0;
  const progressBarColor = percentage > 100 
    ? 'bg-destructive' 
    : percentage > 75 
      ? 'bg-yellow-500' 
      : 'bg-primary';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(budget)}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Modifier</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteRequest(budget)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-medium">{amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Dépensé</span>
            <span className="font-medium">{spentAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Restant</span>
            <span className="font-medium">{remainingAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`${progressBarColor} h-2.5 rounded-full`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{categoryDisplay || 'Aucune catégorie'}</span>
            <span>{period === 'MONTHLY' ? 'Mensuel' : 'Annuel'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 