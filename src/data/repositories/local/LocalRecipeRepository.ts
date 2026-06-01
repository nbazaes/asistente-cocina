import { eq, like } from 'drizzle-orm';
import { db } from '../../database';
import { recipes, ingredients, steps } from '../../database/schema';
import type { IRecipeRepository } from '../interfaces/IRecipeRepository';
import type { Recipe, RecipeWithDetails, Ingredient, Step } from '../../models';
import { generateId } from './helpers';

function mapRecipe(row: typeof recipes.$inferSelect): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUri: row.imageUri,
    baseServings: row.baseServings,
    prepTime: row.prepTime,
    cookTime: row.cookTime,
    difficulty: row.difficulty as Recipe['difficulty'],
    type: row.type as Recipe['type'],
    tags: JSON.parse(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapIngredient(row: typeof ingredients.$inferSelect): Ingredient {
  return {
    id: row.id,
    recipeId: row.recipeId,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    optional: row.optional === 1,
    group: row.group,
    scalable: row.scalable === 1,
  };
}

function mapStep(row: typeof steps.$inferSelect): Step {
  return {
    id: row.id,
    recipeId: row.recipeId,
    order: row.order,
    description: row.description,
    durationMinutes: row.durationMinutes,
    isTimeDependent: row.isTimeDependent === 1,
  };
}

export class LocalRecipeRepository implements IRecipeRepository {
  async getAll(): Promise<Recipe[]> {
    const rows = await db.select().from(recipes).orderBy(recipes.updatedAt);
    return rows.map(mapRecipe);
  }

  async getById(id: string): Promise<RecipeWithDetails | null> {
    const recipeRows = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
    if (recipeRows.length === 0) return null;

    const ingredientRows = await db.select().from(ingredients).where(eq(ingredients.recipeId, id)).orderBy(ingredients.group);
    const stepRows = await db.select().from(steps).where(eq(steps.recipeId, id)).orderBy(steps.order);

    return {
      ...mapRecipe(recipeRows[0]),
      ingredients: ingredientRows.map(mapIngredient),
      steps: stepRows.map(mapStep),
    };
  }

  async create(
    recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
    recipeIngredients: Omit<Ingredient, 'id' | 'recipeId'>[],
    recipeSteps: Omit<Step, 'id' | 'recipeId'>[],
  ): Promise<RecipeWithDetails> {
    const now = new Date().toISOString();
    const recipeId = generateId();

    await db.insert(recipes).values({
      id: recipeId,
      name: recipe.name,
      description: recipe.description,
      imageUri: recipe.imageUri,
      baseServings: recipe.baseServings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      type: recipe.type,
      tags: JSON.stringify(recipe.tags),
      createdAt: now,
      updatedAt: now,
    });

    const mappedIngredients: Ingredient[] = [];
    for (const ing of recipeIngredients) {
      const ingId = generateId();
      await db.insert(ingredients).values({
        id: ingId,
        recipeId: recipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        optional: ing.optional ? 1 : 0,
        group: ing.group,
        scalable: ing.scalable ? 1 : 0,
      });
      mappedIngredients.push({ ...ing, id: ingId, recipeId });
    }

    const mappedSteps: Step[] = [];
    for (const step of recipeSteps) {
      const stepId = generateId();
      await db.insert(steps).values({
        id: stepId,
        recipeId: recipeId,
        order: step.order,
        description: step.description,
        durationMinutes: step.durationMinutes,
        isTimeDependent: step.isTimeDependent ? 1 : 0,
      });
      mappedSteps.push({ ...step, id: stepId, recipeId });
    }

    return {
      ...recipe,
      id: recipeId,
      createdAt: now,
      updatedAt: now,
      tags: recipe.tags,
      ingredients: mappedIngredients,
      steps: mappedSteps,
    };
  }

  async update(
    recipe: Recipe,
    recipeIngredients: Ingredient[],
    recipeSteps: Step[],
  ): Promise<RecipeWithDetails> {
    const now = new Date().toISOString();

    await db.update(recipes).set({
      name: recipe.name,
      description: recipe.description,
      imageUri: recipe.imageUri,
      baseServings: recipe.baseServings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      type: recipe.type,
      tags: JSON.stringify(recipe.tags),
      updatedAt: now,
    }).where(eq(recipes.id, recipe.id));

    await db.delete(ingredients).where(eq(ingredients.recipeId, recipe.id));
    await db.delete(steps).where(eq(steps.recipeId, recipe.id));

    const mappedIngredients: Ingredient[] = [];
    for (const ing of recipeIngredients) {
      await db.insert(ingredients).values({
        id: ing.id,
        recipeId: recipe.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        optional: ing.optional ? 1 : 0,
        group: ing.group,
        scalable: ing.scalable ? 1 : 0,
      });
      mappedIngredients.push(ing);
    }

    const mappedSteps: Step[] = [];
    for (const step of recipeSteps) {
      await db.insert(steps).values({
        id: step.id,
        recipeId: recipe.id,
        order: step.order,
        description: step.description,
        durationMinutes: step.durationMinutes,
        isTimeDependent: step.isTimeDependent ? 1 : 0,
      });
      mappedSteps.push(step);
    }

    return {
      ...recipe,
      updatedAt: now,
      ingredients: mappedIngredients,
      steps: mappedSteps,
    };
  }

  async delete(id: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async getByType(type: string): Promise<Recipe[]> {
    const rows = await db.select().from(recipes).where(eq(recipes.type, type)).orderBy(recipes.updatedAt);
    return rows.map(mapRecipe);
  }

  async search(query: string): Promise<Recipe[]> {
    const rows = await db.select().from(recipes).where(like(recipes.name, `%${query}%`)).orderBy(recipes.updatedAt);
    return rows.map(mapRecipe);
  }
}
