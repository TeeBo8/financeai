"use client";

import Image from 'next/image';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import { LogIn, Bot, ListChecks, Target, ArrowRightLeft, PieChart, Rocket } from 'lucide-react';
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Particles from '../components/ui/particles';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative flex-1">
        <Particles 
          className="absolute inset-0 -z-10" 
          quantity={100}
          staticity={30}
          ease={20}
        />
        <main className="flex flex-col items-center justify-center min-h-screen py-16">
          <section className="w-full max-w-4xl px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-primary mb-6">
                FinanceAI : Maîtrisez Votre Budget
                <Rocket className="inline-block ml-3 h-8 w-8 sm:h-10 sm:w-10 text-primary animate-bounce" />
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Prenez enfin le contrôle de vos finances personnelles. Suivez vos
                dépenses, visualisez vos budgets et préparez sereinement votre
                avenir financier. Simple, intuitif et (bientôt !) intelligent.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {!session ? (
                <>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto" 
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Continuer avec Google
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
                  >
                    <Bot className="mr-2 h-5 w-5" />
                    Continuer avec Discord
                  </Button>
                </>
              ) : (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard">Accéder au Tableau de Bord</Link>
                </Button>
              )}
            </div>

            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/images/dashboard-preview.png"
                alt="Aperçu du tableau de bord FinanceAI"
                fill
                className="object-contain"
                priority
              />
            </div>
          </section>

          {/* Section Fonctionnalités */}
          <section className="relative z-20 w-full bg-background/80 backdrop-blur-sm mt-16">
            <div className="container mx-auto px-4 py-16">
              <h2 className="mb-8 sm:mb-12 text-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Tout ce dont vous avez besoin, au même endroit
              </h2>
              {/* Grille des fonctionnalités */}
              <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-x-8 md:gap-y-12 md:grid-cols-2 lg:grid-cols-4">
                {/* Feature 1: Transactions */}
                <div className="flex flex-col items-center text-center p-4 sm:p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                    <ListChecks className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="mb-2 text-lg sm:text-xl font-semibold">Suivi Simplifié</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Ajoutez, modifiez et catégorisez vos transactions rapidement.
                    Gardez une vue claire de vos flux.
                  </p>
                </div>

                {/* Feature 2: Budgets */}
                <div className="flex flex-col items-center text-center p-4 sm:p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                    <Target className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="mb-2 text-lg sm:text-xl font-semibold">Budgets Intuitifs</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Créez des budgets mensuels par catégorie et suivez votre
                    progression en temps réel. Respectez vos objectifs.
                  </p>
                </div>

                {/* Feature 3: Transferts */}
                <div className="flex flex-col items-center text-center p-4 sm:p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                    <ArrowRightLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="mb-2 text-lg sm:text-xl font-semibold">Transferts Faciles</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Transférez de l&apos;argent entre vos comptes en une seule
                    opération, vos soldes sont mis à jour automatiquement.
                  </p>
                </div>

                {/* Feature 4: Rapports */}
                <div className="flex flex-col items-center text-center p-4 sm:p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                    <PieChart className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="mb-2 text-lg sm:text-xl font-semibold">Rapports Visuels</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Visualisez la répartition de vos dépenses par catégorie grâce
                    à des graphiques clairs et interactifs.
                  </p>
                </div>
              </div>

              {/* Appel à l'action secondaire */}
              <div className="mt-12 sm:mt-16 text-center">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link 
                    href={session ? "/dashboard" : "#"} 
                    onClick={!session ? () => signIn('google', { callbackUrl: '/dashboard' }) : undefined}
                  >
                    {session ? `Retourner à l&apos;App` : "Commencer gratuitement"}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Section Footer */}
      <footer className="relative z-30 bg-background border-t mt-auto py-6 md:py-8">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>
            © {new Date().getFullYear()} FinanceAI. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
} 

// NOTE: Landing page implémentée ici (src/app/page.tsx) au lieu de (marketing)/page.tsx
// à cause d'une erreur de build persistante "Cannot read properties of undefined (reading 'entryCSSFiles')"
// spécifique aux groupes de routes dans cette configuration Next.js (vX.Y.Z).
// À réévaluer si besoin d'un layout marketing spécifique ou après mise à jour majeure de Next.js.
// Voir commit 