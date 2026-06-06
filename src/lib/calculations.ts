/**
 * Calculate recommended daily macros from a target protein + activity profile.
 * Uses Mifflin-St Jeor for TDEE, then fills carbs/fat from remaining calories.
 */
export interface MacroCalculationInput {
  targetProtein?: number;       // g/day — anchors the calculation if provided
  targetCalories?: number;      // kcal/day — use this if set directly
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

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateMacros(input: MacroCalculationInput): MacroResult {
  let tdee = 2000; // fallback

  // Mifflin-St Jeor BMR
  if (input.weight_kg && input.height_cm && input.age && input.sex) {
    const bmr =
      input.sex === 'male'
        ? 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + 5
        : 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age - 161;

    const multiplier = ACTIVITY_MULTIPLIERS[input.activity ?? 'moderate'] ?? 1.55;
    tdee = Math.round(bmr * multiplier);
  }

  // Apply goal modifier
  let targetCalories = input.targetCalories ?? tdee;
  if (!input.targetCalories) {
    if (input.goal_type === 'weight_loss') targetCalories = Math.round(tdee * 0.8);
    if (input.goal_type === 'muscle_gain') targetCalories = Math.round(tdee * 1.1);
  }

  // Protein: 0.8 g/kg body weight default, or user-specified
  const protein =
    input.targetProtein ??
    (input.weight_kg ? Math.round(input.weight_kg * 1.6) : Math.round(targetCalories * 0.25 / 4));

  const proteinCals = protein * 4;
  const remaining = targetCalories - proteinCals;

  // 35% fat, 65% carbs from remaining
  const fat = Math.round((remaining * 0.35) / 9);
  const carbs = Math.round((remaining * 0.65) / 4);
  const fiber = Math.round(targetCalories / 1000 * 14); // 14g per 1000 kcal

  return { calories: targetCalories, protein, carbs, fat, fiber };
}

/** Sum all macros from an array of food log entries for a given day */
export function sumMacros(entries: Array<{
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
}>) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      protein: acc.protein + (e.protein ?? 0),
      carbs: acc.carbs + (e.carbs ?? 0),
      fat: acc.fat + (e.fat ?? 0),
      fiber: acc.fiber + (e.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/** Scale USDA nutrients from per-100g to a given serving */
export function scaleNutrients(
  per100g: Record<string, number>,
  servingGrams: number
): Record<string, number> {
  const scale = servingGrams / 100;
  return Object.fromEntries(
    Object.entries(per100g).map(([k, v]) => [k, Math.round(v * scale * 100) / 100])
  );
}
