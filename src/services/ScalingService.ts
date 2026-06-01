import type { RecipeWithDetails, ScaledRecipe, ScaledIngredient } from '../data/models';

function formatQuantity(quantity: number, unit: string): string {
  if (unit === 'piece' || unit === 'pieces' || unit === 'unidad' || unit === 'unidades') {
    return `${Math.round(quantity)} ${unit}`;
  }
  if (quantity < 0.1) return `${quantity.toFixed(2)} ${unit}`;
  if (quantity < 1) return `${quantity.toFixed(1)} ${unit}`;
  if (quantity % 1 < 0.1) return `${Math.round(quantity)} ${unit}`;
  return `${quantity.toFixed(1)} ${unit}`;
}

export function scaleRecipe(recipe: RecipeWithDetails, desiredServings: number): ScaledRecipe {
  const scaleFactor = desiredServings / recipe.baseServings;

  const scaledIngredients: ScaledIngredient[] = recipe.ingredients.map(ing => {
    const scaledQuantity = ing.scalable ? ing.quantity * scaleFactor : ing.quantity;
    return {
      ...ing,
      scaledQuantity,
      displayQuantity: formatQuantity(scaledQuantity, ing.unit),
    };
  });

  return {
    ...recipe,
    desiredServings,
    scaleFactor,
    scaledIngredients,
  };
}

export function scaleDuration(baseMinutes: number, scaleFactor: number): number {
  return Math.round(baseMinutes * Math.pow(scaleFactor, 0.7));
}

export function getScaledStepsDescription(
  steps: RecipeWithDetails['steps'],
  scaleFactor: number,
): { description: string; scaledDuration: number | null }[] {
  return steps.map(step => ({
    description: step.description,
    scaledDuration:
      step.isTimeDependent && step.durationMinutes != null
        ? scaleDuration(step.durationMinutes, scaleFactor)
        : step.durationMinutes,
  }));
}
