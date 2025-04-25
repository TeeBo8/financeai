"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SavingsGoalForm } from "@/components/goals/savings-goal-form";
import { type RouterOutputs } from "@/trpc/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type SavingsGoal = RouterOutputs["savingsGoal"]["list"][number];

const contributionSchema = z.object({
  amount: z.string().min(1, "Montant requis"),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

interface ContributionFormProps {
  goalId: string | null;
  onSubmit: (values: ContributionFormValues) => Promise<void>;
  isPending: boolean;
}

function ContributionForm({ goalId, onSubmit, isPending }: ContributionFormProps) {
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: '' },
  });

  useEffect(() => {
    form.reset({ amount: '' });
  }, [goalId, form]);

  if (!goalId) return null;

  const handleSubmit = async (values: ContributionFormValues) => {
    const amount = Number(values.amount);
    if (isNaN(amount) || amount <= 0) {
      form.setError('amount', { message: 'Le montant doit être un nombre positif' });
      return;
    }
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant à ajouter (€)</FormLabel>
              <FormControl>
                <Input type="text" inputMode="decimal" placeholder="Ex: 50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">Annuler</Button>
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function GoalsClient() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const utils = trpc.useContext();

  const { data: goals, isLoading } = trpc.savingsGoal.list.useQuery();

  const createMutation = trpc.savingsGoal.create.useMutation({
    onSuccess: (data: SavingsGoal) => {
      void utils.savingsGoal.list.invalidate();
      setIsCreateDialogOpen(false);
      toast.success("Objectif créé ! 🎉", {
        description: `L&apos;objectif "${data.name}" a été ajouté avec succès.`,
      });
    },
    onError: (error) => {
      console.error("Erreur création objectif:", error);
      toast.error("Erreur de création", {
        description: error.message || 'Une erreur est survenue lors de la création de l&apos;objectif.',
      });
    }
  });

  const contributeMutation = trpc.savingsGoal.contribute.useMutation({
    onSuccess: (data: SavingsGoal) => {
      void utils.savingsGoal.list.invalidate();
      setContributionGoalId(null);
      toast.success("Contribution ajoutée ! 💰", {
        description: `Contribution enregistrée pour l&apos;objectif "${data.name}".`,
      });
    },
    onError: (error) => {
      console.error("Erreur contribution:", error);
      toast.error("Erreur de contribution", {
        description: error.message || 'Une erreur est survenue lors de l&apos;ajout de la contribution.',
      });
    }
  });

  const updateMutation = trpc.savingsGoal.update.useMutation({
    onSuccess: (data: SavingsGoal) => {
      void utils.savingsGoal.list.invalidate();
      setEditingGoal(null);
      toast.success("Objectif mis à jour ! ✨", {
        description: `L&apos;objectif "${data.name}" a été modifié avec succès.`,
      });
    },
    onError: (error) => {
      console.error("Erreur mise à jour objectif:", error);
      toast.error("Erreur de mise à jour", {
        description: error.message || 'Une erreur est survenue lors de la modification de l&apos;objectif.',
      });
    }
  });

  const deleteMutation = trpc.savingsGoal.delete.useMutation({
    onSuccess: (data: SavingsGoal) => {
      void utils.savingsGoal.list.invalidate();
      setDeletingGoalId(null);
      toast.success("Objectif supprimé ! 🗑️", {
        description: `L&apos;objectif "${data.name}" a été supprimé avec succès.`,
      });
    },
    onError: (error) => {
      console.error("Erreur suppression objectif:", error);
      toast.error("Erreur de suppression", {
        description: error.message || 'Une erreur est survenue lors de la suppression de l&apos;objectif.',
      });
    }
  });

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes Objectifs d&apos;Épargne</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Nouvel Objectif
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer un Nouvel Objectif</DialogTitle>
              <DialogDescription>
                Définissez votre objectif d&apos;épargne. Cliquez sur Créer lorsque vous avez terminé.
              </DialogDescription>
            </DialogHeader>
            <SavingsGoalForm
              onSubmit={async (values) => {
                const dataToSend = {
                  ...values,
                  targetAmount: Number(values.targetAmount)
                };
                await createMutation.mutateAsync(dataToSend);
              }}
              onSuccess={() => setIsCreateDialogOpen(false)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {goals && goals.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Aucun objectif d&apos;épargne</CardTitle>
            <CardDescription>
              Commencez à épargner en créant votre premier objectif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Créer mon premier objectif
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Créer un Nouvel Objectif</DialogTitle>
                  <DialogDescription>
                    Définissez votre objectif d&apos;épargne. Cliquez sur Créer lorsque vous avez terminé.
                  </DialogDescription>
                </DialogHeader>
                <SavingsGoalForm
                  onSubmit={async (values) => {
                    const dataToSend = {
                      ...values,
                      targetAmount: Number(values.targetAmount)
                    };
                    await createMutation.mutateAsync(dataToSend);
                  }}
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  isPending={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals?.map((goal: SavingsGoal) => (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{goal.icon}</span>
                  {goal.name}
                </CardTitle>
                <CardDescription>
                  Objectif: {goal.targetAmount.toLocaleString('fr-FR')} €
                  {goal.targetDate && (
                    <div>Date cible: {new Date(goal.targetDate).toLocaleDateString('fr-FR')}</div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Progression: {goal.currentAmount.toLocaleString('fr-FR')} €
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setContributionGoalId(goal.id)}>
                  Contribuer
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingGoal(goal)}>
                  Modifier
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setDeletingGoalId(goal.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogue de Contribution */}
      <Dialog open={!!contributionGoalId} onOpenChange={(isOpen) => !isOpen && setContributionGoalId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter une Contribution</DialogTitle>
            <DialogDescription>
              Combien avez-vous mis de côté pour cet objectif ?
            </DialogDescription>
          </DialogHeader>
          <ContributionForm
            goalId={contributionGoalId}
            onSubmit={async (values) => {
              if (!contributionGoalId) return;
              await contributeMutation.mutateAsync({
                id: contributionGoalId,
                contributionAmount: Number(values.amount),
              });
            }}
            isPending={contributeMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue de Modification */}
      <Dialog open={!!editingGoal} onOpenChange={(isOpen) => !isOpen && setEditingGoal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;Objectif</DialogTitle>
            <DialogDescription>
              Ajustez les détails de votre objectif d&apos;épargne.
            </DialogDescription>
          </DialogHeader>
          {editingGoal && (
            <SavingsGoalForm
              initialData={{
                ...editingGoal,
                targetAmount: editingGoal.targetAmount.toString(),
                icon: editingGoal.icon ?? '',
                color: editingGoal.color ?? '',
              }}
              onSubmit={async (values) => {
                await updateMutation.mutateAsync({
                  id: editingGoal.id,
                  ...values,
                  targetAmount: Number(values.targetAmount),
                });
              }}
              onSuccess={() => setEditingGoal(null)}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de Suppression */}
      <AlertDialog open={!!deletingGoalId} onOpenChange={(isOpen) => !isOpen && setDeletingGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement cet objectif d&apos;épargne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={deleteMutation.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!deletingGoalId) return;
                await deleteMutation.mutateAsync({ id: deletingGoalId });
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 