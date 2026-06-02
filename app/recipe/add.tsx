import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepositories } from '../../src/data/repositories/RepositoryProvider';
import { useRecipeStore } from '../../src/stores/useRecipeStore';
import type { Ingredient, Step } from '../../src/data/models';
import { generateId } from '../../src/data/repositories/local/helpers';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../src/theme';

type FormStep = 'info' | 'ingredients' | 'steps';

const TYPES = [
  { key: 'dish', label: 'Plato' },
  { key: 'dessert', label: 'Postre' },
  { key: 'bakery', label: 'Horneado' },
  { key: 'drink', label: 'Bebida' },
];

const DIFFICULTIES = [
  { key: 'easy', label: 'Fácil' },
  { key: 'medium', label: 'Media' },
  { key: 'hard', label: 'Difícil' },
];

interface IngredientForm extends Omit<Ingredient, 'id' | 'recipeId'> {
  localId: string;
}

interface StepForm extends Omit<Step, 'id' | 'recipeId'> {
  localId: string;
}

export default function AddRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipeRepository } = useRepositories();
  const { createRecipe } = useRecipeStore();
  const [step, setStep] = useState<FormStep>('info');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('dish');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [baseServings, setBaseServings] = useState('2');
  const [prepTime, setPrepTime] = useState('15');
  const [cookTime, setCookTime] = useState('30');
  const [tags, setTags] = useState('');

  const [ingredients, setIngredients] = useState<IngredientForm[]>([
    { localId: generateId(), name: '', quantity: 0, unit: '', optional: false, group: null, scalable: true },
  ]);

  const [steps, setSteps] = useState<StepForm[]>([
    { localId: generateId(), order: 0, description: '', durationMinutes: null, isTimeDependent: false },
  ]);

  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { localId: generateId(), name: '', quantity: 0, unit: '', optional: false, group: null, scalable: true },
    ]);
  };

  const removeIngredient = (localId: string) => {
    if (ingredients.length <= 1) return;
    setIngredients(prev => prev.filter(i => i.localId !== localId));
  };

  const updateIngredient = (localId: string, field: keyof IngredientForm, value: unknown) => {
    setIngredients(prev => prev.map(i => (i.localId === localId ? { ...i, [field]: value } : i)));
  };

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      { localId: generateId(), order: prev.length, description: '', durationMinutes: null, isTimeDependent: false },
    ]);
  };

  const removeStep = (localId: string) => {
    if (steps.length <= 1) return;
    setSteps(prev =>
      prev.filter(s => s.localId !== localId).map((s, idx) => ({ ...s, order: idx })),
    );
  };

  const updateStep = (localId: string, field: keyof StepForm, value: unknown) => {
    setSteps(prev => prev.map(s => (s.localId === localId ? { ...s, [field]: value } : s)));
  };

  const validateInfo = (): boolean => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return false; }
    if (!baseServings || parseInt(baseServings, 10) < 1) { Alert.alert('Error', 'Número de porciones inválido'); return false; }
    return true;
  };

  const validateIngredients = (): boolean => {
    const valid = ingredients.filter(i => i.name.trim() && i.quantity > 0);
    if (valid.length === 0) { Alert.alert('Error', 'Añade al menos un ingrediente válido'); return false; }
    return true;
  };

  const validateSteps = (): boolean => {
    const valid = steps.filter(s => s.description.trim());
    if (valid.length === 0) { Alert.alert('Error', 'Añade al menos un paso'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateInfo() || !validateIngredients() || !validateSteps()) return;

    setSaving(true);
    try {
      const validIngredients = ingredients.filter(i => i.name.trim() && i.quantity > 0);
      const validSteps = steps
        .filter(s => s.description.trim())
        .map((s, idx) => ({ ...s, order: idx }));

      await createRecipe(
        recipeRepository,
        {
          name: name.trim(),
          description: description.trim(),
          imageUri: null,
          baseServings: parseInt(baseServings, 10),
          prepTime: parseInt(prepTime, 10) || 0,
          cookTime: parseInt(cookTime, 10) || 0,
          difficulty: difficulty as 'easy' | 'medium' | 'hard',
          type: type as 'dish' | 'dessert' | 'drink' | 'bakery',
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        },
        validIngredients.map(({ localId, ...ing }) => ing),
        validSteps.map(({ localId, ...st }) => st),
      );

      Alert.alert('¡Listo!', 'Receta creada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const stepLabels: Record<FormStep, string> = { info: 'Info', ingredients: 'Ingredientes', steps: 'Pasos' };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nueva receta</Text>
          <Text style={styles.headerAccent}>✦</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.stepIndicator}>
        {(Object.keys(stepLabels) as FormStep[]).map((s, i) => (
          <React.Fragment key={s}>
            <TouchableOpacity onPress={() => setStep(s)} style={styles.stepDotContainer}>
              <View style={[styles.stepDot, step === s && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step === s && styles.stepDotTextActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
                {stepLabels[s]}
              </Text>
            </TouchableOpacity>
            {i < 2 && <View style={[styles.stepLine, step === s || step === (Object.keys(stepLabels) as FormStep[])[i + 1] ? styles.stepLineActive : null]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 'info' && (
          <View style={styles.stepContent}>
            <Text style={styles.fieldLabel}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Tarta de manzana" placeholderTextColor={colors.textLight} />

            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Breve descripción..." placeholderTextColor={colors.textLight} multiline numberOfLines={3} />

            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.chipRow}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chip, type === t.key && styles.chipActive]}
                  onPress={() => setType(t.key)}
                >
                  <Text style={[styles.chipText, type === t.key && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Dificultad</Text>
            <View style={styles.chipRow}>
              {DIFFICULTIES.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.chip, difficulty === d.key && styles.chipActive]}
                  onPress={() => setDifficulty(d.key)}
                >
                  <Text style={[styles.chipText, difficulty === d.key && styles.chipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Porciones base</Text>
            <TextInput style={styles.input} value={baseServings} onChangeText={setBaseServings} keyboardType="numeric" placeholder="2" placeholderTextColor={colors.textLight} />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Preparación (min)</Text>
                <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Cocción (min)</Text>
                <TextInput style={styles.input} value={cookTime} onChangeText={setCookTime} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Etiquetas (separadas por coma)</Text>
            <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="Ej: horno, saludable, verano" placeholderTextColor={colors.textLight} />

            <TouchableOpacity
              style={[styles.nextBtn, !name.trim() && styles.nextBtnDisabled]}
              onPress={() => { if (validateInfo()) setStep('ingredients'); }}
              disabled={!name.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Siguiente: Ingredientes →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'ingredients' && (
          <View style={styles.stepContent}>
            {ingredients.map((ing, idx) => (
              <View key={ing.localId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Ingrediente {idx + 1}</Text>
                  {ingredients.length > 1 && (
                    <TouchableOpacity onPress={() => removeIngredient(ing.localId)}>
                      <Text style={styles.removeBtn}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  value={ing.name}
                  onChangeText={v => updateIngredient(ing.localId, 'name', v)}
                  placeholder="Nombre (ej: harina de trigo)"
                  placeholderTextColor={colors.textLight}
                />
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>Cantidad</Text>
                    <TextInput
                      style={styles.input}
                      value={ing.quantity ? String(ing.quantity) : ''}
                      onChangeText={v => updateIngredient(ing.localId, 'quantity', parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>Unidad</Text>
                    <TextInput
                      style={styles.input}
                      value={ing.unit}
                      onChangeText={v => updateIngredient(ing.localId, 'unit', v)}
                      placeholder="g, ml, unidad..."
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Grupo (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={ing.group ?? ''}
                  onChangeText={v => updateIngredient(ing.localId, 'group', v || null)}
                  placeholder="Ej: Masa, Relleno..."
                  placeholderTextColor={colors.textLight}
                />
                <View style={styles.switchRow}>
                  <TouchableOpacity
                    style={[styles.toggleChip, ing.scalable && styles.toggleChipActive]}
                    onPress={() => updateIngredient(ing.localId, 'scalable', !ing.scalable)}
                  >
                    <Text style={[styles.toggleChipText, ing.scalable && styles.toggleChipTextActive]}>
                      {ing.scalable ? '✓ Escala con porciones' : 'No escala'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleChip, ing.optional && styles.toggleChipActive]}
                    onPress={() => updateIngredient(ing.localId, 'optional', !ing.optional)}
                  >
                    <Text style={[styles.toggleChipText, ing.optional && styles.toggleChipTextActive]}>
                      {ing.optional ? 'Opcional' : 'Obligatorio'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
              <Text style={styles.addBtnText}>+ Añadir ingrediente</Text>
            </TouchableOpacity>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setStep('info')}>
                <Text style={styles.prevBtnText}>← Info</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => { if (validateIngredients()) setStep('steps'); }}
                activeOpacity={0.8}
              >
                <Text style={styles.nextBtnText}>Siguiente: Pasos →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'steps' && (
          <View style={styles.stepContent}>
            {steps.map((st, idx) => (
              <View key={st.localId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Paso {idx + 1}</Text>
                  {steps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(st.localId)}>
                      <Text style={styles.removeBtn}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={st.description}
                  onChangeText={v => updateStep(st.localId, 'description', v)}
                  placeholder="Describe este paso..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>Duración (min, opcional)</Text>
                    <TextInput
                      style={styles.input}
                      value={st.durationMinutes != null ? String(st.durationMinutes) : ''}
                      onChangeText={v => updateStep(st.localId, 'durationMinutes', v ? parseInt(v, 10) : null)}
                      keyboardType="numeric"
                      placeholder="-"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleChipLarge, st.isTimeDependent && styles.toggleChipActive]}
                    onPress={() => updateStep(st.localId, 'isTimeDependent', !st.isTimeDependent)}
                  >
                    <Text style={[styles.toggleChipText, st.isTimeDependent && styles.toggleChipTextActive]}>
                      {st.isTimeDependent ? '⏱ Tiempo escala con porciones' : 'Tiempo fijo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addStep}>
              <Text style={styles.addBtnText}>+ Añadir paso</Text>
            </TouchableOpacity>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setStep('ingredients')}>
                <Text style={styles.prevBtnText}>← Ingredientes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : '💾 Guardar receta'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  cancelBtn: {
    width: 70,
  },
  cancelBtnText: {
    color: colors.error,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
  },
  headerAccent: {
    fontSize: 14,
    color: colors.primary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  stepDotContainer: {
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
  },
  stepDotTextActive: {
    color: colors.white,
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.primaryDark,
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: colors.borderSoft,
    marginHorizontal: spacing.xs,
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: colors.primaryLight,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  stepContent: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.text,
  },
  removeBtn: {
    fontSize: 18,
  },
  switchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toggleChip: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  },
  toggleChipLarge: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleChipActive: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.primaryLight,
  },
  toggleChipText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  toggleChipTextActive: {
    color: colors.primaryDark,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addBtnText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  },
  prevBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
  },
  nextBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadows.sm,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontFamily: fonts.body,
    fontSize: fontSize.md,
  },
});
