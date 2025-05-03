import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '@/server/api/root';
import { TRPCError } from '@trpc/server';
import { createTRPCContext } from '@/server/api/trpc';
import type { inferAsyncReturnType } from '@trpc/server';

// Mock de la base de données
vi.mock('@/server/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([])
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      })
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([])
      })
    }),
    query: {
      bankAccounts: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));

// Mock du module auth
vi.mock('@/server/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'test-user-id' } })),
}));

// Mock des schémas de la base de données
vi.mock('@/server/db/schema', () => ({
  bankAccounts: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    icon: 'icon',
    color: 'color',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  transactions: {
    amount: 'amount',
    bankAccountId: 'bankAccountId',
  },
}));

// Mock des opérateurs Drizzle
vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  eq: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
  sum: vi.fn(),
  getTableColumns: vi.fn(),
}));

// Type pour le contexte
type Context = inferAsyncReturnType<typeof createTRPCContext>;
type Caller = ReturnType<typeof appRouter.createCaller>;

describe('Bank Account Router Tests', () => {
  let ctx: Context;
  let caller: Caller;

  beforeEach(async () => {
    vi.clearAllMocks();
    ctx = await createTRPCContext({ headers: new Headers() });
    caller = appRouter.createCaller(ctx);
  });

  describe('getAll', () => {
    it('should fetch all bank accounts for the current user', async () => {
      // Données de test
      const mockAccounts = [
        {
          id: 'account-1',
          userId: 'test-user-id',
          name: 'Compte Courant',
          icon: '💰',
          color: '#FF5733',
          createdAt: new Date(),
          updatedAt: new Date(),
          balance: '1000.00',
        },
        {
          id: 'account-2',
          userId: 'test-user-id',
          name: 'Compte Épargne',
          icon: '🏦',
          color: '#33FF57',
          createdAt: new Date(),
          updatedAt: new Date(),
          balance: '5000.00',
        },
      ];

      // Configuration des mocks
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockAccounts)
              })
            })
          })
        })
      });

      ctx.db.select = mockSelect;
      ctx.db.query.bankAccounts.findMany = vi.fn().mockResolvedValue(mockAccounts);

      // Mock des opérateurs Drizzle
      vi.mock('drizzle-orm', () => ({
        and: vi.fn(),
        eq: vi.fn(),
        desc: vi.fn(),
        sql: vi.fn().mockReturnValue({
          as: vi.fn().mockReturnValue('balance')
        }),
        sum: vi.fn().mockReturnValue('1000.00'),
        getTableColumns: vi.fn().mockReturnValue({
          id: 'id',
          userId: 'userId',
          name: 'name',
          icon: 'icon',
          color: 'color',
          createdAt: 'createdAt',
          updatedAt: 'updatedAt'
        })
      }));

      // Appel de la procédure
      const result = await caller.bankAccount.getAll();

      // Vérifications
      expect(mockSelect).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccounts);
    });

    it('should handle database errors gracefully', async () => {
      // Configuration du mock pour simuler une erreur
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockRejectedValue(new Error('Database error'))
              })
            })
          })
        })
      });

      ctx.db.select = mockSelect;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.getAll()).rejects.toThrow(TRPCError);
    });
  });

  describe('create', () => {
    it('should create a new bank account', async () => {
      // Données de test
      const input = {
        name: 'Nouveau Compte',
        icon: '💳',
        color: '#FF0000',
      };

      const mockAccount = {
        id: 'new-account-id',
        userId: 'test-user-id',
        name: input.name,
        icon: input.icon,
        color: input.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configuration des mocks
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAccount])
        })
      });
      ctx.db.insert = mockInsert;

      // Appel de la procédure
      const result = await caller.bankAccount.create(input);

      // Vérifications
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });

    it('should handle validation errors', async () => {
      // Données de test invalides
      const invalidInput = {
        name: '', // Nom vide
        icon: '💳',
        color: '#FF0000',
      };

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.create(invalidInput)).rejects.toThrow(TRPCError);
    });

    it('should handle database errors gracefully', async () => {
      // Données de test
      const input = {
        name: 'Nouveau Compte',
        icon: '💳',
        color: '#FF0000',
      };

      // Configuration du mock pour simuler une erreur
      const mockInsert = vi.fn().mockRejectedValue(new Error('Database error'));
      ctx.db.insert = mockInsert;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.create(input)).rejects.toThrow(TRPCError);
    });
  });

  describe('update', () => {
    it('should update an existing bank account', async () => {
      // Données de test
      const input = {
        id: 'existing-account-id',
        name: 'Compte Mis à Jour',
        icon: '💵',
        color: '#00FF00',
      };

      const mockAccount = {
        id: input.id,
        userId: 'test-user-id',
        name: input.name,
        icon: input.icon,
        color: input.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configuration des mocks
      const mockFindFirst = vi.fn().mockResolvedValue({ id: input.id, userId: 'test-user-id' });
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockAccount])
          })
        })
      });

      ctx.db.query.bankAccounts.findFirst = mockFindFirst;
      ctx.db.update = mockUpdate;

      // Appel de la procédure
      const result = await caller.bankAccount.update(input);

      // Vérifications
      expect(mockFindFirst).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });

    it('should handle non-existent account', async () => {
      // Données de test
      const input = {
        id: 'non-existent-id',
        name: 'Compte Mis à Jour',
      };

      // Configuration des mocks
      const mockFindFirst = vi.fn().mockResolvedValue(null);
      ctx.db.query.bankAccounts.findFirst = mockFindFirst;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.update(input)).rejects.toThrow(TRPCError);
    });

    it('should handle unauthorized access', async () => {
      // Données de test
      const input = {
        id: 'other-user-account',
        name: 'Compte Mis à Jour',
      };

      // Configuration des mocks
      const mockFindFirst = vi.fn()
        .mockResolvedValueOnce(null) // Premier appel pour vérifier l'autorisation
        .mockResolvedValueOnce({ id: input.id, userId: 'other-user-id' }); // Deuxième appel pour vérifier l'existence
      ctx.db.query.bankAccounts.findFirst = mockFindFirst;

      // Mock pour update (même si on ne devrait pas l'atteindre)
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: input.id, userId: 'other-user-id' }])
          })
        })
      });
      ctx.db.update = mockUpdate;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.update(input)).rejects.toThrow(TRPCError);
    });

    it('should handle database errors gracefully', async () => {
      // Données de test
      const input = {
        id: 'existing-account-id',
        name: 'Compte Mis à Jour',
      };

      // Configuration des mocks
      const mockFindFirst = vi.fn().mockResolvedValue({ id: input.id, userId: 'test-user-id' });
      ctx.db.query.bankAccounts.findFirst = mockFindFirst;

      const mockUpdate = vi.fn().mockRejectedValue(new Error('Database error'));
      ctx.db.update = mockUpdate;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.update(input)).rejects.toThrow(TRPCError);
    });
  });

  describe('delete', () => {
    it('should delete a bank account', async () => {
      // Données de test
      const input = {
        id: 'account-to-delete',
      };

      const mockDeletedAccount = {
        id: input.id,
      };

      // Configuration des mocks
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockDeletedAccount])
        })
      });
      ctx.db.delete = mockDelete;

      // Mock pour la vérification de l'existence du compte
      const mockFindFirst = vi.fn().mockResolvedValue({ id: input.id, userId: 'test-user-id' });
      ctx.db.query.bankAccounts.findFirst = mockFindFirst;

      // Appel de la procédure
      const result = await caller.bankAccount.delete(input);

      // Vérifications
      expect(mockFindFirst).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDeletedAccount);
    });

    it('should handle non-existent account', async () => {
      // Données de test
      const input = {
        id: 'non-existent-id',
      };

      // Configuration des mocks
      const mockFindFirst = vi.fn().mockResolvedValue(null);
      ctx.db.query.bankAccounts.findFirst = mockFindFirst;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.delete(input)).rejects.toThrow(TRPCError);
    });

    it('should handle unauthorized access', async () => {
      // Données de test
      const input = {
        id: 'other-user-account',
      };

      // Configuration des mocks
      const mockFindFirst = vi.fn()
        .mockResolvedValueOnce(null) // Premier appel pour vérifier l'autorisation
        .mockResolvedValueOnce({ id: input.id, userId: 'other-user-id' }); // Deuxième appel pour vérifier l'existence
      ctx.db.query.bankAccounts.findFirst = mockFindFirst;

      // Mock pour delete (même si on ne devrait pas l'atteindre)
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: input.id }])
        })
      });
      ctx.db.delete = mockDelete;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.delete(input)).rejects.toThrow(TRPCError);
    });

    it('should handle database errors gracefully', async () => {
      // Données de test
      const input = {
        id: 'account-to-delete',
      };

      // Configuration des mocks
      const mockFindFirst = vi.fn().mockResolvedValue({ id: input.id, userId: 'test-user-id' });
      ctx.db.query.bankAccounts.findFirst = mockFindFirst;

      const mockDelete = vi.fn().mockRejectedValue(new Error('Database error'));
      ctx.db.delete = mockDelete;

      // Vérification que l'erreur est propagée correctement
      await expect(caller.bankAccount.delete(input)).rejects.toThrow(TRPCError);
    });
  });
}); 