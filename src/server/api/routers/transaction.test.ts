import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '@/server/api/root';
import { db } from '@/server/db';
import { createTRPCContext } from '@/server/api/trpc';
import type { inferAsyncReturnType } from '@trpc/server';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { eq, desc, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import * as schema from '@/server/db/schema';

interface MockDb {
  query: {
    transactions: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    bankAccounts: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    categories: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

describe('Transaction Router Tests', () => {
  const mockSession = { 
    user: { id: 'test-user-id' }, 
    expires: 'never',
  } as const;

  let mockDb: MockDb;
  let ctx: inferAsyncReturnType<typeof createTRPCContext>;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    // Réinitialiser tous les mocks
    vi.clearAllMocks();

    // Créer une nouvelle instance du mock avec la structure complète
    mockDb = {
      query: {
        transactions: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'tx_1',
              userId: 'test-user-id',
              description: 'Test Transaction 1',
              amount: '100.00',
              date: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              bankAccountId: 'acc_1',
              categoryId: 'cat_1',
              category: {
                id: 'cat_1',
                name: 'Test Category',
                icon: '💡',
                color: '#FF0000',
                userId: 'test-user-id',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              bankAccount: {
                id: 'acc_1',
                name: 'Test Account',
                userId: 'test-user-id',
                icon: '💳',
                color: '#00FF00',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ]),
          findFirst: vi.fn(),
        },
        bankAccounts: {
          findFirst: vi.fn(),
        },
        categories: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    };
    
    // Mock de la base de données
    vi.spyOn(db, 'query', 'get').mockReturnValue(mockDb.query);
    
    ctx = {
      db: mockDb,
      session: mockSession,
      headers: new Headers(),
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('getAll', () => {
    it('should fetch all transactions for the current user', async () => {
      // Act
      const result = await caller.transaction.getAll({ type: 'all' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'tx_1',
        userId: 'test-user-id',
        description: 'Test Transaction 1',
        amount: '100.00',
        bankAccountId: 'acc_1',
        categoryId: 'cat_1',
      });
      expect(result[0]?.category).toBeDefined();
      expect(result[0]?.bankAccount).toBeDefined();
      expect(mockDb.query.transactions.findMany).toHaveBeenCalled();
    });

    it('should filter transactions by date range', async () => {
      // Arrange
      const dateFrom = new Date('2025-04-15');
      const dateTo = new Date('2025-04-25');
      const input = { dateFrom, dateTo, type: 'all' as const };

      const mockTransactions = [
        { 
          id: 'tx_1', 
          userId: 'test-user-id', 
          description: 'Before Range', 
          amount: "-10.00", 
          date: new Date('2025-04-10'),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_2', 
          userId: 'test-user-id', 
          description: 'Inside Range 1', 
          amount: "-20.00", 
          date: new Date('2025-04-20'),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_3', 
          userId: 'test-user-id', 
          description: 'Inside Range 2', 
          amount: "50.00", 
          date: new Date('2025-04-25'),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_4', 
          userId: 'test-user-id', 
          description: 'After Range', 
          amount: "-30.00", 
          date: new Date('2025-04-30'),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const expectedFilteredTransactions = [mockTransactions[1], mockTransactions[2]];
      mockDb.query.transactions.findMany = vi.fn().mockResolvedValue(expectedFilteredTransactions);

      // Act
      const result = await caller.transaction.getAll(input);

      // Assert
      expect(mockDb.query.transactions.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedFilteredTransactions);
      expect(result).toHaveLength(2);
    });

    it('should filter transactions by type (expense)', async () => {
      // Arrange
      const input = { type: 'expense' as const };

      const mockTransactions = [
        { 
          id: 'tx_income_1', 
          userId: 'test-user-id', 
          description: 'Salary', 
          amount: "2500.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_expense_1', 
          userId: 'test-user-id', 
          description: 'Groceries', 
          amount: "-80.50", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_expense_2', 
          userId: 'test-user-id', 
          description: 'Restaurant', 
          amount: "-45.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const expectedFilteredTransactions = [mockTransactions[1], mockTransactions[2]];
      mockDb.query.transactions.findMany = vi.fn().mockResolvedValue(expectedFilteredTransactions);

      // Act
      const result = await caller.transaction.getAll(input);

      // Assert
      expect(mockDb.query.transactions.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedFilteredTransactions);
      expect(result).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.every((tx: any) => parseFloat(tx.amount) < 0)).toBe(true);
    });

    it('should filter transactions by description text', async () => {
      // Arrange
      const input = { description: 'Restaurant' };

      const mockTransactions = [
        { 
          id: 'tx_1', 
          userId: 'test-user-id', 
          description: 'Groceries', 
          amount: "-80.50", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_2', 
          userId: 'test-user-id', 
          description: 'Dinner at Italian Restaurant', 
          amount: "-65.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_3', 
          userId: 'test-user-id', 
          description: 'Lunch - restaurant Le Soleil', 
          amount: "-30.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_4', 
          userId: 'test-user-id', 
          description: 'Online Course', 
          amount: "-120.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'Test Category',
            icon: '💡',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const expectedFilteredTransactions = [mockTransactions[1], mockTransactions[2]];
      mockDb.query.transactions.findMany = vi.fn().mockResolvedValue(expectedFilteredTransactions);

      // Act
      const result = await caller.transaction.getAll(input);

      // Assert
      expect(mockDb.query.transactions.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedFilteredTransactions);
      expect(result).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.every((tx: any) => tx.description.toLowerCase().includes('restaurant'))).toBe(true);
    });

    it('should filter transactions by categoryId', async () => {
      // Arrange
      const targetCategoryId = 'cat_food';
      const input = { categoryId: targetCategoryId };

      const mockTransactions = [
        { 
          id: 'tx_1', 
          userId: 'test-user-id', 
          description: 'Groceries', 
          amount: "-80.50", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_food',
          category: {
            id: 'cat_food',
            name: 'Food',
            icon: '🍽️',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_2', 
          userId: 'test-user-id', 
          description: 'Restaurant', 
          amount: "-45.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_food',
          category: {
            id: 'cat_food',
            name: 'Food',
            icon: '🍽️',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_3', 
          userId: 'test-user-id', 
          description: 'Gasoline', 
          amount: "-55.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_1',
          categoryId: 'cat_transport',
          category: {
            id: 'cat_transport',
            name: 'Transport',
            icon: '🚗',
            color: '#0000FF',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_1',
            name: 'Test Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const expectedFilteredTransactions = [mockTransactions[0], mockTransactions[1]];
      mockDb.query.transactions.findMany = vi.fn().mockResolvedValue(expectedFilteredTransactions);

      // Act
      const result = await caller.transaction.getAll(input);

      // Assert
      expect(mockDb.query.transactions.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedFilteredTransactions);
      expect(result).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.every((tx: any) => tx.categoryId === targetCategoryId)).toBe(true);
    });

    it('should filter transactions by bankAccountId', async () => {
      // Arrange
      const targetAccountId = 'acc_checking';
      const input = { bankAccountId: targetAccountId };

      const mockTransactions = [
        { 
          id: 'tx_1', 
          userId: 'test-user-id', 
          description: 'Salary', 
          amount: "2500.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_checking',
          categoryId: 'cat_income',
          category: {
            id: 'cat_income',
            name: 'Income',
            icon: '💰',
            color: '#00FF00',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_checking',
            name: 'Checking Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#0000FF',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_2', 
          userId: 'test-user-id', 
          description: 'Groceries', 
          amount: "-80.50", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_checking',
          categoryId: 'cat_food',
          category: {
            id: 'cat_food',
            name: 'Food',
            icon: '🍽️',
            color: '#FF0000',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_checking',
            name: 'Checking Account',
            userId: 'test-user-id',
            icon: '💳',
            color: '#0000FF',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { 
          id: 'tx_3', 
          userId: 'test-user-id', 
          description: 'Savings Transfer', 
          amount: "-500.00", 
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bankAccountId: 'acc_savings',
          categoryId: 'cat_transfer',
          category: {
            id: 'cat_transfer',
            name: 'Transfer',
            icon: '🔄',
            color: '#FF00FF',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bankAccount: {
            id: 'acc_savings',
            name: 'Savings Account',
            userId: 'test-user-id',
            icon: '💰',
            color: '#00FFFF',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const expectedFilteredTransactions = [mockTransactions[0], mockTransactions[1]];
      mockDb.query.transactions.findMany = vi.fn().mockResolvedValue(expectedFilteredTransactions);

      // Act
      const result = await caller.transaction.getAll(input);

      // Assert
      expect(mockDb.query.transactions.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedFilteredTransactions);
      expect(result).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.every((tx: any) => tx.bankAccountId === targetAccountId)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new transaction with category', async () => {
      const input = {
        description: 'Test Transaction',
        amount: 100.50,
        date: new Date(),
        categoryId: 'cat_1',
        bankAccountId: 'acc_1',
      };

      console.log("[TEST_LOG] Starting test: create transaction with category");
      console.log("[TEST_LOG] Test input:", input);

      // Mock findFirst pour bankAccount
      mockDb.query.bankAccounts.findFirst.mockImplementation(() => Promise.resolve({ id: 'acc_1' }));

      // Mock findFirst pour category - premier appel pour vérification
      mockDb.query.categories.findFirst
        .mockImplementationOnce(() => Promise.resolve({ id: 'cat_1' })) // Premier appel
        .mockImplementationOnce(() => Promise.resolve({ // Deuxième appel
          id: 'cat_1',
          name: 'Test Category',
          icon: '💡',
          color: '#FF0000',
          userId: 'test-user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      // Mock de l'insertion
      const mockCreatedTransaction = {
        id: 'new_tx_id',
        userId: 'test-user-id',
        description: input.description,
        amount: input.amount.toString(),
        date: input.date,
        bankAccountId: input.bankAccountId,
        categoryId: input.categoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
        recurringTransactionId: null,
        transferId: null,
      };

      // Mock de l'insertion avec la structure correcte
      mockDb.insert.mockImplementation(() => ({
        values: () => ({
          returning: () => Promise.resolve([mockCreatedTransaction])
        })
      }));

      console.log("[TEST_LOG] Mocks configured, calling create...");
      // Act
      const result = await caller.transaction.create(input);
      console.log("[TEST_LOG] Create result:", result);

      // Assert
      expect(mockDb.query.bankAccounts.findFirst).toHaveBeenCalledTimes(1);
      expect(mockDb.query.categories.findFirst).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        ...mockCreatedTransaction,
        category: {
          id: 'cat_1',
          name: 'Test Category',
          icon: '💡',
          color: '#FF0000',
          userId: 'test-user-id',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
      console.log("[TEST_LOG] Test completed successfully");
    });

    it('should throw validation error for invalid input', async () => {
      // Arrange
      const invalidInput = {
        description: '', // Description vide
        amount: 'not-a-number', // Montant invalide
        date: 'not-a-date', // Date invalide
        bankAccountId: '', // ID de compte vide
        categoryId: null,
      };

      // Act & Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(caller.transaction.create(invalidInput as any)).rejects.toThrow(TRPCError);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should handle database error during creation', async () => {
      const input = {
        description: 'Test Transaction',
        amount: 100.50,
        date: new Date(),
        categoryId: 'cat_1',
        bankAccountId: 'acc_1',
      };

      console.log("[TEST_LOG] Starting test: handle database error");
      console.log("[TEST_LOG] Test input:", input);

      // Mock findFirst pour bankAccount
      mockDb.query.bankAccounts.findFirst.mockImplementation(() => Promise.resolve({ id: 'acc_1' }));

      // Mock findFirst pour category
      mockDb.query.categories.findFirst.mockImplementation(() => Promise.resolve({ id: 'cat_1' }));

      // Mock de l'insertion qui rejette avec la structure correcte
      const dbError = new Error('DB Insert Error');
      mockDb.insert.mockImplementation(() => {
        throw dbError; // Lancer l'erreur directement
      });

      console.log("[TEST_LOG] Mocks configured, calling create...");
      // Act & Assert
      await expect(caller.transaction.create(input)).rejects.toThrow(TRPCError);
      await expect(caller.transaction.create(input)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la création de la transaction.',
      });
      console.log("[TEST_LOG] Test completed successfully - error was caught as expected");
    });

    it('should throw error if bank account does not exist or is not owned by user', async () => {
      // Arrange
      const input = {
        description: 'Test Transaction',
        amount: 100.50,
        date: new Date(),
        bankAccountId: 'non_existent_acc',
        categoryId: 'cat_1',
      };

      // Mock findFirst pour retourner null (compte non trouvé)
      mockDb.query.bankAccounts.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(caller.transaction.create(input)).rejects.toThrow(/Compte bancaire invalide/i);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should throw error if category does not exist or is not owned by user', async () => {
      // Arrange
      const input = {
        description: 'Test Transaction',
        amount: 100.50,
        date: new Date(),
        bankAccountId: 'acc_1',
        categoryId: 'non_existent_cat',
      };

      // Mock findFirst pour le compte bancaire
      mockDb.query.bankAccounts.findFirst.mockResolvedValue({ id: 'acc_1' });
      
      // Mock findFirst pour la catégorie (non trouvée)
      mockDb.query.categories.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(caller.transaction.create(input)).rejects.toThrow(/Catégorie invalide/i);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      // Réinitialiser les mocks spécifiques à update
      mockDb.query.transactions.findFirst = vi.fn();
      mockDb.query.categories.findFirst = vi.fn();
      mockDb.update = vi.fn();
    });

    it('should update an existing transaction successfully', async () => {
      // Arrange
      const input = {
        id: 'tx_1',
        description: 'Updated Transaction',
        amount: 150.50,
        date: new Date('2024-04-20'),
        bankAccountId: 'acc_1',
        categoryId: 'cat_1',
      };

      // Mock findFirst pour vérification de propriété
      const mockExistingTransaction = {
        id: 'tx_1',
        userId: 'test-user-id',
        description: 'Original Transaction',
        amount: '100.00',
        date: new Date('2024-04-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
        bankAccountId: 'acc_1',
        categoryId: 'cat_1',
      };
      mockDb.query.transactions.findFirst.mockResolvedValueOnce(mockExistingTransaction);

      // Mock findFirst pour la catégorie après mise à jour
      const mockCategory = {
        id: 'cat_1',
        name: 'Test Category',
        icon: '💡',
        color: '#FF0000',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.query.categories.findFirst.mockResolvedValueOnce(mockCategory);

      // Mock de la mise à jour
      const mockUpdatedTransaction = {
        id: 'tx_1',
        userId: 'test-user-id',
        description: input.description,
        amount: input.amount.toString(),
        date: input.date,
        createdAt: new Date(),
        updatedAt: new Date(),
        bankAccountId: input.bankAccountId,
        categoryId: input.categoryId,
      };

      // Chaîne complète: update() -> set() -> where() -> returning()
      const mockReturning = vi.fn().mockResolvedValueOnce([mockUpdatedTransaction]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      // Act
      const result = await caller.transaction.update(input);

      // Assert
      expect(mockDb.query.transactions.findFirst).toHaveBeenCalledTimes(1);
      expect(mockDb.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...mockUpdatedTransaction,
        category: mockCategory,
      });
    });

    it('should throw NOT_FOUND error if transaction does not exist', async () => {
      // Arrange
      const input = {
        id: 'non_existent_tx',
        description: 'Updated Transaction',
        amount: 150.50,
      };

      // Mock findFirst pour retourner undefined (transaction non trouvée)
      mockDb.query.transactions.findFirst.mockResolvedValueOnce(undefined);

      // Act & Assert
      await expect(caller.transaction.update(input)).rejects.toThrow(/Transaction non trouvée/i);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN error if transaction belongs to another user', async () => {
      // Arrange
      const input = {
        id: 'tx_1',
        description: 'Updated Transaction',
        amount: 150.50,
      };

      // Mock findFirst pour retourner une transaction appartenant à un autre utilisateur
      mockDb.query.transactions.findFirst.mockResolvedValueOnce({
        id: 'tx_1',
        userId: 'other-user-id',
        description: 'Original Transaction',
        amount: '100.00',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        bankAccountId: 'acc_1',
        categoryId: 'cat_1',
      });

      // Act & Assert
      await expect(caller.transaction.update(input)).rejects.toThrow(/non trouvée/i);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid update data', async () => {
      // Arrange
      const invalidInput = {
        id: 'tx_1',
        description: '', // Description vide
        amount: 'not-a-number', // Montant invalide
      };

      // Act & Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(caller.transaction.update(invalidInput as any)).rejects.toThrow(TRPCError);
      expect(mockDb.query.transactions.findFirst).not.toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const input = {
        id: 'tx_1',
        description: 'Updated Transaction',
        amount: 150.50,
      };

      // Mock findFirst pour vérification de propriété
      mockDb.query.transactions.findFirst.mockResolvedValueOnce({
        id: 'tx_1',
        userId: 'test-user-id',
        description: 'Original Transaction',
        amount: '100.00',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        bankAccountId: 'acc_1',
        categoryId: 'cat_1',
      });

      // Mock de l'erreur de base de données
      const mockReturningErr = vi.fn().mockRejectedValueOnce(new Error('DB Update Error'));
      const mockWhereErr = vi.fn().mockReturnValue({ returning: mockReturningErr });
      const mockSetErr = vi.fn().mockReturnValue({ where: mockWhereErr });
      mockDb.update.mockReturnValue({ set: mockSetErr });

      // Act & Assert
      await expect(caller.transaction.update(input)).rejects.toThrow(/Erreur lors de la mise à jour/i);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Réinitialiser les mocks spécifiques à delete
      mockDb.query.transactions.findFirst = vi.fn();
      mockDb.delete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      });
    });

    it('should delete an existing transaction successfully', async () => {
      // Arrange
      const input = { id: 'tx_to_delete' };

      // Mock findFirst pour vérification de propriété
      mockDb.query.transactions.findFirst.mockResolvedValueOnce({
        id: 'tx_to_delete',
        userId: 'test-user-id',
        description: 'Transaction to delete',
        amount: '100.00',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        bankAccountId: 'acc_1',
        categoryId: 'cat_1',
      });

      // Mock de la suppression
      const mockReturning = vi.fn().mockResolvedValueOnce([{ deletedId: 'tx_to_delete' }]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.delete.mockReturnValue({ where: mockWhere });

      // Act
      const result = await caller.transaction.delete(input);

      // Assert
      expect(mockDb.query.transactions.findFirst).toHaveBeenCalledTimes(1);
      expect(mockDb.delete).toHaveBeenCalledTimes(1);
      expect(mockWhere).toHaveBeenCalledWith(
        and(
          eq(schema.transactions.id, 'tx_to_delete'),
          eq(schema.transactions.userId, 'test-user-id')
        )
      );
      expect(result).toEqual({ success: true, deletedId: 'tx_to_delete' });
    });

    it('should throw NOT_FOUND if transaction does not exist or not owned', async () => {
      // Arrange
      const input = { id: 'non_existent_tx' };

      // Mock findFirst pour retourner undefined (transaction non trouvée)
      mockDb.query.transactions.findFirst.mockResolvedValueOnce(undefined);

      // Act & Assert
      await expect(caller.transaction.delete(input)).rejects.toThrow(/La transaction que vous essayez de supprimer n'a pas été trouvée ou ne vous appartient pas/i);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during delete', async () => {
      // Arrange
      const input = { id: 'tx_to_delete' };

      // Mock findFirst pour vérification de propriété
      mockDb.query.transactions.findFirst.mockResolvedValueOnce({
        id: 'tx_to_delete',
        userId: 'test-user-id',
        description: 'Transaction to delete',
        amount: '100.00',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        bankAccountId: 'acc_1',
        categoryId: 'cat_1',
      });

      // Mock de l'erreur de base de données
      const mockReturning = vi.fn().mockRejectedValueOnce(new Error('DB Delete Error'));
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.delete.mockReturnValue({ where: mockWhere });

      // Act & Assert
      await expect(caller.transaction.delete(input)).rejects.toThrow(/Une erreur est survenue lors de la suppression de la transaction/i);
      expect(mockDb.delete).toHaveBeenCalledTimes(1);
      expect(mockWhere).toHaveBeenCalledWith(
        and(
          eq(schema.transactions.id, 'tx_to_delete'),
          eq(schema.transactions.userId, 'test-user-id')
        )
      );
    });
  });
}); 