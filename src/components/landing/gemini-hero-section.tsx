"use client";

import { useRef } from "react";
import { signIn } from "next-auth/react";
import { GoogleGeminiEffect } from "../ui/google-gemini-effect";
import { Button } from "../ui/button";
import Image from "next/image";
import { Mail, MessageSquare } from "lucide-react";

export default function GeminiHeroSection() {
  const ref = useRef(null);

  return (
    <div className="h-[180vh] bg-background w-full relative overflow-clip" ref={ref}>
      {/* Animation en Fond */}
      <GoogleGeminiEffect
        pathLengths={[0.2, 0.15, 0.1, 0.05, 0]}
        className="absolute inset-0 z-0"
      />

      {/* Contenu Principal - Fixé dans la vue initiale */}
      <div className="absolute inset-x-0 top-0 h-screen z-10 flex flex-col items-center justify-center text-center p-8">
        {/* Container pour limiter la largeur du contenu */}
        <div className="w-full max-w-7xl mx-auto">
          {/* Titre avec effet de dégradé */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/50">
            FinanceAI : Maîtrisez Votre Budget
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Prenez enfin le contrôle de vos finances personnelles. Suivez vos dépenses, visualisez vos budgets et préparez sereinement votre avenir financier. Simple, intuitif et intelligent.
          </p>

          {/* Boutons Auth */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Button 
              size="lg" 
              variant="default"
              className="min-w-[200px] flex items-center gap-2"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <Mail className="h-5 w-5" />
              Continuer avec Google
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="min-w-[200px] flex items-center gap-2"
              onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
            >
              <MessageSquare className="h-5 w-5" />
              Continuer avec Discord
            </Button>
          </div>

          {/* Image Aperçu avec Container */}
          <div className="w-full max-w-3xl mx-auto px-4 relative mt-12">
            {/* Container de l'image avec effets */}
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent z-10" />
              
              {/* Bordure lumineuse */}
              <div className="absolute inset-0 rounded-xl border border-border/20 z-20" />
              
              {/* Image */}
              <Image
                src="/images/dashboard-preview.png"
                alt="Aperçu du tableau de bord FinanceAI - Interface moderne avec statistiques financières et graphiques"
                fill
                className="object-contain"
                quality={100}
                priority
              />

              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/5 to-primary/0" />
            </div>

            {/* Effet de reflet sous l'image */}
            <div className="absolute -bottom-1/2 left-0 right-0 h-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
} 