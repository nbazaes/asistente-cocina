import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '../../src/data/repositories/RepositoryProvider';
import { useRecipeStore } from '../../src/stores/useRecipeStore';
import { matchingService, type MatchResult } from '../../src/services/MatchingService';
import type { UserPantryItem, Recipe, Ingredient, RecipeWithDetails } from '../../src/data/models';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/theme';

const COMMON_INGREDIENTS = [
  'harina de trigo', 'huevos', 'leche entera', 'azúcar', 'mantequilla',
  'aceite de oliva', 'sal', 'patatas', 'cebolla', 'ajo',
  'tomates maduros', 'pechuga de pollo', 'arroz basmati', 'chocolate negro',
  'manzanas', 'canela en polvo', 'leche de coco', 'nueces',
  'pepino', 'pimiento verde', 'arroz redondo', 'curry en polvo',
];

export default function IngredientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipeRepository, pantryRepository } = useRepositories();
  const { recipes, loading, loadRecipes } = useRecipeStore();
  const [pantry, setPantry] = useState<UserPantryItem[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadRecipes(recipeRepository);
    pantryRepository.getAll().then(setPantry);
  }, []);

  const pantryNames = pantry.map(p => p.ingredientName);

  const toggleIngredient = useCallback(async (name: string) => {
    const existing = pantry.find(p => p.ingredientName === name.toLowerCase());
    if (existing) {
      await pantryRepository.remove(existing.id);
    } else {
      await pantryRepository.add(name);
    }
    const updated = await pantryRepository.getAll();
    setPantry(updated);
  }, [pantry, pantryRepository]);

  const handleSearch = useCallback(async () => {
    const fullRecipes: { recipe: Recipe; ingredients: Ingredient[] }[] = [];
    for (const recipe of recipes) {
      const detail = await recipeRepository.getById(recipe.id);
      if (detail) {
        fullRecipes.push({ recipe, ingredients: detail.ingredients });
      }
    }
    const matches = matchingService.matchByIngredients(fullRecipes, pantry);
    setResults(matches);
    setShowResults(true);
  }, [recipes, pantry, recipeRepository]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar por ingredientes</Text>
        <Text style={styles.subtitle}>Selecciona lo que tienes en casa</Text>
      </View>

      {!showResults ? (
        <>
          <View style={styles.pantrySection}>
            <Text style={styles.sectionLabel}>
              {pantry.length > 0
                ? `Ingredientes seleccionados (${pantry.length})`
                : 'Toca para añadir ingredientes'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
              {pantry.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.chipActive}
                  onPress={() => toggleIngredient(item.ingredientName)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipTextActive}>{item.ingredientName}</Text>
                  <Text style={styles.chipRemove}> ✕</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.sectionLabel}>Ingredientes comunes</Text>
          <ScrollView contentContainerStyle={styles.ingredientGrid} showsVerticalScrollIndicator={false}>
            {COMMON_INGREDIENTS.map(name => {
              const selected = pantryNames.includes(name.toLowerCase());
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.ingredientChip, selected && styles.ingredientChipSelected]}
                  onPress={() => toggleIngredient(name)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.ingredientChipText, selected && styles.ingredientChipTextSelected]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.searchBtn, pantry.length === 0 && styles.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={pantry.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.searchBtnText}>Buscar recetas ({pantry.length} ingredientes)</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionLabel}>
              {results.length} recetas encontradas
            </Text>
            <TouchableOpacity onPress={() => setShowResults(false)}>
              <Text style={styles.backLink}>← Cambiar ingredientes</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={results}
            keyExtractor={item => item.recipe.id}
            contentContainerStyle={styles.resultsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => router.push(`/recipe/${item.recipe.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.recipe.name}</Text>
                  <View style={styles.matchBar}>
                    <View style={[styles.matchFill, { width: `${item.matchPercentage}%` }]} />
                  </View>
                  <Text style={styles.matchText}>{item.matchPercentage}% de coincidencia</Text>
                  <View style={styles.ingredientTags}>
                    <Text style={styles.tagLabel}>✅ Tienes: </Text>
                    {item.matchingIngredients.slice(0, 4).map((ing, i) => (
                      <Text key={i} style={styles.tagGreen}>{ing}{i < Math.min(item.matchingIngredients.length, 4) - 1 ? ', ' : ''}</Text>
                    ))}
                    {item.matchingIngredients.length > 4 && (
                      <Text style={styles.tagGreen}> +{item.matchingIngredients.length - 4} más</Text>
                    )}
                  </View>
                  {item.missingIngredients.length > 0 && (
                    <View style={styles.ingredientTags}>
                      <Text style={styles.tagLabel}>❌ Te falta: </Text>
                      {item.missingIngredients.slice(0, 3).map((ing, i) => (
                        <Text key={i} style={styles.tagRed}>{ing}{i < Math.min(item.missingIngredients.length, 3) - 1 ? ', ' : ''}</Text>
                      ))}
                      {item.missingIngredients.length > 3 && (
                        <Text style={styles.tagRed}> +{item.missingIngredients.length - 3} más</Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pantrySection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  chipRow: {
    maxHeight: 40,
  },
  chipContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  chipTextActive: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  chipRemove: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginLeft: 2,
  },
  ingredientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: 100,
  },
  ingredientChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingredientChipSelected: {
    backgroundColor: colors.primaryLight + '30',
    borderColor: colors.primary,
  },
  ingredientChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  ingredientChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  searchBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backLink: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  resultsList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  resultInfo: {
    gap: 4,
  },
  resultName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  matchBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  matchFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  matchText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  ingredientTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tagGreen: {
    fontSize: fontSize.xs,
    color: colors.success,
  },
  tagRed: {
    fontSize: fontSize.xs,
    color: colors.error,
  },
});
