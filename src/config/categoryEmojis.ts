import { Category } from '../types';

export const categoryEmojis: Record<Category, string> = {
  Produce: '🥬',
  Dairy: '🥛',
  Bakery: '🥖',
  'Meat & Seafood': '🥩',
  Pantry: '🥫',
  Frozen: '🧊',
  Snacks: '🍿',
  Beverages: '🥤',
  Household: '🧴',
  'Personal Care': '🧼',
  'Pet Supplies': '🐾',
  Other: '📦',
};

export const categoryRussianNames: Record<Category, string> = {
  Produce: 'Продукты',
  Dairy: 'Молочные продукты',
  Bakery: 'Выпечка',
  'Meat & Seafood': 'Мясо и морепродукты',
  Pantry: 'Бакалея',
  Frozen: 'Замороженные',
  Snacks: 'Закуски',
  Beverages: 'Напитки',
  Household: 'Бытовая химия',
  'Personal Care': 'Личная гигиена',
  'Pet Supplies': 'Товары для животных',
  Other: 'Другое',
};

export function formatCategoryName(category: Category): string {
  return `${category} / ${categoryRussianNames[category]}`;
}

