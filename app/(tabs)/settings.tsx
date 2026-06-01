import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { openAIKey, setOpenAIKey, clearOpenAIKey } = useSettingsStore();
  const [keyInput, setKeyInput] = React.useState(openAIKey);

  const handleSave = () => {
    setOpenAIKey(keyInput.trim());
    Alert.alert('Guardado', 'API key de OpenAI configurada correctamente.');
  };

  const handleClear = () => {
    clearOpenAIKey();
    setKeyInput('');
    Alert.alert('Eliminado', 'API key eliminada.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Ajustes</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Chef IA</Text>
          <Text style={styles.description}>
            Configura tu API key de OpenAI para usar el asistente de cocina con inteligencia artificial.
            Puedes obtener una en{' '}
            <Text style={styles.link}>platform.openai.com/api-keys</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="sk-..."
            placeholderTextColor={colors.textLight}
            value={keyInput}
            onChangeText={setKeyInput}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
            {openAIKey ? (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
                <Text style={styles.clearBtnText}>Eliminar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {openAIKey ? (
            <Text style={styles.statusOk}>✓ API key configurada</Text>
          ) : (
            <Text style={styles.statusMissing}>Sin API key configurada</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Acerca de</Text>
          <Text style={styles.description}>
            Asistente de Cocina v1.0.0{'\n'}
            Una app para gestionar tus recetas, escalar porciones y encontrar platos según los ingredientes que tienes en casa.
          </Text>
        </View>
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
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  clearBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  clearBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  statusOk: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  statusMissing: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
});
