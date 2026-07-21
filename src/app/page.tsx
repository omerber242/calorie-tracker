'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ExpenseModal from '@/components/ExpenseModal';
import CategoryChart from '@/components/CategoryChart';
import { CATEGORIES, formatJPY, formatILS, jpyToIls, categoryInfo } from '@/lib/currency';
import type { Expense, TripBudget } from '@/types';

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<TripBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/budget').then(r => r.json()),
    ]).then(([exp, bud]) => {
      setExpenses(Array.isArray(exp) ? exp : []);
      setBudget(bud);
      setLoading(false);
    });
  }

  const rate = budget?.exchange_rate || 0.024;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount_jpy), 0);
  const totalBudget = budget?.total_budget_jpy || 0;
  const remaining = totalBudget - totalSpent;
  const today = todayStr();

  let tripProgress: string | null = null;
  if (budget?.start_date && budget?.end_date) {
    const totalDays = daysBetween(budget.start_date, budget.end_date);
    if (today < budget.start_date) {
      tripProgress = `הטיול מתחיל בעוד ${daysBetween(today, budget.start_date) - 1} ימים`;
    } else if (today > budget.end_date) {
      tripProgress = `הטיול הסתיים (${totalDays} ימים)`;
    } else {
      const elapsed = daysBetween(budget.start_date, today);
      tripProgress = `יום ${elapsed} מתוך ${totalDays}`;
    }
  }

  const recent = expenses.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-white text-base select-none">
              ⛩️
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900">טיול יפן</div>
              {tripProgress && <div className="text-xs text-gray-400">{tripProgress}</div>}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">טוען…</div>
        ) : (
          <>
            {!budget && (
              <div className="card bg-rose-50 border-rose-100 flex items-center justify-between gap-3">
                <p className="text-sm text-rose-800">עדיין לא הגדרת תקציב לטיול</p>
                <Link href="/budget" className="btn-primary text-sm shrink-0">
                  הגדרת תקציב
                </Link>
              </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card">
                <div className="text-xs text-gray-400 mb-1">סה&quot;כ הוצאות</div>
                <div className="text-xl font-bold text-gray-900">{formatJPY(totalSpent)}</div>
                <div className="text-xs text-gray-400">≈ {formatILS(jpyToIls(totalSpent, rate))}</div>
              </div>
              <div className="card">
                <div className="text-xs text-gray-400 mb-1">
                  {totalBudget > 0 ? 'נשאר מהתקציב' : 'תקציב'}
                </div>
                {totalBudget > 0 ? (
                  <>
                    <div className={`text-xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatJPY(remaining)}
                    </div>
                    <div className="text-xs text-gray-400">≈ {formatILS(jpyToIls(remaining, rate))}</div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400 mt-1">לא הוגדר</div>
                )}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">הוצאות לפי קטגוריה</h2>
              <CategoryChart expenses={expenses} />
            </div>

            {/* Budget progress per category */}
            {budget && Object.values(budget.category_budgets).some(v => v > 0) && (
              <div className="card space-y-3">
                <h2 className="font-semibold text-gray-900 text-sm">התקדמות תקציב</h2>
                {CATEGORIES.map(c => {
                  const catBudget = budget.category_budgets[c.id] || 0;
                  if (catBudget <= 0) return null;
                  const spent = expenses.filter(e => e.category === c.id).reduce((s, e) => s + Number(e.amount_jpy), 0);
                  const pct = Math.min(100, Math.round((spent / catBudget) * 100));
                  const over = spent > catBudget;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">{c.icon} {c.label}</span>
                        <span className={over ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {formatJPY(spent)} / {formatJPY(catBudget)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: over ? '#dc2626' : c.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent expenses */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">הוצאות אחרונות</h2>
                <Link href="/expenses" className="text-xs text-rose-600 hover:text-rose-700 font-medium">
                  כל ההוצאות ←
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">עדיין אין הוצאות רשומות</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recent.map(e => {
                    const info = categoryInfo(e.category);
                    return (
                      <div key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg">{info.icon}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {e.description || info.label}
                            </div>
                            <div className="text-xs text-gray-400">{e.date}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 shrink-0">
                          {formatJPY(e.amount_jpy)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 sm:bottom-6 left-4 sm:left-auto sm:right-6 w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-2xl shadow-lg flex items-center justify-center z-20 transition-colors"
        aria-label="הוצאה חדשה"
      >
        +
      </button>

      {showAdd && (
        <ExpenseModal
          exchangeRate={rate}
          onClose={() => setShowAdd(false)}
          onSaved={e => {
            setExpenses(prev => [e, ...prev]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}
