'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import MacroRings from '@/components/MacroRings';
import AddFoodModal from '@/components/AddFoodModal';
import { sumMacros } from '@/lib/calculations';
import type { FoodLogEntry, NutritionGoals, MealType } from '@/types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addMeal, setAddMeal] = useState<MealType>('snack');
  const [today] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth');
      else setUser(user);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchEntries();
    fetchGoals();
  }, [user]);

  async function fetchEntries() {
    const res = await fetch(`/api/log?date=${today}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
  }

  async function fetchGoals() {
    const res = await fetch('/api/goals');
    const data = await res.json();
    setGoals(data.goals);
  }

  async function addEntry(entry: any) {
    await fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
    fetchEntries();
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/log?id=${id}`, { method: 'DELETE' });
    fetchEntries();
  }

  const totals = sumMacros(entries);
  const defaultGoals = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  const g = goals ?? defaultGoals;

  const byMeal = MEAL_ORDER.reduce((acc, m) => {
    acc[m] = entries.filter(e => e.meal_type === m);
    return acc;
  }, {} as Record<MealType, FoodLogEntry[]>);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Today</h1>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={() => { setAddMeal('snack'); setShowAdd(true); }} className="btn-primary">
            + Add Food
          </button>
        </div>

        {/* Macro rings */}
        <div className="card">
          <MacroRings
            calories={totals.calories} goalCalories={g.calories ?? 2000}
            protein={totals.protein} goalProtein={g.protein ?? 150}
            carbs={totals.carbs} goalCarbs={g.carbs ?? 200}
            fat={totals.fat} goalFat={g.fat ?? 65}
          />
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-800">{Math.round(totals.calories)}</div>
              <div className="text-xs text-gray-400">consumed</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{Math.max(0, Math.round((g.calories ?? 2000) - totals.calories))}</div>
              <div className="text-xs text-gray-400">remaining</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">{g.calories ?? 2000}</div>
              <div className="text-xs text-gray-400">goal</div>
            </div>
          </div>
        </div>

        {/* Meals */}
        {MEAL_ORDER.map(meal => (
          <div key={meal} className="card">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800 capitalize">
                {MEAL_ICONS[meal]} {meal}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {Math.round(sumMacros(byMeal[meal]).calories)} kcal
                </span>
                <button
                  onClick={() => { setAddMeal(meal); setShowAdd(true); }}
                  className="text-green-500 hover:text-green-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-green-50"
                >
                  +
                </button>
              </div>
            </div>

            {byMeal[meal].length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nothing logged yet</p>
            ) : (
              <div className="space-y-2">
                {byMeal[meal].map(entry => (
                  <div key={entry.id} className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{entry.food_name}</div>
                      <div className="text-xs text-gray-400">
                        {entry.serving_size}{entry.serving_unit} · P:{Math.round(entry.protein ?? 0)}g C:{Math.round(entry.carbs ?? 0)}g F:{Math.round(entry.fat ?? 0)}g
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-semibold text-orange-500">{Math.round(entry.calories ?? 0)}</span>
                      <button onClick={() => deleteEntry(entry.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>

      {showAdd && (
        <AddFoodModal
          onClose={() => setShowAdd(false)}
          onAdd={addEntry}
          defaultMeal={addMeal}
          defaultDate={today}
        />
      )}
    </div>
  );
}
