import type { Difficulty, RecipeType } from '../data/models';

export interface ImportedRecipeData {
  name: string;
  description: string;
  imageUri: string | null;
  baseServings: number;
  prepTime: number;
  cookTime: number;
  difficulty: Difficulty;
  type: RecipeType;
  tags: string[];
  ingredients: { name: string; quantity: number; unit: string; optional: boolean; group: string | null; scalable: boolean }[];
  steps: { order: number; description: string; durationMinutes: number | null; isTimeDependent: boolean }[];
}

function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  return hours * 60 + minutes;
}

function parseServings(yieldStr: string): number {
  const num = parseInt(yieldStr, 10);
  return isNaN(num) ? 2 : Math.max(1, num);
}

function mapCategory(typeStr: string): RecipeType {
  const lower = (typeStr ?? '').toLowerCase();
  if (/postre|dessert|dulce|tarta|pastel|helado|flan/.test(lower)) return 'dessert';
  if (/bebida|drink|cóctel|batido|zumo|smoothie/.test(lower)) return 'drink';
  if (/pan|bakery|horneado|bollería|repostería/.test(lower)) return 'bakery';
  return 'dish';
}

function inferDifficulty(prepTime: number, cookTime: number): Difficulty {
  const total = prepTime + cookTime;
  if (total <= 20) return 'easy';
  if (total <= 60) return 'medium';
  return 'hard';
}

function parseIngredient(raw: string): { name: string; quantity: number; unit: string; optional: boolean } {
  const optional = /opcional|opcional/i.test(raw);
  const cleaned = raw.replace(/\(opcional\)|,\s*opcional/gi, '').trim();
  const match = cleaned.match(/^([\d.,]+)\s*([a-zA-ZñÑ]+[./]?\s*[a-zA-ZñÑ]*)?\s+(.+)/);
  if (match) {
    const qty = parseFloat(match[1].replace(',', '.'));
    const unit = (match[2] ?? '').trim().toLowerCase() || 'unidad';
    const name = match[3].trim();
    return { name, quantity: isNaN(qty) ? 0 : qty, unit, optional };
  }
  return { name: cleaned, quantity: 0, unit: 'unidad', optional };
}

export async function importFromUrl(url: string): Promise<ImportedRecipeData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se ha encontrado esta receta');
  }

  const html = await response.text();
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [...html.matchAll(jsonLdRegex)];

  let recipeData: Record<string, unknown> | null = null;

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item['@type'] === 'Recipe') {
          recipeData = item;
          break;
        }
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          const found = item['@graph'].find((g: Record<string, unknown>) => g['@type'] === 'Recipe');
          if (found) {
            recipeData = found;
            break;
          }
        }
      }
      if (recipeData) break;
    } catch {
      continue;
    }
  }

  if (!recipeData) {
    throw new Error('No se ha encontrado esta receta');
  }

  const name = String(recipeData.name ?? 'Receta importada');
  const description = String(recipeData.description ?? '');
  const prepTime = parseIsoDuration(String(recipeData.prepTime ?? 'PT0M'));
  const cookTime = parseIsoDuration(String(recipeData.cookTime ?? 'PT0M'));
  const baseServings = parseServings(String(recipeData.recipeYield ?? '2'));
  const type = mapCategory(String(recipeData.recipeCategory ?? ''));
  const difficulty = inferDifficulty(prepTime, cookTime);

  let tags: string[] = [];
  if (recipeData.keywords) {
    if (typeof recipeData.keywords === 'string') {
      tags = recipeData.keywords.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (Array.isArray(recipeData.keywords)) {
      tags = recipeData.keywords.map(String);
    }
  }

  interface SchemaRecipeIngredient {
    name: string;
    quantity: number;
    unit: string;
    optional: boolean;
    group: string | null;
    scalable: boolean;
  }

  interface SchemaStep {
    order: number;
    description: string;
    durationMinutes: number | null;
    isTimeDependent: boolean;
  }

  const ingredients: SchemaRecipeIngredient[] = [];
  const rawIngredients: string[] = Array.isArray(recipeData.recipeIngredient)
    ? recipeData.recipeIngredient.map(String)
    : [];

  let currentGroup: string | null = null;
  for (const raw of rawIngredients) {
    if (raw.startsWith('##') || raw.startsWith('**') || raw.startsWith('#')) {
      currentGroup = raw.replace(/^#+\s*/, '').replace(/\*+/g, '').trim() || null;
      continue;
    }
    const parsed = parseIngredient(raw);
    ingredients.push({
      ...parsed,
      group: currentGroup,
      scalable: !['unidad', 'unidades', 'al gusto', 'pizca'].includes(parsed.unit),
    });
  }

  const steps: SchemaStep[] = [];
  let stepIndex = 0;

  if (Array.isArray(recipeData.recipeInstructions)) {
    for (const inst of recipeData.recipeInstructions) {
      if (typeof inst === 'string') {
        steps.push({ order: stepIndex++, description: inst, durationMinutes: null, isTimeDependent: false });
      } else if (typeof inst === 'object' && inst !== null) {
        const si = inst as Record<string, unknown>;
        const text = String(si.text ?? si.description ?? '');
        if (text) {
          const durStr = si.duration ? parseIsoDuration(String(si.duration)) : null;
          steps.push({ order: stepIndex++, description: text, durationMinutes: durStr, isTimeDependent: durStr !== null });
        }
      }
    }
  }

  return {
    name,
    description,
    imageUri: null,
    baseServings,
    prepTime,
    cookTime,
    difficulty,
    type,
    tags,
    ingredients,
    steps,
  };
}
