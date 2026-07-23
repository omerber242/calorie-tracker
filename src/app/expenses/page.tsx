'use client';

import { useState, useEffect, useMemo } from 'react';
import ExpenseModal from '@/components/ExpenseModal';
import { CATEGORIES, DEFAULT_EXCHANGE_RATES, formatAmount, formatILS, toIls, categoryInfo } from '@/lib/currency';
import type { Expense, ExpenseCategory, ExchangeRates, TripBudget } from '@/types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_EXCHANGE_RATES);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; expense?: Expense } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/budget').then(r => r.json()),
    ]).then(([exp, bud]: [Expense[], TripBudget | null]) => {
      setExpenses(Array.isArray(exp) ? exp : []);
      if (bud?.exchange_rates) setRates(bud.exchange_rates);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => (categoryFilter === 'all' ? expenses : expenses.filter(e => e.category === categoryFilter)),
    [expenses, categoryFilter]
  );

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const total = filtered.reduce((sum, e) => sum + toIls(Number(e.amount), e.currency, rates), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-gray-900">כל ההוצאות</span>
            <button onClick={() => setModal({ mode: 'add' })} className="btn-primary text-sm">
              + הוצאה
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === 'all' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              הכל
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === c.id ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">טוען…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3 select-none">🧾</div>
            <p className="font-medium text-gray-700">אין הוצאות להצגה</p>
            <p className="text-sm text-gray-400 mt-1">לחצו על &quot;+ הוצאה&quot; כדי להוסיף רשומה ראשונה</p>
          </div>
        ) : (
          <>
            <div className="card flex items-center justify-between">
              <span className="text-sm text-gray-500">סה&quot;כ ({filtered.length} הוצאות)</span>
              <div className="font-bold text-gray-900">{formatILS(total)}</div>
            </div>

            {groups.map(([date, items]) => {
              const dayTotal = items.reduce((s, e) => s + toIls(Number(e.amount), e.currency, rates), 0);
              return (
                <div key={date} className="card p-0 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{date}</span>
                    <span className="text-xs text-gray-400">{formatILS(dayTotal)}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map(e => {
                      const info = categoryInfo(e.category);
                      return (
                        <button
                          key={e.id}
                          onClick={() => setModal({ mode: 'edit', expense: e })}
                          className="w-full flex items-center justify-between px-4 py-3 gap-3 hover:bg-gray-50 transition-colors text-right"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg">{info.icon}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {e.description || info.label}
                              </div>
                              <div className="text-xs text-gray-400">
                                {info.label} · {e.payment_method === 'cash' ? 'מזומן' : 'כרטיס'}
                              </div>
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatAmount(e.amount, e.currency)}
                            </div>
                            {e.currency !== 'ILS' && (
                              <div className="text-xs text-gray-400">
                                ≈ {formatILS(toIls(e.amount, e.currency, rates))}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {modal && (
        <ExpenseModal
          expense={modal.expense}
          rates={rates}
          onClose={() => setModal(null)}
          onSaved={e => {
            setExpenses(prev =>
              modal.mode === 'edit' ? prev.map(x => (x.id === e.id ? e : x)) : [e, ...prev]
            );
            setModal(null);
          }}
          onDeleted={id => {
            setExpenses(prev => prev.filter(x => x.id !== id));
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
