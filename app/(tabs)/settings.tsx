import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { AI_PROVIDERS, getProvider } from '../../src/services/AIProviderConfig';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    apiKey,
    providerId,
    modelId,
    setApiKey,
    clearApiKey,
    setProviderId,
    setModelId,
  } = useSettingsStore();
  const [keyInput, setKeyInput] = React.useState(apiKey);
  const [showProviderPicker, setShowProviderPicker] = React.useState(false);
  const [showModelPicker, setShowModelPicker] = React.useState(false);

  const provider = getProvider(providerId);

  const handleSave = () => {
    setApiKey(keyInput.trim());
    Alert.alert('Guardado', `API key configurada para ${provider.name}.`);
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput('');
    Alert.alert('Eliminado', 'API key eliminada.');
  };

  const handleSelectProvider = (id: string) => {
    setProviderId(id);
    setShowProviderPicker(false);
  };

  const handleSelectModel = (id: string) => {
    setModelId(id);
    setShowModelPicker(false);
  };

  const currentModel = provider.models.find(m => m.id === modelId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Ajustes</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Chef IA</Text>
          <Text style={styles.description}>
            Configura tu API key de IA para usar el asistente de cocina.
            Soporta OpenAI, OpenRouter, DeepSeek, Groq, Mistral, Gemini, Together y xAI.
          </Text>

          <Text style={styles.label}>Proveedor</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowProviderPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.pickerText}>{provider.name}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          <Modal visible={showProviderPicker} transparent animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowProviderPicker(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar proveedor</Text>
                <FlatList
                  data={AI_PROVIDERS}
                  keyExtractor={p => p.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        item.id === providerId && styles.modalItemSelected,
                      ]}
                      onPress={() => handleSelectProvider(item.id)}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          item.id === providerId && styles.modalItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.id === providerId ? (
                        <Text style={styles.modalItemCheck}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <Text style={styles.label}>Modelo</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowModelPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.pickerText}>
              {currentModel?.name ?? modelId}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          <Modal visible={showModelPicker} transparent animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowModelPicker(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar modelo</Text>
                <FlatList
                  data={provider.models}
                  keyExtractor={m => m.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        item.id === modelId && styles.modalItemSelected,
                      ]}
                      onPress={() => handleSelectModel(item.id)}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          item.id === modelId && styles.modalItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.id === modelId ? (
                        <Text style={styles.modalItemCheck}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <Text style={styles.label}>API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="sk-... / gsk_... / xai-..."
            placeholderTextColor={colors.textLight}
            value={keyInput}
            onChangeText={setKeyInput}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.linkHint}>
            Puedes obtener una en{' '}
            <Text style={styles.link}>{provider.websiteURL}</Text>
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
            {apiKey ? (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>Eliminar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {apiKey ? (
            <Text style={styles.statusOk}>✓ API key configurada</Text>
          ) : (
            <Text style={styles.statusMissing}>Sin API key configurada</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Acerca de</Text>
          <Text style={styles.description}>
            Asistente de Cocina v1.0.0{'\n'}
            Una app para gestionar tus recetas, escalar porciones y encontrar
            platos según los ingredientes que tienes en casa.
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
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  picker: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  pickerArrow: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  linkHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
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
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    width: '100%',
    maxHeight: '60%',
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  modalItemSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  modalItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalItemCheck: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});
