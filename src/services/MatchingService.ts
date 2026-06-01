import type { Recipe, Ingredient, UserPantryItem } from '../data/models';

export interface MatchResult {
  recipe: Recipe;
  matchPercentage: number;
  matchingIngredients: string[];
  missingIngredients: string[];
}

export class MatchingService {
  matchByIngredients(
    recipes: { recipe: Recipe; ingredients: Ingredient[] }[],
    pantry: UserPantryItem[],
  ): MatchResult[] {
    const pantryNames = new Set(pantry.map(p => p.ingredientName.toLowerCase()));

    return recipes
      .map(({ recipe, ingredients }) => {
        const recipeIngredientNames = ingredients.map(i => i.name.toLowerCase());
        const matching = recipeIngredientNames.filter(name => pantryNames.has(name));
        const missing = recipeIngredientNames.filter(name => !pantryNames.has(name));
        const matchPercentage =
          recipeIngredientNames.length > 0
            ? Math.round((matching.length / recipeIngredientNames.length) * 100)
            : 0;

        return {
          recipe,
          matchPercentage,
          matchingIngredients: matching,
          missingIngredients: missing,
        };
      })
      .filter(r => r.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
}

export const matchingService = new MatchingService();
