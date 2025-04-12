"use client";

import Image from 'next/image';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import { LogIn, Bot, ListChecks, Target, ArrowRightLeft, PieChart } from 'lucide-react';
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4 pt-16 text-center">
      <section className="w-full max-w-3xl mb-16 sm:mb-24">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl">
          FinanceAI : <span className="block sm:inline">Maîtrisez Votre Budget</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground md:text-xl">
          Prenez enfin le contrôle de vos finances personnelles. Suivez vos
          dépenses, visualisez vos budgets et préparez sereinement votre
          avenir financier. Simple, intuitif et (bientôt !) intelligent.
        </p>

        <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
            <Button asChild size="lg">
              <Link href="/dashboard">Accéder au Tableau de Bord</Link>
            </Button>
          )}
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-4xl">
          <Image
            src="/images/financeai-screenshot-reports.png"
            alt="Capture d&apos;écran de l&apos;application FinanceAI"
            width={1200}
            height={750}
            quality={90}
            priority
            className="rounded-lg border bg-background shadow-xl"
          />
          <div className="absolute -bottom-4 -left-4 -z-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute -top-4 -right-4 -z-10 h-32 w-32 rounded-full bg-secondary/20 blur-3xl"></div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="w-full bg-muted/50 py-16 sm:py-24"> {/* Section avec fond léger et padding */}
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce dont vous avez besoin, au même endroit
          </h2>
          {/* Grille des fonctionnalités */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1: Transactions */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                <ListChecks className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Suivi Simplifié</h3>
              <p className="text-muted-foreground">
                Ajoutez, modifiez et catégorisez vos transactions rapidement.
                Gardez une vue claire de vos flux.
              </p>
            </div>

            {/* Feature 2: Budgets */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Budgets Intuitifs</h3>
              <p className="text-muted-foreground">
                Créez des budgets mensuels par catégorie et suivez votre
                progression en temps réel. Respectez vos objectifs.
              </p>
            </div>

            {/* Feature 3: Transferts */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                <ArrowRightLeft className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Transferts Faciles</h3>
              <p className="text-muted-foreground">
                Transférez de l&apos;argent entre vos comptes en une seule
                opération, vos soldes sont mis à jour automatiquement.
              </p>
            </div>

            {/* Feature 4: Rapports */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                <PieChart className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Rapports Visuels</h3>
              <p className="text-muted-foreground">
                Visualisez la répartition de vos dépenses par catégorie grâce
                à des graphiques clairs et interactifs.
              </p>
            </div>
          </div>

          {/* Appel à l'action secondaire */}
          <div className="mt-16 text-center">
            <Button size="lg" asChild>
              <Link 
                href={session ? "/dashboard" : "#"} 
                onClick={!session ? () => signIn('google', { callbackUrl: '/dashboard' }) : undefined}
              >
                {session ? `Retourner à l\u0027App` : "Commencer gratuitement"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      {/* FIN Section Fonctionnalités */}
    </div>
  );
} 

// NOTE: Landing page implémentée ici (src/app/page.tsx) au lieu de (marketing)/page.tsx
// à cause d'une erreur de build persistante "Cannot read properties of undefined (reading 'entryCSSFiles')"
// spécifique aux groupes de routes dans cette configuration Next.js (vX.Y.Z).
// À réévaluer si besoin d'un layout marketing spécifique ou après mise à jour majeure de Next.js.
// Voir commit 