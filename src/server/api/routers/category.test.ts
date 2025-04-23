import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type InferSelectModel, and, eq } from 'drizzle-orm'; 
import { categories } from '~/server/db/schema'; // Import des tables du schéma
import { pgTable, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { mockDeep } from 'vitest-mock-extended';
import { type Session } from 'next-auth';
import { 
  mockCategoryUpdate,
  mockCategoryUpdateSet,
  mockCategoryUpdateWhere,
  mockCategoryUpdateReturning 
} from './__mocks__/category.mocks';
import { appRouter } from '~/server/api/root';
import { createCallerFactory } from '~/server/api/trpc';
import { type categoryRouter } from '~/server/api/routers/category';

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

// Définir le type Category basé sur le schéma
type Category = InferSelectModel<typeof categories>;

// --- Mock de la Base de Données (Drizzle) ---
// Déplacer les mock functions à l'intérieur de la factory vi.mock
vi.mock('~/server/db', () => {
  // --- Mocks pour l'opération CREATE ---
  // Simule la chaîne d'appels db.insert().values().returning()
  const mockCategoryInsertReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockCategoryInsertReturning });
  const mockCategoryInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockFindFirst = vi.fn().mockResolvedValue(null);
  
  // --- Mocks pour l'opération UPDATE ---
  // Simule la chaîne d'appels db.update().set().where().returning()
  const mockCategoryUpdateReturning = vi.fn().mockImplementation(() => {
    return {
      id: 'test-category-id',
      userId: 'user_test_123',
      name: 'Updated Category',
      icon: '🎯',
      color: '#00ff00',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const mockCategoryUpdateWhere = vi.fn().mockImplementation(() => ({
    returning: mockCategoryUpdateReturning,
  }));

  const mockCategoryUpdateSet = vi.fn().mockImplementation(() => ({
    where: mockCategoryUpdateWhere,
  }));

  const mockCategoryUpdate = vi.fn().mockImplementation((table) => {
    if (table === categories) {
      return {
        set: mockCategoryUpdateSet,
      };
    }
    return {};
  });
  
  // --- Mocks pour l'opération DELETE ---
  // Simule la chaîne d'appels db.delete().where().returning()
  const mockCategoryDeleteReturning = vi.fn();
  const mockCategoryDeleteWhere = vi.fn(() => ({ returning: mockCategoryDeleteReturning }));
  const mockCategoryDelete = vi.fn(() => ({ where: mockCategoryDeleteWhere }));
  
  // --- Mock pour l'opération READ (findMany) ---
  // Simule db.query.categories.findMany()
  const mockCategoryFindMany = vi.fn();
  
  // Export des mocks pour les tests
  const mocks = {
    categoryUpdate: mockCategoryUpdate,
    categoryUpdateSet: mockCategoryUpdateSet,
    categoryUpdateWhere: mockCategoryUpdateWhere,
    categoryUpdateReturning: mockCategoryUpdateReturning,
  };

  // Retourner un objet avec db et les mocks exportés
  return {
    db: {
      insert: mockCategoryInsert,
      update: mocks.categoryUpdate,
      delete: mockCategoryDelete,
      query: {
        categories: {
          findFirst: mockFindFirst,
          findMany: mockCategoryFindMany
        }
      },
      schema: {
        categories,
      }
    },
    // Exporter les mocks pour pouvoir les utiliser dans les tests
    mockCategoryInsertReturning_EXPORTED: mockCategoryInsertReturning,
    mockCategoryInsert_EXPORTED: mockCategoryInsert,
    mockValues_EXPORTED: mockValues,
    mockFindFirst_EXPORTED: mockFindFirst,
    mockCategoryUpdateReturning_EXPORTED: mockCategoryUpdateReturning,
    mockCategoryUpdateSet_EXPORTED: mockCategoryUpdateSet,
    mockCategoryUpdateWhere_EXPORTED: mockCategoryUpdateWhere,
    mockCategoryDeleteReturning_EXPORTED: mockCategoryDeleteReturning,
    mockCategoryDeleteWhere_EXPORTED: mockCategoryDeleteWhere,
    mockCategoryDelete_EXPORTED: mockCategoryDelete,
    mockCategoryFindMany_EXPORTED: mockCategoryFindMany,
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

// Récupérer les mocks exportés
const dbModule = await vi.importMock<any>('~/server/db');
const mockDb = dbModule.db;
const mockCategoryInsertReturning_EXPORTED = dbModule.mockCategoryInsertReturning_EXPORTED;
const mockCategoryInsert_EXPORTED = dbModule.mockCategoryInsert_EXPORTED;
const mockValues_EXPORTED = dbModule.mockValues_EXPORTED;
const mockFindFirst_EXPORTED = dbModule.mockFindFirst_EXPORTED;
const mockCategoryUpdateReturning_EXPORTED = dbModule.mockCategoryUpdateReturning_EXPORTED;
const mockCategoryUpdateSet_EXPORTED = dbModule.mockCategoryUpdateSet_EXPORTED;
const mockCategoryUpdateWhere_EXPORTED = dbModule.mockCategoryUpdateWhere_EXPORTED;
const mockCategoryDeleteReturning_EXPORTED = dbModule.mockCategoryDeleteReturning_EXPORTED;
const mockCategoryDeleteWhere_EXPORTED = dbModule.mockCategoryDeleteWhere_EXPORTED;
const mockCategoryDelete_EXPORTED = dbModule.mockCategoryDelete_EXPORTED;
const mockCategoryFindMany_EXPORTED = dbModule.mockCategoryFindMany_EXPORTED;

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
      // 1. Arrange : Prépare les données d'entrée et configure les mocks
      const inputData = {
        name: 'Nouvelle Catégorie',
        icon: '🚀',
        color: '#aabbcc',
      };
      // Ajoute l'userId aux données attendues par la DB
      const expectedDbInput = {
        ...inputData,
        userId: mockUserId,
      };
      // Simule la réponse de la DB avec un ID et des timestamps
      const mockReturnedCategory: Category = {
        id: 'cat_test_789',
        ...expectedDbInput,
        createdAt: new Date(),
        updatedAt: null,
      };

      // Configure le mock pour simuler l'insertion en DB
      mockCategoryInsertReturning_EXPORTED.mockResolvedValueOnce([mockReturnedCategory]);

      // 2. Act : Exécute la procédure create
      const result = await caller.category.create(inputData);

      // 3. Assert : Vérifie que la DB a été appelée correctement
      expect(mockCategoryInsert_EXPORTED).toHaveBeenCalledOnce();
      expect(mockValues_EXPORTED).toHaveBeenCalledWith(expectedDbInput);
      expect(mockCategoryInsertReturning_EXPORTED).toHaveBeenCalledOnce();
      expect(result).toEqual(mockReturnedCategory);
    });

    it('should use default icon and color if not provided', async () => {
      // 1. Arrange : Test avec seulement le nom obligatoire
      const inputData = { name: 'Catégorie Simple' };
      const expectedDbInput = {
        name: 'Catégorie Simple',
        userId: mockUserId,
        icon: undefined,
        color: undefined,
      };
      // Simule la réponse de la DB avec des valeurs par défaut
      const mockReturnedCategory: Category = {
        id: 'cat_test_999',
        name: 'Catégorie Simple',
        userId: mockUserId,
        icon: '💡',
        color: '#ffffff',
        createdAt: new Date(),
        updatedAt: null,
      };
      mockCategoryInsertReturning_EXPORTED.mockResolvedValueOnce([mockReturnedCategory]);

      // 2. Act
      const result = await caller.category.create(inputData);

      // 3. Assert : Vérifie que la DB utilise bien les valeurs par défaut
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

  describe('update procedure', () => {
    it('should update an existing category', async () => {
      // 1. Arrange : Configure le mock pour simuler une mise à jour réussie
      mockCategoryUpdateReturning_EXPORTED.mockResolvedValueOnce([{
        id: 'test-category-id',
        userId: 'user_test_123',
        name: 'Updated Category',
        icon: '🎯',
        color: '#00ff00',
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);

      // 2. Act : Exécute la procédure update avec tous les champs
      const result = await caller.category.update({
        id: 'test-category-id',
        name: 'Updated Category',
        icon: '🎯',
        color: '#00ff00',
      });

      // 3. Assert : Vérifie la chaîne d'appels update().set().where()
      expect(mockCategoryUpdateSet_EXPORTED).toHaveBeenCalledWith({
        name: 'Updated Category',
        icon: '🎯',
        color: '#00ff00',
        updatedAt: expect.any(Date),
      });

      // Vérifie que la clause WHERE inclut l'ID et l'userId pour la sécurité
      expect(mockCategoryUpdateWhere_EXPORTED).toHaveBeenCalledWith(
        and(
          eq(categories.id, 'test-category-id'),
          eq(categories.userId, 'user_test_123')
        )
      );

      expect(result).toEqual({
        id: 'test-category-id',
        userId: 'user_test_123',
        name: 'Updated Category',
        icon: '🎯',
        color: '#00ff00',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should update only provided fields', async () => {
      // 1. Arrange : Configure le mock pour une mise à jour partielle
      mockCategoryUpdateReturning_EXPORTED.mockResolvedValueOnce([{
        id: 'test-category-id',
        userId: 'user_test_123',
        name: 'Updated Name Only',
        icon: '🎯',
        color: '#00ff00',
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);

      // 2. Act : Mise à jour avec seulement le nom
      await caller.category.update({
        id: 'test-category-id',
        name: 'Updated Name Only',
      });

      // 3. Assert : Vérifie que seuls les champs fournis sont mis à jour
      expect(mockCategoryUpdateSet_EXPORTED).toHaveBeenCalledWith({
        name: 'Updated Name Only',
        updatedAt: expect.any(Date),
      });
    });

    it('should throw an error if category is not found or not owned by user', async () => {
      // 1. Arrange : Simule une catégorie non trouvée
      mockCategoryUpdateReturning_EXPORTED.mockResolvedValueOnce([]);

      // 2. Act & Assert : Vérifie que l'erreur est levée
      await expect(
        caller.category.update({
          id: 'non-existent-id',
          name: 'Test',
        })
      ).rejects.toThrow('Catégorie non trouvée ou non modifiable.');
    });

  }); // Fin describe 'update procedure'

  describe('delete procedure', () => {
    it('should delete an existing category successfully', async () => {
      // 1. Arrange : Configure le mock pour simuler une suppression réussie
      const categoryIdToDelete = 'cat_to_delete_123';
      const inputData = { id: categoryIdToDelete };
      const mockReturnedDeletedCategory = {
        deletedId: categoryIdToDelete
      };

      mockCategoryDeleteReturning_EXPORTED.mockResolvedValueOnce([mockReturnedDeletedCategory]);

      // 2. Act : Exécute la procédure delete
      const result = await caller.category.delete(inputData);

      // 3. Assert : Vérifie la chaîne d'appels delete().where()
      expect(mockCategoryDelete_EXPORTED).toHaveBeenCalledWith(expect.anything());
      expect(mockCategoryDeleteWhere_EXPORTED).toHaveBeenCalledWith(
        and(
          eq(categories.id, categoryIdToDelete),
          eq(categories.userId, mockUserId)
        )
      );
      expect(mockCategoryDeleteReturning_EXPORTED).toHaveBeenCalledOnce();
      expect(result).toEqual({
        success: true,
        deletedId: categoryIdToDelete
      });
    });

    it('should throw an error if category to delete is not found or not owned', async () => {
      // 1. Arrange : Simule une catégorie non trouvée
      mockCategoryDeleteReturning_EXPORTED.mockResolvedValueOnce([]);

      // 2. Act & Assert : Vérifie que l'erreur est levée
      await expect(caller.category.delete({ id: 'cat_delete_not_found_456' }))
        .rejects.toThrow("Catégorie non trouvée ou non supprimable.");
    });
  });

  describe('list procedure', () => {
    it('should return a list of categories for the authenticated user', async () => {
      // 1. Arrange : Prépare une liste de catégories mockée
      const mockReturnedCategories: Category[] = [
        { 
          id: 'cat_1', 
          userId: mockUserId, 
          name: 'Catégorie 1', 
          icon: '1️⃣', 
          color: '#111111', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        { 
          id: 'cat_2', 
          userId: mockUserId, 
          name: 'Catégorie 2', 
          icon: '2️⃣', 
          color: '#222222', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
      ];

      // Configure le mock pour retourner la liste
      mockCategoryFindMany_EXPORTED.mockResolvedValueOnce(mockReturnedCategories);

      // 2. Act : Récupère la liste des catégories
      const result = await caller.category.getAll();

      // 3. Assert : Vérifie l'appel à findMany et le résultat
      expect(mockCategoryFindMany_EXPORTED).toHaveBeenCalledOnce();
      expect(mockCategoryFindMany_EXPORTED).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything()
        })
      );
      expect(result).toEqual(mockReturnedCategories);
    });

    it('should return an empty list if the user has no categories', async () => {
      // 1. Arrange : Simule aucune catégorie trouvée
      mockCategoryFindMany_EXPORTED.mockResolvedValueOnce([]);

      // 2. Act : Récupère la liste des catégories
      const result = await caller.category.getAll();

      // 3. Assert : Vérifie que le résultat est un tableau vide
      expect(mockCategoryFindMany_EXPORTED).toHaveBeenCalledOnce();
      expect(result).toEqual([]);
    });
  });

}); // Fin describe 'Category Router' 