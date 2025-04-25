"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

const formSchema = z.object({
  name: z.string().min(1, "Nom requis").max(256),
  targetAmount: z.string().min(1, "Montant requis"),
  targetDate: z.date().nullable(),
  icon: z.string().max(50).nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Format #RRGGBB requis").nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface SavingsGoalFormProps {
  onSubmit: (values: FormValues) => Promise<void> | void;
  initialData?: Partial<FormValues>;
  onSuccess?: () => void;
  isPending?: boolean;
}

export function SavingsGoalForm({ onSubmit, initialData, onSuccess, isPending }: SavingsGoalFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      targetAmount: '',
      targetDate: null,
      icon: '🎯',
      color: '#A855F7',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l&apos;objectif</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Voiture neuve" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant cible</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="Ex: 15000" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date cible (optionnel)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ?? undefined}
                    onSelect={(date) => field.onChange(date ?? null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icône (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="🎯" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Un emoji pour représenter votre objectif</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur (optionnel)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="#A855F7" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Format hexadécimal: #RRGGBB</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Sauvegarde...' : (initialData ? 'Mettre à jour' : 'Créer l&apos;objectif')}
        </Button>
      </form>
    </Form>
  );
} 