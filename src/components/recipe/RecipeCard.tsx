import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { Recipe } from '../../data/models';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../theme';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  variant?: 'vertical' | 'horizontal';
}

const DIFFICULTY_EMOJI: Record<string, string> = {
  easy: '●',
  medium: '●●',
  hard: '●●●',
};

const TYPE_EMOJI: Record<string, string> = {
  dish: '🍽️',
  dessert: '🍰',
  drink: '🥤',
  bakery: '🧁',
};

const TYPE_BG: Record<string, string> = {
  dish: colors.surfaceRose,
  dessert: colors.surfaceLavender,
  drink: colors.surfaceMint,
  bakery: colors.surfaceButter,
};

export function RecipeCard({ recipe, onPress, variant = 'vertical' }: RecipeCardProps) {
  const isVertical = variant === 'vertical';
  const bgColor = TYPE_BG[recipe.type] ?? colors.surfaceAlt;

  return (
    <TouchableOpacity
      style={[isVertical ? styles.vertical : styles.horizontal, shadows.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[isVertical ? styles.imageVertical : styles.imageHorizontal, { backgroundColor: bgColor }]}>
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
          <Text style={[styles.metaDifficulty, { color: recipe.difficulty === 'easy' ? colors.success : recipe.difficulty === 'hard' ? colors.error : colors.warning }]}>
            {DIFFICULTY_EMOJI[recipe.difficulty] ?? '●'}
          </Text>
          <Text style={styles.meta}>· {recipe.prepTime + recipe.cookTime} min</Text>
          <Text style={styles.meta}>· {recipe.baseServings} 🍴</Text>
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
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  horizontal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: 165,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
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
    fontSize: 38,
  },
  infoVertical: {
    padding: spacing.sm + 2,
  },
  infoHorizontal: {
    padding: spacing.sm + 2,
  },
  name: {
    fontSize: fontSize.sm + 1,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaDifficulty: {
    fontSize: 9,
    letterSpacing: -1,
  },
  meta: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },
  description: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textLight,
    marginTop: 4,
    lineHeight: 15,
  },
});
