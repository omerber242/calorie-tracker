const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export interface MacroCalculationInput {
  targetProtein?: number;
  targetCalories?: number;
  weight_kg?: number;
  height_cm?: number;
  age?: number;
  sex?: 'male' | 'female';
  activity?: string;
  goal_type?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'custom';
}

export interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function calculateMacros(input: MacroCalculationInput): MacroResult {
  let tdee = 2000;

  if (input.weight_kg && input.height_cm && input.age && input.sex) {
    const bmr =
      input.sex === 'male'
        ? 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + 5
        : 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age - 161;
    const multiplier = ACTIVITY_MULTIPLIERS[input.activity ?? 'moderate'] ?? 1.55;
    tdee = Math.round(bmr * multiplier);
  }

  let targetCalories = input.targetCalories ?? tdee;
  if (!input.targetCalories) {
    if (input.goal_type === 'weight_loss') targetCalories = Math.round(tdee * 0.8);
    if (input.goal_type === 'muscle_gain') targetCalories = Math.round(tdee * 1.1);
  }

  const protein =
    input.targetProtein ??
    (input.weight_kg ? Math.round(input.weight_kg * 1.6) : Math.round((targetCalories * 0.25) / 4));

  const remaining = targetCalories - protein * 4;
  const fat = Math.round((remaining * 0.35) / 9);
  const carbs = Math.round((remaining * 0.65) / 4);
  const fiber = Math.round((targetCalories / 1000) * 14);

  return { calories: targetCalories, protein, carbs, fat, fiber };
}

export function sumMacros(
  entries: Array<{
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
  }>
): MacroResult {
  let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
  for (const e of entries) {
    calories += Number(e.calories) || 0;
    protein  += Number(e.protein)  || 0;
    carbs    += Number(e.carbs)    || 0;
    fat      += Number(e.fat)      || 0;
    fiber    += Number(e.fiber)    || 0;
  }
  return { calories, protein, carbs, fat, fiber };
}

export function scaleNutrients(
  per100g: Record<string, number>,
  servingGrams: number
): Record<string, number> {
  const scale = servingGrams / 100;
  return Object.fromEntries(
    Object.entries(per100g).map(([k, v]) => [k, Math.round(v * scale * 100) / 100])
  );
}
