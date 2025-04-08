import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Chemin du script
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lire les variables d'environnement depuis .env.local
let DATABASE_URL;
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const matches = envFile.match(/DATABASE_URL=(.+)/);
  if (matches && matches[1]) {
    DATABASE_URL = matches[1];
  }
} catch (err) {
  console.log('Impossible de lire .env.local, cherchant .env');
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const matches = envFile.match(/DATABASE_URL=(.+)/);
    if (matches && matches[1]) {
      DATABASE_URL = matches[1];
    }
  } catch (err) {
    console.error('Impossible de lire DATABASE_URL depuis les fichiers .env');
    process.exit(1);
  }
}

// Lire le script SQL
const sqlScript = fs.readFileSync(path.join(__dirname, 'cleanup.sql'), 'utf8');

async function main() {
  console.log('Connexion à la base de données...');
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('Exécution du script de nettoyage...');
    // Diviser le script en instructions séparées et les exécuter une par une
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Exécution: ${statement}`);
      await sql.unsafe(statement);
    }
    
    console.log('Nettoyage terminé avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  } finally {
    await sql.end();
  }
}

main().catch(console.error); 