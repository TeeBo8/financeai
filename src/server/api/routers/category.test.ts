import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as schema from '@/server/db/schema';
import { mockDeep } from 'vitest-mock-extended';
import { type Session } from 'next-auth';
import { appRouter } from "@/server/api/root";
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type Sql } from 'postgres';

// --- Mock de la Base de Données (Drizzle) ---
type MockDbType = PostgresJsDatabase<typeof schema> & { $client: Sql };
const mockDb = mockDeep<MockDbType>();

// Variables de test
const mockUserId = 'user_test_123';
const mockSession = {
  user: { id: mockUserId, name: 'Test User', email: 'test@example.com' },
  expires: new Date(Date.now() + 86400 * 1000).toISOString(),
};

// --- Reset Mocks Avant Chaque Test ---
beforeEach(() => {
  vi.clearAllMocks();
});

// Simule le contexte tRPC
const mockCtx = {
  session: mockSession as Session,
  db: mockDb,
  headers: new Headers(),
};

const caller = appRouter.createCaller(mockCtx);

// --- Tests pour le routeur 'category' ---
describe('Category Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new category successfully', async () => {
    const input = {
      name: 'Test Category',
      icon: '🎯',
      color: '#00ff00',
    };

    const result = await caller.category.create(input);

    expect(result).toEqual({
      id: 'test-category-id',
      userId: 'user_test_123',
      name: 'Test Category',
      icon: '🎯',
      color: '#00ff00',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('uses default icon and color if not provided', async () => {
    const input = {
      name: 'Test Category',
    };

    const result = await caller.category.create(input);

    expect(result).toEqual({
      id: 'test-category-id',
      userId: 'user_test_123',
      name: 'Test Category',
      icon: '🎯',
      color: '#00ff00',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('updates an existing category', async () => {
    const input = {
      id: 'test-category-id',
      name: 'Updated Category',
    };

    const result = await caller.category.update(input);

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

  it('updates only provided fields', async () => {
    const input = {
      id: 'test-category-id',
      name: 'Updated Category',
    };

    const result = await caller.category.update(input);

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

  it('deletes an existing category successfully', async () => {
    const input = {
      id: 'test-category-id',
    };

    const result = await caller.category.delete(input);

    expect(result).toEqual({
      success: true,
      deletedId: 'test-category-id',
    });
  });

  it('lists categories for the authenticated user', async () => {
    const result = await caller.category.getAll();

    expect(result).toEqual([{
      id: 'test-category-id',
      userId: 'user_test_123',
      name: 'Test Category',
      icon: '🎯',
      color: '#00ff00',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    }]);
  });
}); 