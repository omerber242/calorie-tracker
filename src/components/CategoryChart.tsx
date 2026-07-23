'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES, formatILS, toIls } from '@/lib/currency';
import type { Expense, ExchangeRates } from '@/types';

export default function CategoryChart({ expenses, rates }: { expenses: Expense[]; rates: ExchangeRates }) {
  const totals = CATEGORIES.map(c => ({
    ...c,
    value: expenses
      .filter(e => e.category === c.id)
      .reduce((sum, e) => sum + toIls(Number(e.amount), e.currency, rates), 0),
  })).filter(c => c.value > 0);

  if (totals.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        עדיין אין הוצאות להצגה
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="w-full sm:w-1/2 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={totals} dataKey="value" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {totals.map(c => (
                <Cell key={c.id} fill={c.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatILS(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full sm:w-1/2 space-y-1.5">
        {totals
          .sort((a, b) => b.value - a.value)
          .map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.icon} {c.label}
              </span>
              <span className="font-medium text-gray-900">{formatILS(c.value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
