import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { Recipe } from '../../data/models';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../theme';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  variant?: 'vertical' | 'horizontal';
}

const DIFFICULTY_EMOJI: Record<string, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};

const TYPE_EMOJI: Record<string, string> = {
  dish: '🍽️',
  dessert: '🍰',
  drink: '🥤',
  bakery: '🧁',
};

export function RecipeCard({ recipe, onPress, variant = 'vertical' }: RecipeCardProps) {
  const isVertical = variant === 'vertical';

  return (
    <TouchableOpacity
      style={[isVertical ? styles.vertical : styles.horizontal, shadows.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[isVertical ? styles.imageVertical : styles.imageHorizontal, { backgroundColor: colors.surfaceAlt }]}>
        {recipe.imageUri ? (
          <Image source={{ uri: recipe.imageUri }} style={isVertical ? styles.imageVertical : styles.imageHorizontal} />
        ) : (
          <Text style={isVertical ? styles.placeholderVertical : styles.placeholderHorizontal}>
            {TYPE_EMOJI[recipe.type] ?? '📋'}
          </Text>
        )}
      </View>
      <View style={isVertical ? styles.infoVertical : styles.infoHorizontal}>
        <Text style={styles.name} numberOfLines={2}>{recipe.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{DIFFICULTY_EMOJI[recipe.difficulty] ?? '⚪'}</Text>
          <Text style={styles.meta}>{recipe.prepTime + recipe.cookTime} min</Text>
          <Text style={styles.meta}>🍴 {recipe.baseServings}</Text>
        </View>
        {isVertical && recipe.description ? (
          <Text style={styles.description} numberOfLines={2}>{recipe.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  vertical: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: 160,
  },
  horizontal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: 160,
    marginRight: spacing.sm,
  },
  imageVertical: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHorizontal: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderVertical: {
    fontSize: 48,
  },
  placeholderHorizontal: {
    fontSize: 36,
  },
  infoVertical: {
    padding: spacing.sm,
  },
  infoHorizontal: {
    padding: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    lineHeight: 15,
  },
});
