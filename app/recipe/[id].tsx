import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '../../src/data/repositories/RepositoryProvider';
import { useRecipeStore } from '../../src/stores/useRecipeStore';
import { scaleRecipe, getScaledStepsDescription } from '../../src/services/ScalingService';
import { ServingSelector } from '../../src/components/recipe/ServingSelector';
import { ChatbotView, type RecipeContext } from '../../src/components/chat/ChatbotView';
import type { RecipeWithDetails, ScaledRecipe } from '../../src/data/models';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../src/theme';

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
  const [chatModalVisible, setChatModalVisible] = useState(false);

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

  const recipeContext = useMemo<RecipeContext | null>(() => {
    if (!recipe) return null;
    return {
      name: recipe.name,
      description: recipe.description ?? undefined,
      ingredients: recipe.ingredients
        .map((i) => `${i.quantity} ${i.unit} de ${i.name}${i.optional ? ' (opcional)' : ''}`)
        .join('; '),
      steps: recipe.steps
        .map((s, i) => `${i + 1}. ${s.description}${s.durationMinutes ? ` (${s.durationMinutes} min)` : ''}`)
        .join(' | '),
      difficulty: DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      baseServings: recipe.baseServings,
    };
  }, [recipe]);

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
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push(`/recipe/add?id=${recipe.id}`)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.flourish}>✦</Text>
        {recipe.description ? (
          <Text style={styles.description}>{recipe.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{DIFFICULTY_LABELS[recipe.difficulty]}</Text>
            <Text style={styles.metaLabel}>Dificultad</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{totalTime} min</Text>
            <Text style={styles.metaLabel}>Tiempo total</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.baseServings}</Text>
            <Text style={styles.metaLabel}>Rinde para</Text>
          </View>
        </View>

        <View style={styles.servingSection}>
          <Text style={styles.sectionTitle}>Porciones</Text>
          <ServingSelector value={servings} onChange={setServings} baseServing={recipe.baseServings} />
          {servings !== recipe.baseServings && (
            <Text style={styles.scaleNote}>
              ×{scaled.scaleFactor.toFixed(1)} de la receta original
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBullet}>◆</Text>
            <Text style={styles.sectionTitle}>
              Ingredientes
              {servings !== recipe.baseServings ? ` (×${scaled.scaleFactor.toFixed(1)})` : ''}
            </Text>
          </View>
          {groupedIngredients(scaled.scaledIngredients).map((group, gi) => (
            <View key={gi} style={styles.groupSection}>
              {group.name ? (
                <Text style={styles.groupName}>{group.name}</Text>
              ) : null}
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBullet}>◆</Text>
            <Text style={styles.sectionTitle}>Preparación</Text>
          </View>
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

      <TouchableOpacity
        style={[styles.chatFab, { bottom: 24 + insets.bottom }]}
        onPress={() => setChatModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.chatFabText}>✦</Text>
      </TouchableOpacity>

      <Modal
        visible={chatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <ChatbotView onClose={() => setChatModalVisible(false)} recipeContext={recipeContext} />
      </Modal>
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
    color: colors.primaryDark,
    fontSize: fontSize.md,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editBtn: {
    padding: spacing.sm,
  },
  editBtnText: {
    fontSize: 20,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
  deleteBtnText: {
    fontSize: 20,
  },
  notFound: {
    fontSize: fontSize.lg,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  backLink: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
  },
  recipeName: {
    fontSize: fontSize.hero,
    fontFamily: fonts.display,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  flourish: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.primaryLight,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.sm,
    gap: spacing.lg,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderSoft,
  },
  metaValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.primaryDark,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  servingSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.sm,
  },
  scaleNote: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionBullet: {
    fontSize: 12,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
  },
  groupSection: {
    marginBottom: spacing.sm,
  },
  groupName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    fontFamily: fonts.body,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  ingredientName: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
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
    fontFamily: fonts.body,
    color: colors.text,
  },
  ingredientQtyScaled: {
    color: colors.primaryDark,
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
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 22,
  },
  stepDuration: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  chatFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    elevation: 6,
  },
  chatFabText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
});
