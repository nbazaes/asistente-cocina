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
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../src/theme';
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
        <Text style={styles.flourish}>✦</Text>
        <Text style={styles.greeting}>Bon appétit</Text>
        <Text style={styles.subtitle}>¿Qué horneamos hoy?</Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDot}>•</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/recipe/add')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.actionIcon}>+</Text>
            </View>
            <Text style={styles.actionLabel}>Nueva{'\n'}Receta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.secondary }]}
            onPress={() => router.push('/recipes' as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.actionIcon}>👨‍🍳</Text>
            </View>
            <Text style={styles.actionLabel}>¡A{'\n'}Cocinar!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.accentDark }]}
            onPress={() => router.push('/ingredients' as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.actionIcon}>🌿</Text>
            </View>
            <Text style={styles.actionLabel}>Por{'\n'}Ingredientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.lavender }]}
            onPress={() => router.push('/chatbot')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.actionIcon}>🤖</Text>
            </View>
            <Text style={styles.actionLabel}>Chef{'\n'}IA</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBullet}>◆</Text>
              <Text style={styles.sectionTitle}>Sugerencias del día</Text>
            </View>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBullet}>◆</Text>
              <Text style={styles.sectionTitle}>Platos principales</Text>
            </View>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBullet}>◆</Text>
              <Text style={styles.sectionTitle}>Postres & repostería</Text>
            </View>
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
            <Text style={styles.emptyIcon}>🧁</Text>
            <Text style={styles.emptyTitle}>Aún no tienes recetas</Text>
            <Text style={styles.emptyText}>Crea tu primera receta y empieza a cocinar</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/recipe/add')}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Crear mi primera receta</Text>
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
    paddingTop: spacing.lg,
  },
  flourish: {
    textAlign: 'center',
    fontSize: 20,
    color: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  greeting: {
    fontSize: fontSize.hero,
    fontFamily: fonts.display,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  dividerDot: {
    color: colors.primaryLight,
    fontSize: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    ...shadows.md,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionIcon: {
    fontSize: 18,
    color: colors.white,
  },
  actionLabel: {
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    fontFamily: fonts.body,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionBullet: {
    fontSize: 12,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
  },
  horizontalScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
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
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 6,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
    fontFamily: fonts.body,
  },
});
