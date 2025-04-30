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
  });
}); 