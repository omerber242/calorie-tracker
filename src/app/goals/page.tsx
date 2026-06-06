'use client';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { calculateMacros } from '@/lib/calculations';

const GOAL_TYPES = [
  { value: 'weight_loss', label: 'Weight Loss', desc: 'Caloric deficit ~20%', icon: '📉' },
  { value: 'maintenance', label: 'Maintenance', desc: 'Match your TDEE', icon: '⚖️' },
  { value: 'muscle_gain', label: 'Muscle Gain', desc: 'Caloric surplus ~10%', icon: '💪' },
  { value: 'custom', label: 'Custom', desc: 'Set your own targets', icon: '✏️' },
];
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Active', desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: '2x/day or physical job' },
];

export default function GoalsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [goalType, setGoalType] = useState('custom');
  const [activity, setActivity] = useState('moderate');
  const [sex, setSex] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof calculateMacros> | null>(null);

  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(({ goals }) => {
      if (!goals) return;
      setGoalType(goals.goal_type ?? 'custom');
      setActivity(goals.activity ?? 'moderate');
      setSex(goals.sex ?? '');
      setAge(goals.age?.toString() ?? '');
      setWeight(goals.weight_kg?.toString() ?? '');
      setHeight(goals.height_cm?.toString() ?? '');
      setCalories(goals.calories?.toString() ?? '');
      setProtein(goals.protein?.toString() ?? '');
      setCarbs(goals.carbs?.toString() ?? '');
      setFat(goals.fat?.toString() ?? '');
      setFiber(goals.fiber?.toString() ?? '');
    });
  }, []);

  function recalculate() {
    const result = calculateMacros({
      targetProtein: protein ? parseFloat(protein) : undefined,
      targetCalories: calories ? parseFloat(calories) : undefined,
      weight_kg: weight ? parseFloat(weight) : undefined,
      height_cm: height ? parseFloat(height) : undefined,
      age: age ? parseInt(age) : undefined,
      sex: sex as 'male' | 'female' | undefined,
      activity,
      goal_type: goalType as any,
    });
    setPreview(result);
    if (goalType !== 'custom') {
      setCalories(String(result.calories));
      setProtein(String(result.protein));
      setCarbs(String(result.carbs));
      setFat(String(result.fat));
      setFiber(String(result.fiber));
    }
  }

  async function save() {
    setSaving(true);
    await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: goalType,
        activity,
        sex: sex || undefined,
        age: age ? parseInt(age) : undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
        height_cm: height ? parseFloat(height) : undefined,
        calories: calories ? parseFloat(calories) : undefined,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        fiber: fiber ? parseFloat(fiber) : undefined,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">🎯 Nutrition Goals</h1>

        {/* Goal type */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800">Goal Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_TYPES.map(g => (
              <button
                key={g.value}
                onClick={() => setGoalType(g.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  goalType === g.value ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-xl mb-1">{g.icon}</div>
                <div className="text-sm font-semibold text-gray-800">{g.label}</div>
                <div className="text-xs text-gray-400">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile (used for TDEE calculation) */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800">Your Profile <span className="text-xs font-normal text-gray-400">(for auto-calculation)</span></h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sex</label>
              <select className="input" value={sex} onChange={e => setSex(e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="years" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input className="input" type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 75" />
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input className="input" type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175" />
            </div>
          </div>
          <div>
            <label className="label">Activity Level</label>
            <div className="space-y-1">
              {ACTIVITY_LEVELS.map(a => (
                <button
                  key={a.value}
                  onClick={() => setActivity(a.value)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm border transition-all ${
                    activity === a.value ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="font-medium">{a.label}</span>
                  <span className="text-xs text-gray-400">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={recalculate} className="btn-secondary w-full">
            ✨ Calculate Recommended Macros
          </button>
        </div>

        {/* Macro targets */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800">Daily Targets</h2>
          {preview && goalType !== 'custom' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              Calculated: {preview.calories} kcal · {preview.protein}g protein · {preview.carbs}g carbs · {preview.fat}g fat
            </div>
          )}
          <div className="space-y-3">
            {[
              { key: 'calories', label: 'Calories', unit: 'kcal', val: calories, set: setCalories, color: 'border-orange-300' },
              { key: 'protein', label: 'Protein', unit: 'g', val: protein, set: setProtein, color: 'border-blue-300', hint: 'Setting protein will auto-fill other macros' },
              { key: 'carbs', label: 'Carbohydrates', unit: 'g', val: carbs, set: setCarbs, color: 'border-purple-300' },
              { key: 'fat', label: 'Fat', unit: 'g', val: fat, set: setFat, color: 'border-yellow-300' },
              { key: 'fiber', label: 'Fiber', unit: 'g', val: fiber, set: setFiber, color: 'border-green-300' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label} ({f.unit})</label>
                {f.hint && <p className="text-xs text-gray-400 mb-1">{f.hint}</p>}
                <input
                  className={`input border-l-4 ${f.color}`}
                  type="number"
                  min="0"
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={`Daily target in ${f.unit}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full text-base py-3">
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Goals'}
        </button>
      </main>
    </div>
  );
}
