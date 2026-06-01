import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '../../src/data/repositories/RepositoryProvider';
import { useRecipeStore } from '../../src/stores/useRecipeStore';
import { RecipeCard } from '../../src/components/recipe/RecipeCard';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/theme';
import type { Recipe } from '../../src/data/models';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipeRepository } = useRepositories();
  const { recipes, loading, loadRecipes } = useRecipeStore();

  useEffect(() => {
    loadRecipes(recipeRepository);
  }, []);

  const suggestions = useMemo(() => {
    if (recipes.length === 0) return [];
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [recipes]);

  const { dishes, desserts, bakery } = useMemo(() => {
    return {
      dishes: recipes.filter(r => r.type === 'dish'),
      desserts: recipes.filter(r => r.type === 'dessert' || r.type === 'bakery'),
      bakery: recipes.filter(r => r.type === 'bakery'),
    };
  }, [recipes]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>¡Buen provecho!</Text>
        <Text style={styles.subtitle}>¿Qué cocinamos hoy?</Text>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/recipe/add')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>Añadir{'\n'}Receta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.secondary }]}
            onPress={() => router.push('/recipes' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>👨‍🍳</Text>
            <Text style={styles.actionLabel}>¡A{'\n'}Cocinar!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primaryDark }]}
            onPress={() => router.push('/ingredients' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>🔎</Text>
            <Text style={styles.actionLabel}>Buscar por{'\n'}Ingredientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#7C3AED' }]}
            onPress={() => router.push('/chatbot')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionLabel}>Chef{'\n'}IA</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sugerencias para ti</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {suggestions.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                  variant="horizontal"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Type sections */}
        {dishes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platos principales</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {dishes.slice(0, 5).map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                  variant="horizontal"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {(desserts.length > 0 || bakery.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Postres y repostería</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {[...desserts, ...bakery].slice(0, 5).map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                  variant="horizontal"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {recipes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes recetas todavía</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/recipe/add')}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Añadir mi primera receta</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    ...shadows.sm,
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  horizontalScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});
