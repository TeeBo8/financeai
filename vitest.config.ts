import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      'next/server': resolve(__dirname, 'node_modules/next/dist/server/server.js'),
    },
  },
  test: {
    globals: true, // Pour pouvoir utiliser describe, it, expect sans imports
    environment: 'jsdom', // Environnement simulant un navigateur (utile pour tester des composants React plus tard)
    setupFiles: './vitest.setup.ts', // Optionnel: Fichier pour setup global (on le créera si besoin)
    include: ['src/**/*.test.{ts,tsx}'], // Pattern pour trouver les fichiers de test
    // La configuration UI est désactivée en attendant de résoudre le problème de typage
    ui: false,
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/finance_ai_test",
      NODE_ENV: "test",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "test-secret"
    },
    
    // Configuration de la couverture de code
    coverage: {
      provider: 'v8', // Utiliser le provider V8
      reporter: ['text', 'json', 'html'], // Formats de rapport souhaités
      // Optionnel: Spécifier quels fichiers inclure/exclure de la couverture
      include: ['src/lib/**/*.{ts,tsx}', 'src/server/api/**/*.{ts,tsx}'], // Ex: Couvrir libs et API server
      exclude: [ // Exclure les fichiers non pertinents pour la couverture unitaire
          'src/**/*.test.{ts,tsx}', // Exclure les fichiers de test eux-mêmes
          'src/server/db/schema.ts', // Ex: Exclure le schéma Drizzle (testé indirectement)
          'src/env.js', // Ex: Fichier d'env
          'src/app/**/*', // Ex: Le dossier app (sera testé via E2E plus tard)
          'src/components/ui/**/*', // Ex: Composants shadcn/ui non modifiés
          'vitest.config.ts',
          'vitest.setup.ts',
          // Ajoute d'autres patterns si nécessaire
      ],
      // Optionnel: Définir des seuils minimaux (fait échouer si non atteint)
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },
  },
}); 