import NextAuth from "next-auth";
import { authConfig } from "./config";

// Cette construction est compatible avec la v5 beta de NextAuth
// et exporte les fonctions nécessaires pour l'authentification
export const { auth, signIn, signOut } = NextAuth(authConfig);
