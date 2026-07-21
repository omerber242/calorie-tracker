import type { ExpenseCategory } from '@/types';

export const CATEGORIES: { id: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { id: 'food', label: 'אוכל', icon: '🍜', color: '#e11d48' },
  { id: 'transport', label: 'תחבורה', icon: '🚄', color: '#2563eb' },
  { id: 'lodging', label: 'לינה', icon: '🏨', color: '#7c3aed' },
  { id: 'shopping', label: 'קניות', icon: '🛍️', color: '#d97706' },
  { id: 'activities', label: 'אטרקציות', icon: '⛩️', color: '#059669' },
  { id: 'other', label: 'אחר', icon: '📦', color: '#64748b' },
];

export function categoryInfo(id: ExpenseCategory) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function formatJPY(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

export function formatILS(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}

export function jpyToIls(jpy: number, rate: number): number {
  return jpy * rate;
}
