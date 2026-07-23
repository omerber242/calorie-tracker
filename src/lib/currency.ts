import type { Currency, ExchangeRates, ExpenseCategory } from '@/types';

export const CATEGORIES: { id: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { id: 'food', label: 'אוכל', icon: '🍜', color: '#e11d48' },
  { id: 'transport', label: 'תחבורה', icon: '🚄', color: '#2563eb' },
  { id: 'lodging', label: 'לינה', icon: '🏨', color: '#7c3aed' },
  { id: 'shopping', label: 'קניות', icon: '🛍️', color: '#d97706' },
  { id: 'activities', label: 'אטרקציות', icon: '⛩️', color: '#059669' },
  { id: 'other', label: 'אחר', icon: '📦', color: '#64748b' },
];

export const CURRENCIES: { id: Currency; label: string; symbol: string }[] = [
  { id: 'JPY', label: 'ין יפני', symbol: '¥' },
  { id: 'USD', label: 'דולר', symbol: '$' },
  { id: 'EUR', label: 'יורו', symbol: '€' },
  { id: 'ILS', label: 'שקל', symbol: '₪' },
];

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = { JPY: 0.024, USD: 3.7, EUR: 4.0, ILS: 1 };

export function categoryInfo(id: ExpenseCategory) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function currencyInfo(id: Currency) {
  return CURRENCIES.find(c => c.id === id) ?? CURRENCIES[0];
}

export function formatAmount(amount: number, currency: Currency): string {
  return `${currencyInfo(currency).symbol}${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatILS(amount: number): string {
  return `₪${Math.round(amount).toLocaleString('he-IL')}`;
}

export function toIls(amount: number, currency: Currency, rates: ExchangeRates): number {
  return amount * (rates[currency] ?? 0);
}
