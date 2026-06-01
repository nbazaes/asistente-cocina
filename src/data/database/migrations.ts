import { db } from './index';

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_uri TEXT,
  base_servings INTEGER NOT NULL DEFAULT 2,
  prep_time INTEGER NOT NULL DEFAULT 0,
  cook_time INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  type TEXT NOT NULL DEFAULT 'dish',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  optional INTEGER NOT NULL DEFAULT 0,
  "group" TEXT,
  scalable INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  duration_minutes INTEGER,
  is_time_dependent INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_pantry (
  id TEXT PRIMARY KEY,
  ingredient_name TEXT NOT NULL UNIQUE
);
`;

export async function runMigrations(): Promise<void> {
  await db.run(createTablesSQL);
}
