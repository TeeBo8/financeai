import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type Sql } from 'postgres';
import * as schema from '@/server/db/schema';
import { mockDeep } from 'vitest-mock-extended';

// Ce fichier sera exécuté avant chaque test
// Vous pouvez ajouter d'autres configurations globales ici si nécessaire 

// Mock Env
vi.mock('@/env.js', () => ({
  env: {
    GROQ_API_KEY: 'MOCK_GROQ_API_KEY',
    DATABASE_URL: 'mock://db',
    NEXTAUTH_SECRET: 'MOCK_SECRET',
  },
}));

// Mock Drizzle Adapter
vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(() => ({})),
}));

// Mock Base de Données (Drizzle)
type MockDbType = PostgresJsDatabase<typeof schema> & { $client: Sql<{}> };
const mockDb = {
  ...mockDeep<MockDbType>(),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{
        id: 'test-category-id',
        userId: 'user_test_123',
        name: 'Test Category',
        icon: '🎯',
        color: '#00ff00',
        createdAt: new Date(),
        updatedAt: new Date(),
      }])),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{ deletedId: 'test-category-id' }])),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'test-category-id',
          userId: 'user_test_123',
          name: 'Updated Category',
          icon: '🎯',
          color: '#00ff00',
          createdAt: new Date(),
          updatedAt: new Date(),
        }])),
      })),
    })),
  })),
  query: {
    categories: {
      findMany: vi.fn(() => Promise.resolve([{
        id: 'test-category-id',
        userId: 'user_test_123',
        name: 'Test Category',
        icon: '🎯',
        color: '#00ff00',
        createdAt: new Date(),
        updatedAt: new Date(),
      }])),
      findFirst: vi.fn(() => Promise.resolve(null)),
    },
    users: {
      findFirst: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
    },
  },
};

vi.mock('@/server/db', () => ({
  db: mockDb,
  schema,
}));

// Mock Groq
vi.mock('groq-sdk', () => {
  const mockGroq = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock response' } }]
        })
      }
    }
  }));

  mockGroq.prototype.dangerouslyAllowBrowser = true;

  return {
    default: mockGroq
  };
});

// Mock Auth
const mockUserId = 'user_setup_123';
const mockSession = {
  user: { id: mockUserId, name: 'Setup User', email: 'setup@example.com' },
  expires: new Date(Date.now() + 86400 * 1000).toISOString(),
};

vi.mock('@/server/auth', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/server/auth')>();
  return {
    ...mod,
    getSession: vi.fn(() => Promise.resolve(mockSession)),
  };
});

vi.mock('next-auth', async () => {
  const mockNextAuth = vi.fn(() => ({
    auth: vi.fn(() => Promise.resolve(mockSession)),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }));

  return {
    default: mockNextAuth,
    getServerSession: vi.fn(() => Promise.resolve(mockSession)),
  };
});

// Mock de revalidatePath de Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn().mockImplementation(() => Promise.resolve()),
}));

console.log('Vitest setup: Mocks applied.'); 