import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { db } from '@/server/db';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createTRPCContext } from '@/server/api/trpc';
import type { inferAsyncReturnType } from '@trpc/server';
import { type Sql } from 'postgres';
import * as schema from '@/server/db/schema';
import { mockDeep } from 'vitest-mock-extended';
import { eq, desc, and } from 'drizzle-orm';

describe('Transaction Router Tests', () => {
  const mockSession = { 
    user: { id: 'test-user-id' }, 
    expires: 'never',
  } as const;

  let mockDb: any;
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
        },
        bankAccounts: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        categories: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
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
      expect(result.every(tx => parseFloat(tx.amount) < 0)).toBe(true);
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
      expect(result.every(tx => tx.description.toLowerCase().includes('restaurant'))).toBe(true);
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
      expect(result.every(tx => tx.categoryId === targetCategoryId)).toBe(true);
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
      expect(result.every(tx => tx.bankAccountId === targetAccountId)).toBe(true);
    });
  });
}); 