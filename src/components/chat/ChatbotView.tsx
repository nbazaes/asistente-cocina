import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendMessage, type AIToolResult, type ChatMessage } from '../../services/AIChatbotService';
import { importFromUrl, type ImportedRecipeData } from '../../services/RecipeImportService';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getProvider } from '../../services/AIProviderConfig';
import { RecipePreviewModal } from './RecipePreviewModal';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../theme';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolResults?: AIToolResult[];
}

function MarkdownText({ children, style }: { children: string; style: object }) {
  const segments = parseMarkdown(children);
  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={[
            seg.bold && { fontWeight: '700' as const },
            seg.italic && { fontStyle: 'italic' as const },
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

function parseMarkdown(text: string): { text: string; bold: boolean; italic: boolean }[] {
  const segments: { text: string; bold: boolean; italic: boolean }[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      i += 2;
      const end = text.indexOf('**', i);
      if (end !== -1) {
        segments.push({ text: text.slice(i, end), bold: true, italic: false });
        i = end + 2;
        continue;
      }
      segments.push({ text: '**', bold: false, italic: false });
      continue;
    }
    if (text[i] === '*' && text[i + 1] !== '*') {
      i += 1;
      const end = text.indexOf('*', i);
      if (end !== -1) {
        segments.push({ text: text.slice(i, end), bold: false, italic: true });
        i = end + 1;
        continue;
      }
      segments.push({ text: '*', bold: false, italic: false });
      continue;
    }
    const nextStar = text.indexOf('*', i);
    if (nextStar === -1) {
      segments.push({ text: text.slice(i), bold: false, italic: false });
      break;
    }
    segments.push({ text: text.slice(i, nextStar), bold: false, italic: false });
    i = nextStar;
  }

  return segments;
}

interface Props {
  onClose?: () => void;
}

export function ChatbotView({ onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { apiKey, providerId, modelId } = useSettingsStore();
  const serperApiKey = useSettingsStore((s) => s.serperApiKey);
  const provider = getProvider(providerId);
  const modelName = provider.models.find((m) => m.id === modelId)?.name ?? modelId;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '¡Hola! Soy tu chef IA. Pregúntame cualquier cosa sobre cocina: recetas, sustituciones, técnicas, o dime qué ingredientes tienes y te sugiero qué preparar. También puedo buscar recetas online o importarlas si me pasas un enlace.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRecipe, setModalRecipe] = useState<ImportedRecipeData | null>(null);
  const [modalUrl, setModalUrl] = useState<string | undefined>(undefined);
  const flatListRef = useRef<FlatList<Message>>(null);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!apiKey) {
      const errMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          '⚠️ No has configurado una API key. Ve a Ajustes para configurarla.',
      };
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + 'u', role: 'user', content: text },
        errMsg,
      ]);
      setInput('');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history: ChatMessage[] = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    history.push({ role: 'user' as const, content: text });

    try {
      const response = await sendMessage(history);
      const aiMsg: Message = {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        content: response.content,
        toolResults: response.toolResults,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Message = {
        id: Date.now().toString() + 'e',
        role: 'assistant',
        content: `Error: ${(e as Error).message}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, apiKey]);

  const handleSaveRecipe = useCallback(
    (data: ImportedRecipeData, importUrl?: string) => {
      setModalVisible(false);
      const params: Record<string, string> = {
        importedRecipe: JSON.stringify(data),
      };
      if (importUrl) params.importUrl = importUrl;
      router.push({
        pathname: '/recipe/add',
        params,
      } as never);
    },
    [router],
  );

  const handleQuickImport = useCallback(
    async (url: string) => {
      setLoading(true);
      try {
        const recipeData = await importFromUrl(url);
        handleSaveRecipe(recipeData, url);
      } catch (e) {
        const errMsg: Message = {
          id: Date.now().toString() + 'e',
          role: 'assistant',
          content: `No se pudo importar: ${(e as Error).message}. ¿Quieres que busque recetas similares?`,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [handleSaveRecipe],
  );

  const handleImportModal = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const recipeData = await importFromUrl(url);
      setModalRecipe(recipeData);
      setModalUrl(url);
      setModalVisible(true);
    } catch (e) {
      const errMsg: Message = {
        id: Date.now().toString() + 'e',
        role: 'assistant',
        content: `No se pudo importar: ${(e as Error).message}. ¿Quieres que busque recetas similares?`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.role === 'system') {
      return renderToolResults(item.toolResults);
    }

    const isUser = item.role === 'user';
    const hasToolContent = item.role === 'assistant' && item.toolResults && item.toolResults.length > 0;

    return (
      <View>
        {isUser ? (
          <View style={[styles.bubbleRow, styles.bubbleRowUser]}>
            <View style={[styles.bubble, styles.bubbleUser]}>
              <MarkdownText style={[styles.bubbleText, styles.bubbleTextUser]}>
                {item.content}
              </MarkdownText>
            </View>
          </View>
        ) : (
          <View style={styles.bubbleRow}>
            <View style={[styles.bubble, styles.bubbleAI]}>
              <MarkdownText style={styles.bubbleText}>{item.content}</MarkdownText>
            </View>
          </View>
        )}
        {hasToolContent && renderToolResults(item.toolResults!)}
      </View>
    );
  };

  const renderToolResults = (toolResults?: AIToolResult[]) => {
    if (!toolResults || toolResults.length === 0) return null;

    return (
      <View style={styles.toolResultsContainer}>
        {toolResults.map((tr, idx) => {
          if (tr.type === 'search_results' && tr.searchResults && tr.searchResults.length > 0) {
            return (
              <View key={`sr-${idx}`} style={styles.toolCard}>
                <Text style={styles.toolCardTitle}>Resultados de búsqueda</Text>
                {tr.searchResults.map((result, ri) => (
                  <View key={`sr-${idx}-${ri}`} style={styles.searchResultItem}>
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {result.title}
                    </Text>
                    <Text style={styles.searchResultSnippet} numberOfLines={2}>
                      {result.snippet}
                    </Text>
                    <View style={styles.searchResultAction}>
                      <Text style={styles.searchResultUrl} numberOfLines={1}>
                        {new URL(result.url).hostname}
                      </Text>
                      <View style={styles.searchResultBtns}>
                        <TouchableOpacity
                          style={styles.viewBtn}
                          onPress={() => handleImportModal(result.url)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewBtnText}>Ver</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.importBtn}
                          onPress={() => handleQuickImport(result.url)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.importBtnText}>Importar →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          if (tr.type === 'search_results' && tr.error) {
            return (
              <View key={`se-${idx}`} style={[styles.toolCard, styles.toolCardError]}>
                <Text style={styles.toolCardErrorText}>{tr.error}</Text>
              </View>
            );
          }

          if (tr.type === 'recipe_import' && tr.recipeData) {
            const r = tr.recipeData;
            return (
              <View key={`ri-${idx}`} style={styles.toolCard}>
                <Text style={styles.toolCardTitle}>Receta importada</Text>
                <Text style={styles.recipeName}>{r.name}</Text>
                <Text style={styles.recipeMeta} numberOfLines={2}>
                  {r.ingredients.length} ingredientes · {r.steps.length} pasos ·{' '}
                  {r.prepTime + r.cookTime} min · {r.baseServings} porciones
                </Text>
                {tr.importUrl ? (
                  <Text style={styles.recipeSource} numberOfLines={1}>
                    Fuente: {new URL(tr.importUrl).hostname}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={styles.saveRecipeBtn}
                  onPress={() => handleSaveRecipe(r, tr.importUrl)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveRecipeBtnText}>Guardar receta</Text>
                </TouchableOpacity>
              </View>
            );
          }

          if (tr.type === 'recipe_import' && tr.error) {
            return (
              <View key={`re-${idx}`} style={[styles.toolCard, styles.toolCardError]}>
                <Text style={styles.toolCardErrorText}>{tr.error}</Text>
              </View>
            );
          }

          return null;
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: onClose ? 0 : insets.top }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : insets.top}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose ?? (() => router.back())}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>
            {onClose ? '✕ Cerrar' : '← Volver'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Chef IA</Text>
          <Text style={styles.headerAccent}>✦</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      {!apiKey ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ API key no configurada. Ve a Ajustes para habilitar el chat.
          </Text>
        </View>
      ) : (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            {provider.name} · {modelName}
            {!serperApiKey ? ' (sin búsqueda web)' : ''}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Pensando...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta algo o pega un enlace..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || loading) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
          activeOpacity={0.7}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
      <RecipePreviewModal
        visible={modalVisible}
        recipe={modalRecipe}
        importUrl={modalUrl}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveRecipe}
      />
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
  backBtn: {
    width: 70,
  },
  backBtnText: {
    color: colors.primaryDark,
    fontSize: fontSize.md,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
  },
  headerAccent: {
    fontSize: 14,
    color: colors.primary,
  },
  warning: {
    backgroundColor: colors.surfaceButter,
    padding: spacing.sm + 4,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  warningText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.accentDark,
    textAlign: 'center',
  },
  info: {
    padding: spacing.xs + 2,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceMint,
  },
  infoText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  bubbleAI: {
    borderTopLeftRadius: borderRadius.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primaryLight,
    borderTopRightRadius: borderRadius.sm,
    borderColor: colors.primaryLight,
  },
  bubbleText: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: colors.primaryDark,
  },
  toolResultsContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  toolCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  toolCardError: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.accent,
  },
  toolCardTitle: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  toolCardErrorText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.error,
    fontWeight: '600',
  },
  searchResultItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  searchResultTitle: {
    fontSize: fontSize.sm,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  searchResultSnippet: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  searchResultAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultUrl: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textLight,
    flex: 1,
    marginRight: spacing.sm,
  },
  importBtnLabel: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  searchResultBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  viewBtnText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  importBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  importBtnText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.white,
    fontWeight: '700',
  },
  recipeName: {
    fontSize: fontSize.lg,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recipeSource: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  saveRecipeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveRecipeBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
});
