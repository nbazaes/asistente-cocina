import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '../../src/data/repositories/RepositoryProvider';
import { useRecipeStore } from '../../src/stores/useRecipeStore';
import { RecipeCard } from '../../src/components/recipe/RecipeCard';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../src/theme';

const TYPE_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'dish', label: 'Platos' },
  { key: 'dessert', label: 'Postres' },
  { key: 'bakery', label: 'Horneado' },
  { key: 'drink', label: 'Bebidas' },
];

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipeRepository } = useRepositories();
  const { recipes, loading, loadRecipes } = useRecipeStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRecipes(recipeRepository);
  }, []);

  const filtered = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || r.type === filter;
    return matchesSearch && matchesFilter;
  });

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

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
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

      {loading ? (
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
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
