import { create } from 'zustand';
import type { Recipe, RecipeWithDetails } from '../data/models';
import { useRepositories } from '../data/repositories/RepositoryProvider';

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  loadRecipes: (repo: ReturnType<typeof useRepositories>['recipeRepository']) => Promise<void>;
  getRecipeById: (repo: ReturnType<typeof useRepositories>['recipeRepository'], id: string) => Promise<RecipeWithDetails | null>;
  createRecipe: (
    repo: ReturnType<typeof useRepositories>['recipeRepository'],
    data: Parameters<ReturnType<typeof useRepositories>['recipeRepository']['create']>[0],
    ingredients: Parameters<ReturnType<typeof useRepositories>['recipeRepository']['create']>[1],
    steps: Parameters<ReturnType<typeof useRepositories>['recipeRepository']['create']>[2],
  ) => Promise<RecipeWithDetails>;
  updateRecipe: (
    repo: ReturnType<typeof useRepositories>['recipeRepository'],
    recipe: Parameters<ReturnType<typeof useRepositories>['recipeRepository']['update']>[0],
    ingredients: Parameters<ReturnType<typeof useRepositories>['recipeRepository']['update']>[1],
    steps: Parameters<ReturnType<typeof useRepositories>['recipeRepository']['update']>[2],
  ) => Promise<RecipeWithDetails>;
  deleteRecipe: (repo: ReturnType<typeof useRepositories>['recipeRepository'], id: string) => Promise<void>;
  searchRecipes: (repo: ReturnType<typeof useRepositories>['recipeRepository'], query: string) => Promise<Recipe[]>;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [],
  loading: false,
  error: null,

  loadRecipes: async (repo) => {
    set({ loading: true, error: null });
    try {
      const recipes = await repo.getAll();
      set({ recipes, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  getRecipeById: async (repo, id) => {
    set({ loading: true, error: null });
    try {
      const recipe = await repo.getById(id);
      set({ loading: false });
      return recipe;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return null;
    }
  },

  createRecipe: async (repo, data, ingredients, steps) => {
    set({ loading: true, error: null });
    try {
      const recipe = await repo.create(data, ingredients, steps);
      await repo.getAll().then(recipes => set({ recipes, loading: false }));
      return recipe;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateRecipe: async (repo, recipe, ingredients, steps) => {
    set({ loading: true, error: null });
    try {
      const updated = await repo.update(recipe, ingredients, steps);
      await repo.getAll().then(recipes => set({ recipes, loading: false }));
      return updated;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteRecipe: async (repo, id) => {
    set({ loading: true, error: null });
    try {
      await repo.delete(id);
      const recipes = await repo.getAll();
      set({ recipes, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  searchRecipes: async (repo, query) => {
    set({ loading: true, error: null });
    try {
      const results = await repo.search(query);
      set({ loading: false });
      return results;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return [];
    }
  },
}));
