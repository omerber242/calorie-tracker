export interface Macros {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar?: number | null;
  sodium?: number | null;
}

export interface FoodLogEntry extends Macros {
  id: string;
  user_id: string;
  food_name: string;
  food_id?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  serving_size: number;
  serving_unit: string;
  notes?: string;
  logged_at: string;
  log_date: string;
}

export interface NutritionGoals extends Macros {
  id: string;
  user_id: string;
  goal_type: 'custom' | 'weight_loss' | 'muscle_gain' | 'maintenance';
  activity?: string;
  weight_kg?: number;
  height_cm?: number;
  age?: number;
  sex?: 'male' | 'female';
}

export interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  value: number;
}

export interface RecipeIngredient extends Macros {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredient[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  source: 'text' | 'image';
  created_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
