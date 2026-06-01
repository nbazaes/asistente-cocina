import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  imageUri: text('image_uri'),
  baseServings: integer('base_servings').notNull().default(2),
  prepTime: integer('prep_time').notNull().default(0),
  cookTime: integer('cook_time').notNull().default(0),
  difficulty: text('difficulty').notNull().default('medium'),
  type: text('type').notNull().default('dish'),
  tags: text('tags').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: real('quantity').notNull().default(0),
  unit: text('unit').notNull().default(''),
  optional: integer('optional').notNull().default(0),
  group: text('group'),
  scalable: integer('scalable').notNull().default(1),
});

export const steps = sqliteTable('steps', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),
  description: text('description').notNull(),
  durationMinutes: integer('duration_minutes'),
  isTimeDependent: integer('is_time_dependent').notNull().default(0),
});

export const userPantry = sqliteTable('user_pantry', {
  id: text('id').primaryKey(),
  ingredientName: text('ingredient_name').notNull().unique(),
});
