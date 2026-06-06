'use client';
import { useEffect, useRef, useState } from 'react';
import Navigation from '@/components/Navigation';
import type { Recipe } from '@/types';

interface AnalyzedRecipe {
  name: string;
  servings: number;
  ingredients: Array<{
    name: string; amount: number; unit: string;
    calories: number; protein: number; carbs: number; fat: number; fiber: number;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  per_serving_calories: number;
  per_serving_protein: number;
  per_serving_carbs: number;
  per_serving_fat: number;
}

export default function RecipesPage() {
  const [tab, setTab] = useState<'analyze' | 'saved'>('analyze');
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [recipeText, setRecipeText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzedRecipe | null>(null);
  const [error, setError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [saving, setSaving] = useState(false);
  const [logServings, setLogServings] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab === 'saved') fetchSaved();
  }, [tab]);

  async function fetchSaved() {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setSavedRecipes(data.recipes ?? []);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function analyze() {
    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      let res: Response;
      if (inputMode === 'image' && image) {
        const fd = new FormData();
        fd.append('image', image);
        if (recipeText) fd.append('text', recipeText);
        res = await fetch('/api/recipe/analyze', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/recipe/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: recipeText }),
        });
      }

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error ?? 'Analysis failed');
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setAnalyzing(false);
  }

  async function saveRecipe() {
    if (!result) return;
    setSaving(true);
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: result.name,
        servings: result.servings,
        ingredients: result.ingredients,
        total_calories: result.total_calories,
        total_protein: result.total_protein,
        total_carbs: result.total_carbs,
        total_fat: result.total_fat,
        total_fiber: result.total_fiber,
        source: inputMode,
      }),
    });
    setSaving(false);
    setTab('saved');
    fetchSaved();
  }

  async function logRecipe(recipe: AnalyzedRecipe | Recipe) {
    const servings = logServings;
    const perServing = 'per_serving_calories' in recipe
      ? { cal: recipe.per_serving_calories, prot: recipe.per_serving_protein, carbs: recipe.per_serving_carbs, fat: recipe.per_serving_fat }
      : {
          cal: recipe.total_calories / (recipe.servings || 1),
          prot: recipe.total_protein / (recipe.servings || 1),
          carbs: recipe.total_carbs / (recipe.servings || 1),
          fat: recipe.total_fat / (recipe.servings || 1),
        };

    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_name: recipe.name,
        meal_type: 'snack',
        serving_size: servings,
        serving_unit: 'serving',
        calories: Math.round(perServing.cal * servings),
        protein: Math.round(perServing.prot * servings),
        carbs: Math.round(perServing.carbs * servings),
        fat: Math.round(perServing.fat * servings),
        log_date: new Date().toISOString().split('T')[0],
      }),
    });
    alert(`Logged ${servings} serving(s) of ${recipe.name} to today's log!`);
  }

  async function deleteRecipe(id: string) {
    await fetch(`/api/recipes?id=${id}`, { method: 'DELETE' });
    fetchSaved();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">🍽️ Recipe Analyzer</h1>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
          {(['analyze', 'saved'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'analyze' ? '✨ Analyze Recipe' : `📚 Saved (${savedRecipes.length})`}
            </button>
          ))}
        </div>

        {tab === 'analyze' && (
          <div className="space-y-4">
            {/* Input mode */}
            <div className="card space-y-3">
              <div className="flex gap-2">
                {(['text', 'image'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setInputMode(m)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      inputMode === m ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {m === 'text' ? '📝 Text / URL' : '📷 Photo'}
                  </button>
                ))}
              </div>

              {inputMode === 'image' && (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Recipe" className="w-full rounded-xl object-cover max-h-48" />
                      <button
                        onClick={() => { setImage(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 text-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors"
                    >
                      <div className="text-3xl mb-2">📷</div>
                      <div className="text-sm">Tap to upload a photo of your recipe or dish</div>
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="label">
                  {inputMode === 'image' ? 'Additional context (optional)' : 'Recipe or ingredients'}
                </label>
                <textarea
                  className="input min-h-[120px] resize-none"
                  value={recipeText}
                  onChange={e => setRecipeText(e.target.value)}
                  placeholder={inputMode === 'image'
                    ? "e.g. 'This is a pasta dish for 4 people'"
                    : "Paste a recipe, list ingredients, or describe a dish…\n\ne.g. 'Chicken stir fry: 200g chicken breast, 1 cup broccoli, 2 tbsp soy sauce, 1 tbsp oil'"}
                />
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

              <button
                onClick={analyze}
                disabled={analyzing || (!recipeText && !image)}
                className="btn-primary w-full"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span> Analyzing with AI…
                  </span>
                ) : '✨ Analyze Nutritional Values'}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="card space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{result.name}</h2>
                    <p className="text-sm text-gray-400">{result.servings} servings</p>
                  </div>
                  <button onClick={saveRecipe} disabled={saving} className="btn-secondary text-sm">
                    {saving ? '…' : '💾 Save'}
                  </button>
                </div>

                {/* Total macros */}
                <div className="grid grid-cols-5 bg-gray-50 rounded-xl p-3 text-center">
                  {[
                    { label: 'Total Cal', val: Math.round(result.total_calories), unit: '' },
                    { label: 'Protein', val: Math.round(result.total_protein), unit: 'g' },
                    { label: 'Carbs', val: Math.round(result.total_carbs), unit: 'g' },
                    { label: 'Fat', val: Math.round(result.total_fat), unit: 'g' },
                    { label: 'Fiber', val: Math.round(result.total_fiber), unit: 'g' },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-sm font-bold text-gray-800">{m.val}{m.unit}</div>
                      <div className="text-xs text-gray-400">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Per serving */}
                {result.per_serving_calories && (
                  <div className="text-sm text-gray-500 bg-blue-50 rounded-lg p-2 text-center">
                    Per serving: {Math.round(result.per_serving_calories)} kcal · {Math.round(result.per_serving_protein)}g P · {Math.round(result.per_serving_carbs)}g C · {Math.round(result.per_serving_fat)}g F
                  </div>
                )}

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm mb-2">Ingredients Breakdown</h3>
                  <div className="space-y-1.5">
                    {result.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between text-sm items-center">
                        <span className="text-gray-700">{ing.name} <span className="text-gray-400">({ing.amount}{ing.unit})</span></span>
                        <span className="text-gray-500 text-xs">{Math.round(ing.calories)} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Log button */}
                <div className="flex gap-2 items-center pt-2 border-t border-gray-100">
                  <label className="text-sm text-gray-600">Servings:</label>
                  <input
                    type="number" min="0.5" step="0.5" value={logServings}
                    onChange={e => setLogServings(parseFloat(e.target.value))}
                    className="input w-20"
                  />
                  <button onClick={() => logRecipe(result)} className="btn-primary flex-1">
                    📋 Log to Today
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'saved' && (
          <div className="space-y-3">
            {savedRecipes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📚</div>
                <p>No saved recipes yet. Analyze one to save it here!</p>
              </div>
            ) : (
              savedRecipes.map(recipe => (
                <div key={recipe.id} className="card space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                      <p className="text-xs text-gray-400">{recipe.servings} servings · {new Date(recipe.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => deleteRecipe(recipe.id)} className="text-gray-300 hover:text-red-400">✕</button>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span>🔥 {Math.round(recipe.total_calories)} kcal</span>
                    <span>💪 {Math.round(recipe.total_protein)}g P</span>
                    <span>🌾 {Math.round(recipe.total_carbs)}g C</span>
                    <span>🫒 {Math.round(recipe.total_fat)}g F</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number" min="0.5" step="0.5" defaultValue={1}
                      id={`srv-${recipe.id}`}
                      className="input w-20 text-sm"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(`srv-${recipe.id}`) as HTMLInputElement;
                        setLogServings(parseFloat(el?.value ?? '1'));
                        logRecipe(recipe);
                      }}
                      className="btn-primary text-sm flex-1"
                    >
                      📋 Log to Today
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
