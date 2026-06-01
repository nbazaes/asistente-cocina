import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '../../src/data/repositories/RepositoryProvider';
import { useRecipeStore } from '../../src/stores/useRecipeStore';
import { scaleRecipe, getScaledStepsDescription } from '../../src/services/ScalingService';
import { ServingSelector } from '../../src/components/recipe/ServingSelector';
import type { RecipeWithDetails, ScaledRecipe } from '../../src/data/models';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/theme';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipeRepository } = useRepositories();
  const { deleteRecipe } = useRecipeStore();
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(0);

  useEffect(() => {
    if (!id) return;
    recipeRepository.getById(id).then(r => {
      setRecipe(r);
      if (r) setServings(r.baseServings);
      setLoading(false);
    });
  }, [id]);

  const scaled = useMemo<ScaledRecipe | null>(() => {
    if (!recipe) return null;
    return scaleRecipe(recipe, servings);
  }, [recipe, servings]);

  const scaledSteps = useMemo(() => {
    if (!recipe) return [];
    return getScaledStepsDescription(recipe.steps, servings / recipe.baseServings);
  }, [recipe, servings]);

  const handleDelete = () => {
    if (!recipe) return;
    Alert.alert(
      'Eliminar receta',
      `¿Seguro que quieres eliminar "${recipe.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteRecipe(recipeRepository, recipe.id);
            router.back();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!recipe || !scaled) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.notFound}>Receta no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.recipeName}>{recipe.name}</Text>
        {recipe.description ? (
          <Text style={styles.description}>{recipe.description}</Text>
        ) : null}

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{DIFFICULTY_LABELS[recipe.difficulty]}</Text>
            <Text style={styles.metaLabel}>Dificultad</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{totalTime}m</Text>
            <Text style={styles.metaLabel}>Tiempo total</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.baseServings}</Text>
            <Text style={styles.metaLabel}>Base</Text>
          </View>
        </View>

        {/* Serving selector */}
        <View style={styles.servingSection}>
          <Text style={styles.sectionTitle}>Porciones</Text>
          <ServingSelector value={servings} onChange={setServings} baseServing={recipe.baseServings} />
          {servings !== recipe.baseServings && (
            <Text style={styles.scaleNote}>
              Factor de escala: ×{scaled.scaleFactor.toFixed(1)}
            </Text>
          )}
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ingredientes {servings !== recipe.baseServings ? `(×${scaled.scaleFactor.toFixed(1)})` : ''}
          </Text>
          {groupedIngredients(scaled.scaledIngredients).map((group, gi) => (
            <View key={gi} style={styles.groupSection}>
              {group.name ? <Text style={styles.groupName}>{group.name}</Text> : null}
              {group.items.map(ing => (
                <View key={ing.id} style={styles.ingredientRow}>
                  <Text style={styles.ingredientName}>
                    {ing.optional ? '• ' : ''}{ing.name}
                    {ing.optional ? <Text style={styles.optional}> (opcional)</Text> : null}
                  </Text>
                  <Text style={[
                    styles.ingredientQty,
                    servings !== recipe.baseServings && ing.scalable && styles.ingredientQtyScaled,
                  ]}>
                    {ing.displayQuantity}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparación</Text>
          {scaledSteps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepDescription}>{step.description}</Text>
                {step.scaledDuration != null && step.scaledDuration > 0 && (
                  <Text style={styles.stepDuration}>⏱ {step.scaledDuration} min</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

interface GroupedIngredients {
  name: string | null;
  items: ScaledRecipe['scaledIngredients'];
}

function groupedIngredients(ingredients: ScaledRecipe['scaledIngredients']): GroupedIngredients[] {
  const map = new Map<string | null, ScaledRecipe['scaledIngredients']>();
  for (const ing of ingredients) {
    const key = ing.group ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ing);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backBtn: {
    paddingVertical: spacing.sm,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: spacing.sm,
  },
  deleteBtnText: {
    fontSize: 20,
  },
  notFound: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  backLink: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  recipeName: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  servingSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  scaleNote: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  groupSection: {
    marginBottom: spacing.sm,
  },
  groupName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingredientName: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  optional: {
    color: colors.textLight,
    fontStyle: 'italic',
  },
  ingredientQty: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  ingredientQtyScaled: {
    color: colors.primary,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  stepDuration: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
});
