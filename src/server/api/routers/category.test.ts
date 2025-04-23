import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type InferSelectModel } from 'drizzle-orm'; 
import { type categories } from '~/server/db/schema'; // Import des tables du schéma

// --- Mock des Variables d'Environnement ---
vi.mock('~/env.js', () => ({
  env: {
    GROQ_API_KEY: 'MOCK_GROQ_API_KEY',
    // Ajout d'autres variables d'environnement si nécessaire
    DATABASE_URL: 'MOCK_DB_URL',
    NEXTAUTH_SECRET: 'MOCK_SECRET',
  },
}));

// --- Mock du client Groq ---
vi.mock('groq-sdk', () => {
  const Groq = vi.fn().mockImplementation(() => ({
    // Ajoutez ici les méthodes que vous utilisez du client Groq
    // Par exemple, si vous utilisez chat.completions.create :
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock response' } }]
        })
      }
    }
  }));
  
  return {
    default: Groq
  };
});

// --- Mock de revalidatePath de Next.js ---
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn().mockImplementation(() => {
    // Ne rien faire dans les tests
    return Promise.resolve();
  }),
}));

// Définir le type Category à partir du schéma Drizzle
type Category = InferSelectModel<typeof categories>;

// --- Mock de la Base de Données (Drizzle) ---
// Déplacer les mock functions à l'intérieur de la factory vi.mock
vi.mock('~/server/db', () => {
  // Définir les fonctions mock à l'intérieur de la factory
  const mockCategoryInsertReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockCategoryInsertReturning });
  const mockCategoryInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockFindFirst = vi.fn().mockResolvedValue(null); // Retourne null par défaut pour simuler qu'aucune catégorie n'existe
  
  // Retourner un objet avec db et les mocks exportés
  return {
    db: {
      insert: mockCategoryInsert,
      query: {
        categories: {
          findFirst: mockFindFirst
        }
      },
      schema: {
        categories: {}, // Table factice
      }
    },
    // Exporter les mocks pour pouvoir les utiliser dans les tests
    mockCategoryInsertReturning_EXPORTED: mockCategoryInsertReturning,
    mockCategoryInsert_EXPORTED: mockCategoryInsert,
    mockValues_EXPORTED: mockValues,
    mockFindFirst_EXPORTED: mockFindFirst,
  };
});

// --- Mock de l'Authentification ---
const mockUserId = 'user_test_123'; // Un ID utilisateur factice
const mockSession = {
  user: { id: mockUserId, name: 'Test User', email: 'test@example.com' },
  expires: new Date(Date.now() + 86400 * 1000).toISOString(), // Session valide 1 jour
};

// Mocker complètement auth sans importer le module original
vi.mock('~/server/auth', () => {
  return {
    auth: vi.fn(() => Promise.resolve(mockSession)),
    getServerSession: vi.fn(() => Promise.resolve(mockSession)),
  };
});

// Mock next-auth directement si ton code l'importe
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve(mockSession)),
}));

// --- Reset Mocks Avant Chaque Test ---
beforeEach(() => {
  vi.clearAllMocks(); // Réinitialise les compteurs d'appels etc.
});

// --- Importer les mocks exportés du module mocké ---
import { appRouter } from '~/server/api/root'; // Importe ton routeur principal
import { createCallerFactory } from '~/server/api/trpc'; // Importe le factory
import { type categoryRouter } from '~/server/api/routers/category'; // Importe le type du routeur spécifique

// Récupérer les mocks exportés
const dbModule = await vi.importMock<any>('~/server/db');
const mockDb = dbModule.db;
const mockCategoryInsertReturning_EXPORTED = dbModule.mockCategoryInsertReturning_EXPORTED;
const mockCategoryInsert_EXPORTED = dbModule.mockCategoryInsert_EXPORTED;
const mockValues_EXPORTED = dbModule.mockValues_EXPORTED;
const mockFindFirst_EXPORTED = dbModule.mockFindFirst_EXPORTED;

// Crée un caller pour appeler les procédures tRPC dans les tests
const createCaller = createCallerFactory(appRouter);

// Simule le contexte tRPC (session mockée, db mockée)
const mockCtx = {
  session: mockSession, // Utilise la session mockée
  db: mockDb, // Utilise la DB mockée directement
  headers: new Headers(),
};

// Crée le caller avec le contexte mocké
const caller = createCaller(mockCtx);

// --- Tests pour le routeur 'category' ---
describe('Category Router', () => {

  describe('create procedure', () => {
    it('should create a new category successfully', async () => {
      // 1. Arrange
      const inputData = {
        name: 'Nouvelle Catégorie',
        icon: '🚀',
        color: '#aabbcc',
      };
      const expectedDbInput = {
        ...inputData,
        userId: mockUserId, // Doit inclure l'userId de la session mockée
      };
      const mockReturnedCategory: Category = { // Crée une catégorie factice retournée par la DB
        id: 'cat_test_789',
        ...expectedDbInput,
        createdAt: new Date(),
        updatedAt: null,
      };

      // Configure le mock de la DB pour retourner la catégorie factice
      mockCategoryInsertReturning_EXPORTED.mockResolvedValueOnce([mockReturnedCategory]); // .returning() retourne un tableau

      // 2. Act
      const result = await caller.category.create(inputData);

      // 3. Assert
      // Vérifie que db.insert(...).values(...).returning() a été appelé avec les bonnes données
      expect(mockCategoryInsert_EXPORTED).toHaveBeenCalledOnce();
      expect(mockValues_EXPORTED).toHaveBeenCalledWith(expectedDbInput);
      expect(mockCategoryInsertReturning_EXPORTED).toHaveBeenCalledOnce();

      // Vérifie que le résultat retourné par la procédure est correct
      expect(result).toEqual(mockReturnedCategory);
    });

    it('should use default icon and color if not provided', async () => {
      // 1. Arrange
      const inputData = { name: 'Catégorie Simple' }; // Sans icon/color
      const expectedDbInput = {
        name: 'Catégorie Simple',
        userId: mockUserId,
        icon: undefined,
        color: undefined,
      };
      const mockReturnedCategory: Category = {
        id: 'cat_test_999',
        name: 'Catégorie Simple',
        userId: mockUserId,
        icon: '💡', // Valeur par défaut de la DB
        color: '#ffffff', // Valeur par défaut de la DB
        createdAt: new Date(),
        updatedAt: null,
      };
      mockCategoryInsertReturning_EXPORTED.mockResolvedValueOnce([mockReturnedCategory]);

      // 2. Act
      const result = await caller.category.create(inputData);

      // 3. Assert
      expect(mockCategoryInsert_EXPORTED).toHaveBeenCalledOnce();
      expect(mockValues_EXPORTED).toHaveBeenCalledWith(expectedDbInput);
      expect(result).toEqual(mockReturnedCategory);
    });

    // Optionnel : Test d'échec si pas de session (si applicable)
    // it('should throw an error if user is not authenticated', async () => {
    //   // Arrange: Crée un caller avec une session null
    //   const unauthenticatedCaller = createCaller({ ...mockCtx, session: null });
    //   const inputData = { name: 'Test Auth' };
    //
    //   // Act & Assert
    //   await expect(unauthenticatedCaller.category.create(inputData))
    //     .rejects.toThrow(/UNAUTHORIZED/); // Vérifie le type/message d'erreur tRPC
    // });

  }); // Fin describe 'create procedure'

  // --- Ajoute des describe pour 'update', 'delete', 'list' ici plus tard ---

}); // Fin describe 'Category Router' 