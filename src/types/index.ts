export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'shopping'
  | 'activities'
  | 'other';

export type PaymentMethod = 'cash' | 'card';

export type Currency = 'JPY' | 'USD' | 'EUR' | 'ILS';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  currency: Currency;
  payment_method: PaymentMethod;
  description?: string | null;
  created_at: string;
}

export interface CategoryBudgets {
  food: number;
  transport: number;
  lodging: number;
  shopping: number;
  activities: number;
  other: number;
}

export type ExchangeRates = Record<Currency, number>; // ILS per 1 unit of currency

export interface TripBudget {
  id: string;
  start_date: string | null;
  end_date: string | null;
  total_budget_ils: number;
  exchange_rates: ExchangeRates;
  category_budgets: CategoryBudgets; // denominated in ILS
  updated_at: string;
}
