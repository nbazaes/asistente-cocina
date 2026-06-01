import type { Recipe, RecipeWithDetails, Ingredient, Step } from '../../models';

export interface IRecipeRepository {
  getAll(): Promise<Recipe[]>;
  getById(id: string): Promise<RecipeWithDetails | null>;
  create(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>, ingredients: Omit<Ingredient, 'id' | 'recipeId'>[], steps: Omit<Step, 'id' | 'recipeId'>[]): Promise<RecipeWithDetails>;
  update(recipe: Recipe, ingredients: Ingredient[], steps: Step[]): Promise<RecipeWithDetails>;
  delete(id: string): Promise<void>;
  getByType(type: string): Promise<Recipe[]>;
  search(query: string): Promise<Recipe[]>;
}
