"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loanCalculatorSchema, type LoanCalculatorSchemaType } from "~/lib/schemas/loan-calculator-schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { calculateLoanDetails } from "~/lib/utils/loan-calculator";

type FormValues = {
  amount: string;
  rate: string;
  duration: string;
};

export default function LoanCalculatorClient() {
  const [results, setResults] = useState<{ monthlyPayment: number; totalCost: number; totalRepaid: number } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(loanCalculatorSchema),
    defaultValues: {
      amount: "",
      rate: "",
      duration: "",
    },
  });

  function onSubmit(data: FormValues) {
    const principal = parseFloat(data.amount);
    const annualRate = parseFloat(data.rate);
    const years = parseInt(data.duration);

    const loanDetails = calculateLoanDetails(principal, annualRate, years);
    setResults(loanDetails);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Calculateur de Prêt</h1>
      <Card>
        <CardHeader>
          <CardTitle>Estimez vos mensualités</CardTitle>
          <CardDescription>
            Entrez les informations du prêt pour calculer une estimation de vos paiements mensuels et du coût total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant du prêt (€)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 10000" {...field} type="text" inputMode="decimal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux annuel (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 3.5" {...field} type="text" inputMode="decimal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (années)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 20" {...field} type="text" inputMode="numeric" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit">Calculer</Button>
            </form>
          </Form>

          {results && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Résultats Estimés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Mensualité estimée :
                  </p>
                  <p className="text-2xl font-semibold">
                    {results.monthlyPayment.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Montant total remboursé :
                  </p>
                  <p className="text-lg">
                    {results.totalRepaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Coût total du crédit (intérêts) :
                  </p>
                  <p className="text-lg text-destructive">
                    {results.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setResults(null);
                    form.reset();
                  }}
                >
                  Nouvelle simulation
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 