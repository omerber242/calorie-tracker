'use client';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import AddFoodModal from '@/components/AddFoodModal';
import { sumMacros } from '@/lib/calculations';
import type { FoodLogEntry } from '@/types';

export default function LogPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEntries(); }, [date]);

  async function fetchEntries() {
    setLoading(true);
    const res = await fetch(`/api/log?date=${date}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
    setLoading(false);
  }

  async function addEntry(entry: any) {
    await fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...entry, log_date: date }) });
    fetchEntries();
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/log?id=${id}`, { method: 'DELETE' });
    fetchEntries();
  }

  const totals = sumMacros(entries);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">
        {/* Date nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => shiftDate(-1)} className="btn-secondary px-3 py-1.5 text-sm">←</button>
          <div className="text-center">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm font-semibold text-gray-900 border-none bg-transparent text-center cursor-pointer"
            />
          </div>
          <button onClick={() => shiftDate(1)} className="btn-secondary px-3 py-1.5 text-sm" disabled={date >= new Date().toISOString().split('T')[0]}>→</button>
        </div>

        {/* Daily summary bar */}
        <div className="card grid grid-cols-5 text-center gap-2">
          {[
            { label: 'Calories', val: Math.round(totals.calories), unit: 'kcal', color: 'text-orange-500' },
            { label: 'Protein', val: Math.round(totals.protein), unit: 'g', color: 'text-blue-500' },
            { label: 'Carbs', val: Math.round(totals.carbs), unit: 'g', color: 'text-purple-500' },
            { label: 'Fat', val: Math.round(totals.fat), unit: 'g', color: 'text-yellow-500' },
            { label: 'Fiber', val: Math.round(totals.fiber), unit: 'g', color: 'text-green-500' },
          ].map(m => (
            <div key={m.label}>
              <div className={`text-base font-bold ${m.color}`}>{m.val}<span className="text-xs text-gray-400">{m.unit}</span></div>
              <div className="text-xs text-gray-400">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">{entries.length} items logged</h2>
          <button onClick={() => setShowAdd(true)} className="btn-primary">+ Add Food</button>
        </div>

        {/* Entries list */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🍽️</div>
            <p>Nothing logged for this day</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="card flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{entry.meal_type}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{entry.food_name}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {entry.serving_size}{entry.serving_unit} · P:{Math.round(entry.protein ?? 0)}g C:{Math.round(entry.carbs ?? 0)}g F:{Math.round(entry.fat ?? 0)}g Fiber:{Math.round(entry.fiber ?? 0)}g
                  </div>
                  {entry.notes && <div className="text-xs text-gray-400 italic mt-0.5">{entry.notes}</div>}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="text-sm font-bold text-orange-500">{Math.round(entry.calories ?? 0)} kcal</span>
                  <button onClick={() => deleteEntry(entry.id)} className="text-gray-300 hover:text-red-400">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <AddFoodModal onClose={() => setShowAdd(false)} onAdd={addEntry} defaultDate={date} />
      )}
    </div>
  );
}
