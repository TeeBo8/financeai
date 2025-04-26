"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, Bot, ListChecks, Target, ArrowRightLeft, PieChart, Rocket, Landmark } from 'lucide-react';
import { useSession, signIn } from "next-auth/react";
import { FaGoogle, FaDiscord } from 'react-icons/fa';
import Particles from '../components/ui/particles';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between w-full px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-amber-200 dark:text-amber-200" />
            <span className="font-bold text-lg text-stone-900 dark:text-amber-50">Finance AI</span>
          </Link>

          {!session && (
            <Button variant="ghost" size="sm" className="text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-amber-50" asChild>
              <Link href="/api/auth/signin">
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Link>
            </Button>
          )}
        </div>
      </header>

      <Particles
        className="absolute inset-0 -z-10"
        quantity={150}
        staticity={50}
        ease={100}
      />

      <main className="flex-1">
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center py-16 lg:py-24">
          <div className="container flex max-w-[64rem] flex-col items-center justify-center gap-4 text-center px-4">
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl mx-auto max-w-3xl text-stone-900 dark:text-amber-50">
              Gérez vos finances avec l&apos;aide de l&apos;IA
              <Rocket className="inline-block ml-2 md:ml-3 h-7 w-7 md:h-8 md:w-8 text-amber-600 dark:text-amber-200 align-middle" />
            </h1>
            <p className="max-w-[42rem] leading-normal text-stone-700 dark:text-stone-300 sm:text-xl sm:leading-8 mb-10 mx-auto">
              Simplifiez votre gestion financière avec notre assistant IA. Suivez vos dépenses, définissez des objectifs et prenez de meilleures décisions financières.
            </p>
            {!session ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xl mx-auto">
                <Button
                  variant="default"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                >
                  <FaGoogle className="h-5 w-5" />
                  Continuer avec Google
                </Button>
                <Button
                  variant="secondary"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
                >
                  <FaDiscord className="h-5 w-5" />
                  Continuer avec Discord
                </Button>
              </div>
            ) : (
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 mx-auto"
              >
                Accéder à mon compte
              </Link>
            )}
          </div>
        </section>

        <section className="w-full py-12 md:py-16 bg-background/50 backdrop-blur-sm relative z-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
              <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl text-stone-900 dark:text-amber-50">
                Fonctionnalités
              </h2>
              <p className="max-w-[85%] leading-normal text-stone-700 dark:text-stone-300 sm:text-lg sm:leading-7">
                Découvrez comment Finance AI peut vous aider à mieux gérer votre argent.
              </p>
            </div>

            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
              <div className="relative overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <ListChecks className="h-12 w-12 text-amber-600 dark:text-amber-200" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-stone-900 dark:text-amber-100">Suivi des dépenses</h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      Ajoutez et catégorisez vos transactions. L&apos;IA vous aide à classer et les récurrentes sont gérées pour vous.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Target className="h-12 w-12 text-amber-600 dark:text-amber-200" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-stone-900 dark:text-amber-100">Objectifs d&apos;épargne</h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      Définissez et suivez vos objectifs financiers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <ArrowRightLeft className="h-12 w-12 text-amber-600 dark:text-amber-200" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-stone-900 dark:text-amber-100">Transactions récurrentes</h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      Gérez vos revenus et dépenses récurrents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <PieChart className="h-12 w-12 text-amber-600 dark:text-amber-200" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-stone-900 dark:text-amber-100">Rapports détaillés</h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      Visualisez vos finances avec des graphiques clairs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Bot className="h-12 w-12 text-amber-600 dark:text-amber-200" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-stone-900 dark:text-amber-100">Assistant IA</h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      Profitez de l&apos;aide de l&apos;IA pour la gestion (suggestions de catégorie et plus à venir).
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-2">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Rocket className="h-12 w-12 text-amber-600 dark:text-amber-200" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-stone-900 dark:text-amber-100">Multi-comptes</h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      Gérez tous vos comptes au même endroit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Section Footer */}
      <footer className="relative z-30 bg-background border-t border-stone-200 dark:border-stone-800 mt-auto py-3">
        <div className="container mx-auto text-center">
          <p className="text-sm text-stone-600 dark:text-stone-400">
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