'use client';

import { useState } from 'react';
import { CATEGORIES, formatILS, jpyToIls } from '@/lib/currency';
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ExpenseModal({
  expense,
  exchangeRate,
  onClose,
  onSaved,
  onDeleted,
}: {
  expense?: Expense;
  exchangeRate: number;
  onClose: () => void;
  onSaved: (e: Expense) => void;
  onDeleted?: (id: string) => void;
}) {
  const [date, setDate] = useState(expense?.date || todayStr());
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'food');
  const [amount, setAmount] = useState(expense ? String(expense.amount_jpy) : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expense?.payment_method || 'cash');
  const [description, setDescription] = useState(expense?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amountNum = Number(amount) || 0;
  const isEdit = !!expense;

  async function handleSave() {
    if (!date || amountNum <= 0) {
      setError('נא למלא תאריך וסכום חוקי');
      return;
    }
    setLoading(true);
    setError('');

    const url = isEdit ? `/api/expenses?id=${expense!.id}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        category,
        amount_jpy: amountNum,
        payment_method: paymentMethod,
        description: description.trim(),
      }),
    });

    if (res.ok) {
      const data: Expense = await res.json();
      onSaved(data);
    } else {
      const data = await res.json();
      setError(data.error || 'שמירה נכשלה, נסה שוב');
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!expense || !confirm('למחוק את ההוצאה הזו?')) return;
    setLoading(true);
    const res = await fetch(`/api/expenses?id=${expense.id}`, { method: 'DELETE' });
    if (res.ok) {
      onDeleted?.(expense.id);
    } else {
      setError('מחיקה נכשלה, נסה שוב');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-5 pt-5 pb-4 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'עריכת הוצאה' : 'הוצאה חדשה'}
          </h2>

          <div>
            <label className="label">תאריך</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div>
            <label className="label">קטגוריה</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 ${
                    category === c.id
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">סכום (¥ ין יפני)</label>
            <input
              type="number"
              inputMode="decimal"
              className="input"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus={!isEdit}
            />
            {amountNum > 0 && (
              <p className="text-xs text-gray-400 mt-1">≈ {formatILS(jpyToIls(amountNum, exchangeRate))}</p>
            )}
          </div>

          <div>
            <label className="label">אמצעי תשלום</label>
            <div className="flex gap-2">
              {(['cash', 'card'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    paymentMethod === m
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m === 'cash' ? '💴 מזומן' : '💳 כרטיס'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">הערה (לא חובה)</label>
            <input
              type="text"
              className="input"
              placeholder="לדוגמה: ראמן בשיבויה"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-medium px-4 py-2 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
            >
              מחק
            </button>
          )}
          <button onClick={handleSave} disabled={loading || amountNum <= 0} className="btn-primary flex-1">
            {loading ? 'שומר…' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
