import { vi } from 'vitest';
import { categories } from '../../../db/schema';

export const mockCategoryUpdateReturning = vi.fn().mockImplementation(() => {
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

export const mockCategoryUpdateWhere = vi.fn().mockImplementation(() => ({
  returning: mockCategoryUpdateReturning,
}));

export const mockCategoryUpdateSet = vi.fn().mockImplementation(() => ({
  where: mockCategoryUpdateWhere,
}));

export const mockCategoryUpdate = vi.fn().mockImplementation((table) => {
  if (table === categories) {
    return {
      set: mockCategoryUpdateSet,
    };
  }
  return {};
}); 