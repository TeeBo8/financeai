import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Charger les variables d'environnement
try {
  // Essayer d'abord .env.local
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('Variables d\'environnement chargées depuis .env.local');
  } else {
    // Sinon essayer .env
    dotenv.config();
    console.log('Variables d\'environnement chargées depuis .env');
  }
} catch (error) {
  console.error('Erreur lors du chargement des variables d\'environnement:', error);
}

// Vérifier que DATABASE_URL est défini
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL n\'est pas défini dans les variables d\'environnement');
  process.exit(1);
}

async function main() {
  console.log('Connexion à la base de données...');
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('Récupération de toutes les tables...');
    const tables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' AND tablename LIKE 'finance-ai_%'
    `;
    
    if (tables.length === 0) {
      console.log('Aucune table à supprimer.');
      return;
    }
    
    console.log(`Tables à supprimer: ${tables.map(t => t.tablename).join(', ')}`);
    
    // Désactiver les contraintes de clé étrangère temporairement
    await sql`SET session_replication_role = 'replica';`;
    
    // Supprimer toutes les tables
    for (const { tablename } of tables) {
      console.log(`Suppression de la table: ${tablename}`);
      await sql`DROP TABLE IF EXISTS ${sql(tablename)} CASCADE;`;
    }
    
    // Réactiver les contraintes
    await sql`SET session_replication_role = 'origin';`;
    
    console.log('Toutes les tables ont été supprimées avec succès!');
  } catch (error) {
    console.error('Erreur lors de la suppression des tables:', error);
  } finally {
    await sql.end();
  }
}

main().catch(console.error); 