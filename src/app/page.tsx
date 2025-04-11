"use client";

import Image from 'next/image';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import { LogIn, Bot } from 'lucide-react';
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <section className="w-full max-w-3xl">
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
            alt="Capture d'écran de l'application FinanceAI"
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
    </div>
  );
}
