import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '../../src/data/repositories/RepositoryProvider';
import { useRecipeStore } from '../../src/stores/useRecipeStore';
import { RecipeCard } from '../../src/components/recipe/RecipeCard';
import { matchingService, type MatchResult } from '../../src/services/MatchingService';
import type { UserPantryItem, Recipe, Ingredient } from '../../src/data/models';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../src/theme';

const TYPE_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'dish', label: 'Platos' },
  { key: 'dessert', label: 'Postres' },
  { key: 'bakery', label: 'Horneado' },
  { key: 'drink', label: 'Bebidas' },
];

const COMMON_INGREDIENTS = [
  'harina de trigo', 'huevos', 'leche entera', 'azúcar', 'mantequilla',
  'aceite de oliva', 'sal', 'patatas', 'cebolla', 'ajo',
  'tomates maduros', 'pechuga de pollo', 'arroz basmati', 'chocolate negro',
  'manzanas', 'canela en polvo', 'leche de coco', 'nueces',
  'pepino', 'pimiento verde', 'arroz redondo', 'curry en polvo',
  'vainilla', 'queso crema', 'fresas', 'nata para montar',
];

const SEARCH_MODES = [
  { key: 'name' as const, label: 'Nombre' },
  { key: 'categories' as const, label: 'Categorías' },
  { key: 'ingredients' as const, label: 'Ingredientes' },
];

type SearchMode = typeof SEARCH_MODES[number]['key'];

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipeRepository, pantryRepository } = useRepositories();
  const { recipes, loading, loadRecipes } = useRecipeStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchMode, setSearchMode] = useState<SearchMode>('name');

  const [pantry, setPantry] = useState<UserPantryItem[]>([]);
  const [ingredientResults, setIngredientResults] = useState<MatchResult[]>([]);
  const [showIngredientResults, setShowIngredientResults] = useState(false);
  const [ingredientSearching, setIngredientSearching] = useState(false);

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

  const handleIngredientSearch = useCallback(async () => {
    if (pantry.length === 0) return;
    setIngredientSearching(true);
    const fullRecipes: { recipe: Recipe; ingredients: Ingredient[] }[] = [];
    for (const recipe of recipes) {
      const detail = await recipeRepository.getById(recipe.id);
      if (detail) {
        fullRecipes.push({ recipe, ingredients: detail.ingredients });
      }
    }
    const matches = matchingService.matchByIngredients(fullRecipes, pantry);
    setIngredientResults(matches);
    setShowIngredientResults(true);
    setIngredientSearching(false);
  }, [recipes, pantry, recipeRepository]);

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    if (mode !== 'ingredients') {
      setShowIngredientResults(false);
    }
  };

  const filtered = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || r.type === filter;
    return matchesSearch && matchesFilter;
  });

  const inIngredientMode = searchMode === 'ingredients';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis recetas</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/recipe/add')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControl}>
          {SEARCH_MODES.map((mode, i) => {
            const active = searchMode === mode.key;
            return (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.segment,
                  active && styles.segmentActive,
                  i === 0 && styles.segmentFirst,
                  i === SEARCH_MODES.length - 1 && styles.segmentLast,
                ]}
                onPress={() => handleModeChange(mode.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {!inIngredientMode && (
        <>
          {searchMode === 'name' && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre..."
                placeholderTextColor={colors.textLight}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          )}

          {searchMode === 'categories' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filterContent}
            >
              {TYPE_FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {inIngredientMode && !showIngredientResults && (
        <>
          <View style={styles.pantrySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBullet}>◆</Text>
              <Text style={styles.sectionLabel}>
                {pantry.length > 0
                  ? `Tu selección · ${pantry.length}`
                  : 'Toca para añadir ingredientes'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
              contentContainerStyle={styles.chipContent}
            >
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

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBullet}>◆</Text>
            <Text style={styles.sectionLabel}>Ingredientes comunes</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.ingredientGrid}
            showsVerticalScrollIndicator={false}
          >
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
            {ingredientSearching ? (
              <View style={[styles.searchBtn, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.searchBtn, pantry.length === 0 && styles.searchBtnDisabled]}
                onPress={handleIngredientSearch}
                disabled={pantry.length === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.searchBtnText}>
                  Buscar recetas ({pantry.length} ingredientes)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {inIngredientMode && showIngredientResults && (
        <>
          <View style={styles.resultsHeader}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBullet}>◆</Text>
              <Text style={styles.sectionLabel}>
                {ingredientResults.length} recetas encontradas
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowIngredientResults(false)}>
              <Text style={styles.backLink}>← Cambiar selección</Text>
            </TouchableOpacity>
          </View>

          {ingredientResults.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Sin coincidencias</Text>
              <Text style={styles.emptyText}>
                Prueba con otros ingredientes
              </Text>
            </View>
          ) : (
            <FlatList
              data={ingredientResults}
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
                      <Text style={styles.tagLabel}>Tienes: </Text>
                      {item.matchingIngredients.slice(0, 4).map((ing, i) => (
                        <Text key={i} style={styles.tagGreen}>
                          {ing}{i < Math.min(item.matchingIngredients.length, 4) - 1 ? ', ' : ''}
                        </Text>
                      ))}
                      {item.matchingIngredients.length > 4 && (
                        <Text style={styles.tagGreen}> +{item.matchingIngredients.length - 4} más</Text>
                      )}
                    </View>
                    {item.missingIngredients.length > 0 && (
                      <View style={styles.ingredientTags}>
                        <Text style={styles.tagLabel}>Te falta: </Text>
                        {item.missingIngredients.slice(0, 3).map((ing, i) => (
                          <Text key={i} style={styles.tagRed}>
                            {ing}{i < Math.min(item.missingIngredients.length, 3) - 1 ? ', ' : ''}
                          </Text>
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
          )}
        </>
      )}

      {!inIngredientMode && (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'Sin resultados' : 'Sin recetas aún'}
            </Text>
            <Text style={styles.emptyText}>
              {search ? 'Prueba con otros términos' : 'Crea tu primera receta'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/recipe/add')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Añadir receta</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                variant="vertical"
              />
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        )
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fonts.display,
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
  },

  segmentedControlContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.md - 2,
  },
  segmentFirst: {},
  segmentLast: {},
  segmentActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  segmentText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
  },

  searchContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 6,
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  filterRow: {
    marginTop: spacing.md,
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
  },

  pantrySection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionBullet: {
    fontSize: 12,
    color: colors.primary,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  chipRow: {
    maxHeight: 42,
  },
  chipContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  chipTextActive: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  chipRemove: {
    color: 'rgba(255,255,255,0.7)',
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
    borderColor: colors.borderSoft,
  },
  ingredientChipSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.primaryLight,
  },
  ingredientChipText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.text,
  },
  ingredientChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  searchBtnDisabled: {
    opacity: 0.4,
  },
  searchBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
  },

  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  backLink: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontFamily: fonts.body,
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
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.sm,
    marginBottom: spacing.sm,
  },
  resultInfo: {
    gap: 4,
  },
  resultName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.text,
  },
  matchBar: {
    height: 6,
    backgroundColor: colors.borderSoft,
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
    fontFamily: fonts.body,
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
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  tagGreen: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.success,
  },
  tagRed: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.error,
  },

  grid: {
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontFamily: fonts.heading,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  emptyBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
    fontFamily: fonts.body,
  },
});
