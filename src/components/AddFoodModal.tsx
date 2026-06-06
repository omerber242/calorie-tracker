'use client';
import { useState, useCallback } from 'react';
import type { MealType } from '@/types';

interface SearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  servingSize?: number;
  servingSizeUnit?: string;
}

interface AddFoodModalProps {
  onClose: () => void;
  onAdd: (entry: Omit<any, 'id' | 'user_id' | 'logged_at'>) => Promise<void>;
  defaultMeal?: MealType;
  defaultDate?: string;
}

export default function AddFoodModal({ onClose, onAdd, defaultMeal = 'snack', defaultDate }: AddFoodModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [serving, setServing] = useState(100);
  const [servingUnit, setServingUnit] = useState('g');
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' });

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}&pageSize=8`);
    const data = await res.json();
    setResults(data.foods ?? []);
    setSearching(false);
  }

  async function fetchDetails(food: SearchResult) {
    const res = await fetch(`/api/food/details?id=${food.fdcId}&serving=${serving}`);
    const data = await res.json();
    setSelected({ ...food, ...data });
  }

  function scaledMacro(value?: number) {
    if (!selected || value === undefined || value === null) return null;
    // USDA returns per-100g; re-scale to current serving
    const base = selected.servingSize ?? 100;
    return Math.round((value / base) * serving * 10) / 10;
  }

  async function handleAdd() {
    setAdding(true);
    if (manualMode) {
      await onAdd({
        food_name: manual.name,
        meal_type: meal,
        serving_size: 1,
        serving_unit: 'serving',
        calories: parseFloat(manual.calories) || null,
        protein: parseFloat(manual.protein) || null,
        carbs: parseFloat(manual.carbs) || null,
        fat: parseFloat(manual.fat) || null,
        fiber: parseFloat(manual.fiber) || null,
        log_date: defaultDate ?? new Date().toISOString().split('T')[0],
      });
    } else if (selected) {
      await onAdd({
        food_name: selected.description,
        food_id: String(selected.fdcId),
        meal_type: meal,
        serving_size: serving,
        serving_unit: servingUnit,
        calories: scaledMacro(selected.calories),
        protein: scaledMacro(selected.protein),
        carbs: scaledMacro(selected.carbs),
        fat: scaledMacro(selected.fat),
        fiber: scaledMacro(selected.fiber),
        log_date: defaultDate ?? new Date().toISOString().split('T')[0],
      });
    }
    setAdding(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">Add Food</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Meal selector */}
          <div className="flex gap-2">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(m => (
              <button
                key={m}
                onClick={() => setMeal(m)}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors ${
                  meal === m ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Toggle manual */}
          <div className="flex gap-2">
            <button
              onClick={() => setManualMode(false)}
              className={`text-sm px-3 py-1 rounded-lg ${!manualMode ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500'}`}
            >
              Search Database
            </button>
            <button
              onClick={() => setManualMode(true)}
              className={`text-sm px-3 py-1 rounded-lg ${manualMode ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500'}`}
            >
              Enter Manually
            </button>
          </div>

          {manualMode ? (
            <div className="space-y-3">
              <div>
                <label className="label">Food Name</label>
                <input className="input" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Homemade oatmeal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'carbs', 'fat', 'fiber'] as const).map(k => (
                  <div key={k}>
                    <label className="label capitalize">{k} {k === 'calories' ? '(kcal)' : '(g)'}</label>
                    <input className="input" type="number" min="0" value={manual[k]} onChange={e => setManual(p => ({ ...p, [k]: e.target.value }))} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="Search foods (e.g. chicken breast)"
                />
                <button onClick={search} disabled={searching} className="btn-primary px-3">
                  {searching ? '…' : '🔍'}
                </button>
              </div>

              {/* Results */}
              {results.length > 0 && !selected && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {results.map(r => (
                    <button
                      key={r.fdcId}
                      onClick={() => { setSelected(r); fetchDetails(r); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 text-sm border border-gray-100"
                    >
                      <div className="font-medium text-gray-800 truncate">{r.description}</div>
                      {r.brandOwner && <div className="text-xs text-gray-400">{r.brandOwner}</div>}
                      {r.calories !== null && r.calories !== undefined && (
                        <div className="text-xs text-gray-500">{Math.round(r.calories)} kcal / 100g</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected food */}
              {selected && (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{selected.description}</div>
                      {selected.brandOwner && <div className="text-xs text-gray-400">{selected.brandOwner}</div>}
                    </div>
                    <button onClick={() => { setSelected(null); setResults([]); }} className="text-gray-400 text-xs">change</button>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="label">Serving size</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={serving}
                        onChange={e => setServing(Number(e.target.value))}
                      />
                    </div>
                    <div className="w-20">
                      <label className="label">Unit</label>
                      <select className="input" value={servingUnit} onChange={e => setServingUnit(e.target.value)}>
                        <option value="g">g</option>
                        <option value="oz">oz</option>
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="piece">piece</option>
                      </select>
                    </div>
                  </div>

                  {/* Macro preview */}
                  <div className="grid grid-cols-5 gap-1 bg-gray-50 rounded-xl p-3">
                    {[
                      { k: 'calories', label: 'Cal', color: 'text-orange-600', val: scaledMacro(selected.calories), unit: '' },
                      { k: 'protein', label: 'Prot', color: 'text-blue-600', val: scaledMacro(selected.protein), unit: 'g' },
                      { k: 'carbs', label: 'Carbs', color: 'text-purple-600', val: scaledMacro(selected.carbs), unit: 'g' },
                      { k: 'fat', label: 'Fat', color: 'text-yellow-600', val: scaledMacro(selected.fat), unit: 'g' },
                      { k: 'fiber', label: 'Fiber', color: 'text-green-600', val: scaledMacro(selected.fiber), unit: 'g' },
                    ].map(m => (
                      <div key={m.k} className="text-center">
                        <div className={`text-sm font-bold ${m.color}`}>
                          {m.val !== null ? `${m.val}${m.unit}` : '—'}
                        </div>
                        <div className="text-xs text-gray-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={handleAdd}
            disabled={adding || (!manualMode && !selected) || (manualMode && !manual.name)}
            className="btn-primary w-full mt-2"
          >
            {adding ? 'Adding…' : 'Add to Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
