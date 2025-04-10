import NextAuth from "next-auth";
// Importer la config depuis le fichier existant
import { authConfig } from "./auth/config";

// Appeler NextAuth ici et exporter les éléments nécessaires
export const {
  handlers, // Exporte l'objet contenant GET et POST
  auth,     // Exporte la fonction pour récupérer la session serveur
  signIn,   // Exporte signIn si besoin ailleurs
  signOut,  // Exporte signOut si besoin ailleurs
} = NextAuth(authConfig);

/**
 * Wrapper pour `auth` pour récupérer la session serveur.
 * Recommandé par T3 pour éviter les erreurs avec les edge runtimes.
 * @see https://next-auth.js.org/deployment#vercel
 */
// export const getServerAuthSession = () => auth(); // Décommenter si nécessaire 