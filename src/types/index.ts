export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'shopping'
  | 'activities'
  | 'other';

export type PaymentMethod = 'cash' | 'card';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount_jpy: number;
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

export interface TripBudget {
  id: string;
  start_date: string | null;
  end_date: string | null;
  total_budget_jpy: number;
  exchange_rate: number; // ILS per 1 JPY
  category_budgets: CategoryBudgets;
  updated_at: string;
}
