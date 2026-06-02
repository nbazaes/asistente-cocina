import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ImportedRecipeData } from '../../services/RecipeImportService';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../theme';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

interface Props {
  visible: boolean;
  recipe: ImportedRecipeData | null;
  importUrl?: string;
  onClose: () => void;
  onSave: (data: ImportedRecipeData, importUrl?: string) => void;
}

export function RecipePreviewModal({ visible, recipe, importUrl, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();

  if (!recipe) return null;

  const totalTime = recipe.prepTime + recipe.cookTime;

  const grouped = groupIngredients(recipe.ingredients);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.name}
          </Text>
          <TouchableOpacity onPress={() => onSave(recipe, importUrl)} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        {importUrl ? (
          <View style={styles.importBanner}>
            <Text style={styles.importBannerText}>
              Importada de {new URL(importUrl).hostname}
            </Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.flourish}>✦</Text>

          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{DIFFICULTY_LABELS[recipe.difficulty] ?? 'Media'}</Text>
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
              <Text style={styles.metaLabel}>Porciones</Text>
            </View>
          </View>

          {recipe.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {recipe.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBullet}>◆</Text>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
            </View>
            {grouped.map((group, gi) => (
              <View key={gi} style={styles.groupSection}>
                {group.groupName ? (
                  <Text style={styles.groupName}>{group.groupName}</Text>
                ) : null}
                {group.items.map((ing, ii) => (
                  <View key={ii} style={styles.ingredientRow}>
                    <Text style={styles.ingredientName}>
                      {ing.optional ? '• ' : ''}{ing.name}
                      {ing.optional ? <Text style={styles.optionalLabel}> (opcional)</Text> : null}
                    </Text>
                    <Text style={styles.ingredientQty}>
                      {ing.quantity > 0 ? `${ing.quantity} ${ing.unit}` : '—'}
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
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {step.durationMinutes != null && step.durationMinutes > 0 ? (
                    <Text style={styles.stepDuration}>⏱ {step.durationMinutes} min</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: spacing.lg }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomSaveBtn}
            onPress={() => onSave(recipe, importUrl)}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomSaveBtnText}>Guardar receta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface GroupedIngredients {
  groupName: string | null;
  items: ImportedRecipeData['ingredients'];
}

function groupIngredients(ingredients: ImportedRecipeData['ingredients']): GroupedIngredients[] {
  const map = new Map<string | null, ImportedRecipeData['ingredients']>();
  for (const ing of ingredients) {
    const key = ing.group ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ing);
  }
  return Array.from(map.entries()).map(([groupName, items]) => ({ groupName, items }));
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  importBanner: {
    backgroundColor: colors.surfaceMint,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  importBannerText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.primaryDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.md,
  },
  recipeName: {
    fontSize: fontSize.xl,
    fontFamily: fonts.display,
    fontWeight: '700',
    color: colors.text,
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
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.sm,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.surfaceRose,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.lg,
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
    fontSize: fontSize.lg,
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
  optionalLabel: {
    color: colors.textLight,
    fontStyle: 'italic',
  },
  ingredientQty: {
    fontSize: fontSize.md,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: colors.text,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  bottomBar: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  bottomSaveBtn: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  bottomSaveBtnText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
});
