export type Difficulty = 'easy' | 'medium' | 'hard';
export type RecipeType = 'dish' | 'dessert' | 'drink' | 'bakery';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUri: string | null;
  baseServings: number;
  prepTime: number;
  cookTime: number;
  difficulty: Difficulty;
  type: RecipeType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number;
  unit: string;
  optional: boolean;
  group: string | null;
  scalable: boolean;
}

export interface Step {
  id: string;
  recipeId: string;
  order: number;
  description: string;
  durationMinutes: number | null;
  isTimeDependent: boolean;
}

export interface UserPantryItem {
  id: string;
  ingredientName: string;
}

export interface RecipeWithDetails extends Recipe {
  ingredients: Ingredient[];
  steps: Step[];
}

export interface ScaledRecipe extends RecipeWithDetails {
  desiredServings: number;
  scaleFactor: number;
  scaledIngredients: ScaledIngredient[];
}

export interface ScaledIngredient extends Ingredient {
  scaledQuantity: number;
  displayQuantity: string;
}
