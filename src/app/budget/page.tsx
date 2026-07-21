'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES, formatILS, jpyToIls } from '@/lib/currency';
import type { CategoryBudgets, TripBudget } from '@/types';

const EMPTY_CATEGORY_BUDGETS: CategoryBudgets = {
  food: 0, transport: 0, lodging: 0, shopping: 0, activities: 0, other: 0,
};

export default function BudgetPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [exchangeRate, setExchangeRate] = useState('0.024');
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgets>(EMPTY_CATEGORY_BUDGETS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/budget')
      .then(r => r.json())
      .then((bud: TripBudget | null) => {
        if (bud) {
          setStartDate(bud.start_date || '');
          setEndDate(bud.end_date || '');
          setTotalBudget(bud.total_budget_jpy ? String(bud.total_budget_jpy) : '');
          setExchangeRate(String(bud.exchange_rate || 0.024));
          setCategoryBudgets({ ...EMPTY_CATEGORY_BUDGETS, ...bud.category_budgets });
        }
        setLoading(false);
      });
  }, []);

  const rate = Number(exchangeRate) || 0;
  const totalNum = Number(totalBudget) || 0;
  const categorySum = Object.values(categoryBudgets).reduce((s, v) => s + (Number(v) || 0), 0);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: startDate || null,
        end_date: endDate || null,
        total_budget_jpy: totalNum,
        exchange_rate: rate,
        category_budgets: categoryBudgets,
      }),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">טוען…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <span className="text-base font-semibold text-gray-900">הגדרות תקציב</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">תאריכי הטיול</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">תאריך התחלה</label>
              <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">תאריך סיום</label>
              <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">תקציב כולל</h2>
          <div>
            <label className="label">תקציב כולל (¥ ין יפני)</label>
            <input
              type="number"
              inputMode="decimal"
              className="input"
              placeholder="0"
              value={totalBudget}
              onChange={e => setTotalBudget(e.target.value)}
            />
            {totalNum > 0 && <p className="text-xs text-gray-400 mt-1">≈ {formatILS(jpyToIls(totalNum, rate))}</p>}
          </div>
          <div>
            <label className="label">שער חליפין (₪ לכל ¥1)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              className="input"
              placeholder="0.024"
              value={exchangeRate}
              onChange={e => setExchangeRate(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              עדכנו לפי השער העדכני בזמן הטיול — משמש להמרה בכל האפליקציה
            </p>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">תקציב לפי קטגוריה (לא חובה)</h2>
            {categorySum > 0 && <span className="text-xs text-gray-400">סה&quot;כ {categorySum.toLocaleString()} ¥</span>}
          </div>
          <div className="space-y-2.5">
            {CATEGORIES.map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-28 shrink-0">
                  {c.icon} {c.label}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input"
                  placeholder="0"
                  value={categoryBudgets[c.id] || ''}
                  onChange={e =>
                    setCategoryBudgets(prev => ({ ...prev, [c.id]: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'שומר…' : 'שמור הגדרות'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">נשמר ✓</span>}
        </div>
      </div>
    </div>
  );
}
