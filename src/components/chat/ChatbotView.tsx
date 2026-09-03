import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendMessage, type AIToolResult, type ChatMessage } from '../../services/AIChatbotService';
import { webSearchService } from '../../services/WebSearchService';
import { importFromUrl, type ImportedRecipeData } from '../../services/RecipeImportService';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getProvider } from '../../services/AIProviderConfig';
import { RecipePreviewModal } from './RecipePreviewModal';
import { useRepositories } from '../../data/repositories/RepositoryProvider';
import type { ConversationSummary } from '../../data/repositories/interfaces/IChatHistoryRepository';
import { colors, spacing, fontSize, borderRadius, shadows, fonts } from '../../theme';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageDataUri?: string;
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

const OFFER_PHRASE = '¿Quieres que te dé recetas ya probadas?';

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (isNaN(date.getTime())) return '';
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function parseOffer(content: string): { query: string; cleanContent: string } | null {
  const marker = content.match(/\[OFERTA_BUSQUEDA_WEB:([^\]]*)\]/);
  if (marker) {
    const query = marker[1].trim();
    const cleanContent = content.replace(marker[0], '').trim();
    if (query) return { query, cleanContent };
    return null;
  }
  if (content.includes(OFFER_PHRASE)) {
    const firstLine =
      content
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0) ?? '';
    const query = firstLine.replace(/^[*#\-\d.\s]+/, '').trim();
    return { query, cleanContent: content };
  }
  return null;
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

export interface RecipeContext {
  name: string;
  description?: string;
  ingredients: string;
  steps: string;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  baseServings: number;
}

interface Props {
  onClose?: () => void;
  recipeContext?: RecipeContext | null;
}

function buildRecipeSystemMessage(ctx: RecipeContext): string {
  const parts = [
    `[CONTEXTO] El usuario está viendo la receta "${ctx.name}".`,
    ctx.description ? `Descripción: ${ctx.description}` : '',
    `Dificultad: ${ctx.difficulty} · Preparación: ${ctx.prepTime} min · Cocción: ${ctx.cookTime} min · Porciones base: ${ctx.baseServings}`,
    `Ingredientes: ${ctx.ingredients}`,
    `Pasos: ${ctx.steps}`,
    'Usa esta información para responder preguntas sobre esta receta específica (sustituciones, técnicas, ajustes de cantidades, dudas sobre los pasos, etc.). Si el usuario pregunta algo que no está relacionado con esta receta, responde normalmente.',
  ];
  return parts.filter(Boolean).join('\n');
}

export function ChatbotView({ onClose, recipeContext }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { apiKey, providerId, modelId } = useSettingsStore();
  const serperApiKey = useSettingsStore((s) => s.serperApiKey);
  const provider = getProvider(providerId);
  const modelName = provider.models.find((m) => m.id === modelId)?.name ?? modelId;

  const getInitialMessage = (): Message => {
    if (recipeContext) {
      return {
        id: '1',
        role: 'assistant',
        content: `¡Hola! Veo que estás viendo *${recipeContext.name}*. ¿En qué te puedo ayudar con esta receta? Puedo explicarte los pasos, sugerir sustituciones de ingredientes, ajustar las cantidades para más o menos porciones, o resolver cualquier duda que tengas.`,
      };
    }
    return {
      id: '1',
      role: 'assistant',
      content:
        '¡Hola! Soy tu chef IA. Pregúntame cualquier cosa sobre cocina: recetas, sustituciones, técnicas, o dime qué ingredientes tienes y te sugiero qué preparar. También puedo buscar recetas online o importarlas si me pasas un enlace.',
    };
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ uri: string; dataUri: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRecipe, setModalRecipe] = useState<ImportedRecipeData | null>(null);
  const [modalUrl, setModalUrl] = useState<string | undefined>(undefined);
  const [dismissedOffers, setDismissedOffers] = useState<Set<string>>(new Set());
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyList, setHistoryList] = useState<ConversationSummary[]>([]);
  const flatListRef = useRef<FlatList<Message>>(null);
  const conversationIdRef = useRef<string | null>(null);
  const { chatHistoryRepository } = useRepositories();

  const handleAttachImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${asset.base64}`;
    setAttachedImage({ uri: asset.uri, dataUri });
  }, []);

  const handlePasteDataUri = useCallback((dataUrl: string) => {
    setAttachedImage({ uri: dataUrl, dataUri: dataUrl });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              handlePasteDataUri(reader.result);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [handlePasteDataUri]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Clipboard.getImageAsync({ format: 'png' }).then((img) => {
      if (img) {
        handlePasteDataUri(img.data);
      }
    }).catch(() => {});
  }, [handlePasteDataUri]);

  const toMessages = useCallback(
    (rows: { id: string; role: 'user' | 'assistant'; content: string; imageDataUri: string | null }[]): Message[] =>
      rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        imageDataUri: r.imageDataUri ?? undefined,
      })),
    [],
  );

  const restoreLatestConversation = useCallback(async () => {
    if (recipeContext) return;
    try {
      const latest = await chatHistoryRepository.getLatestConversation();
      if (!latest) return;
      const rows = await chatHistoryRepository.getMessages(latest.id);
      if (rows.length === 0) return;
      conversationIdRef.current = latest.id;
      setMessages(toMessages(rows));
    } catch {
      // la persistencia nunca debe romper el chat
    }
  }, [chatHistoryRepository, toMessages, recipeContext]);

  useEffect(() => {
    restoreLatestConversation();
  }, [restoreLatestConversation]);

  const persistTurn = async (userMsg: Message, aiMsg: Message) => {
    try {
      let convId = conversationIdRef.current;
      if (!convId) {
        const conv = await chatHistoryRepository.createConversation(
          userMsg.content.slice(0, 60) || 'Conversación',
        );
        convId = conv.id;
        conversationIdRef.current = convId;
      }
      await chatHistoryRepository.appendMessages(convId, [
        { role: 'user', content: userMsg.content, imageDataUri: userMsg.imageDataUri ?? null },
        { role: 'assistant', content: aiMsg.content },
      ]);
    } catch {
      // noop
    }
  };

  const openHistory = async () => {
    try {
      const list = await chatHistoryRepository.listConversations();
      setHistoryList(list);
    } catch {
      setHistoryList([]);
    }
    setHistoryVisible(true);
  };

  const loadConversation = async (conv: ConversationSummary) => {
    try {
      const rows = await chatHistoryRepository.getMessages(conv.id);
      conversationIdRef.current = conv.id;
      setMessages(toMessages(rows));
    } catch {
      // noop
    }
    setHistoryVisible(false);
  };

  const deleteConversation = async (id: string) => {
    try {
      await chatHistoryRepository.deleteConversation(id);
      if (conversationIdRef.current === id) {
        conversationIdRef.current = null;
        setMessages([getInitialMessage()]);
      }
      setHistoryList((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // noop
    }
  };

  const startNewConversation = () => {
    conversationIdRef.current = null;
    setMessages([getInitialMessage()]);
    setInput('');
    setAttachedImage(null);
    setHistoryVisible(false);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && !attachedImage) || loading) return;

    const userText = text || (attachedImage ? 'Extrae la receta de esta imagen.' : '');

    if (!apiKey) {
      const errMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          '⚠️ No has configurado una API key. Ve a Ajustes para configurarla.',
      };
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + 'u', role: 'user', content: userText, imageDataUri: attachedImage?.dataUri },
        errMsg,
      ]);
      setInput('');
      setAttachedImage(null);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      imageDataUri: attachedImage?.dataUri,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setLoading(true);

    const history: ChatMessage[] = [];

    if (recipeContext) {
      history.push({
        role: 'system',
        content: buildRecipeSystemMessage(recipeContext),
      });
    }

    history.push(
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: parseOffer(m.content)?.cleanContent ?? m.content,
        })),
    );
    history.push({
      role: 'user' as const,
      content: userText,
      imageDataUri: attachedImage?.dataUri,
    });

    try {
      const response = await sendMessage(history);
      const aiMsg: Message = {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        content: response.content,
        toolResults: response.toolResults,
      };
      setMessages((prev) => [...prev, aiMsg]);
      await persistTurn(userMsg, aiMsg);
    } catch (e) {
      const errMsg: Message = {
        id: Date.now().toString() + 'e',
        role: 'assistant',
        content: `Error: ${(e as Error).message}`,
      };
      setMessages((prev) => [...prev, errMsg]);
      await persistTurn(userMsg, errMsg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, apiKey, recipeContext, attachedImage, persistTurn]);

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

  const handleOfferYes = useCallback(async (msgId: string, query: string) => {
    setDismissedOffers((prev) => new Set(prev).add(msgId));
    setLoading(true);
    try {
      const results = await webSearchService.search(query);
      const aiMsg: Message = {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        content: '¡Claro! Aquí tienes algunas recetas ya probadas:',
        toolResults: [{ type: 'search_results', searchResults: results }],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Message = {
        id: Date.now().toString() + 'e',
        role: 'assistant',
        content: `No se pudieron obtener recetas probadas: ${(e as Error).message}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOfferNo = useCallback((msgId: string) => {
    setDismissedOffers((prev) => new Set(prev).add(msgId));
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.role === 'system') {
      return renderToolResults(item.toolResults);
    }

    const isUser = item.role === 'user';
    const hasToolContent = item.role === 'assistant' && item.toolResults && item.toolResults.length > 0;
    const offer = isUser ? null : parseOffer(item.content);
    const displayContent = offer ? offer.cleanContent : item.content;
    const showOfferButtons = !isUser && !!offer && !dismissedOffers.has(item.id);

    return (
      <View>
        {isUser ? (
          <View style={[styles.bubbleRow, styles.bubbleRowUser]}>
            <View style={[styles.bubble, styles.bubbleUser]}>
              {item.imageDataUri ? (
                <Image source={{ uri: item.imageDataUri }} style={styles.messageImage} />
              ) : null}
              <MarkdownText style={[styles.bubbleText, styles.bubbleTextUser]}>
                {item.content}
              </MarkdownText>
            </View>
          </View>
        ) : (
          <View style={styles.bubbleRow}>
            <View style={[styles.bubble, styles.bubbleAI]}>
              <MarkdownText style={styles.bubbleText}>{displayContent}</MarkdownText>
            </View>
          </View>
        )}
        {showOfferButtons && offer && (
          <View style={styles.offerRow}>
            <TouchableOpacity
              style={[styles.offerBtn, styles.offerBtnYes]}
              onPress={() => handleOfferYes(item.id, offer.query)}
              activeOpacity={0.7}
            >
              <Text style={styles.offerBtnYesText}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.offerBtn, styles.offerBtnNo]}
              onPress={() => handleOfferNo(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.offerBtnNoText}>No</Text>
            </TouchableOpacity>
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={startNewConversation}
            style={styles.headerActionBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.headerActionText}>✚</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openHistory}
            style={styles.headerActionBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.headerActionText}>🕘</Text>
          </TouchableOpacity>
        </View>
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

      {attachedImage ? (
        <View style={styles.attachPreviewRow}>
          <Image source={{ uri: attachedImage.uri }} style={styles.attachPreview} />
          <Text style={styles.attachPreviewHint} numberOfLines={1}>
            Imagen adjunta
          </Text>
          <TouchableOpacity
            style={styles.attachRemoveBtn}
            onPress={() => setAttachedImage(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.attachRemoveText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom || spacing.sm }]}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={handleAttachImage}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.attachBtnText}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta algo, pega un enlace o una imagen..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            ((!input.trim() && !attachedImage) || loading) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={(!input.trim() && !attachedImage) || loading}
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

      <Modal visible={historyVisible} transparent animationType="fade" onRequestClose={() => setHistoryVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setHistoryVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Historial</Text>
            {historyList.length === 0 ? (
              <Text style={styles.modalEmpty}>Todavía no hay conversaciones guardadas.</Text>
            ) : (
              <FlatList
                data={historyList}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.historyItem}
                    onPress={() => loadConversation(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyItemText}>
                      <Text style={styles.historyItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.historyItemMeta}>
                        {formatRelativeDate(item.updatedAt)} · {item.messageCount} mensajes
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.historyItemDelete}
                      onPress={() => deleteConversation(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.historyItemDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.modalNewBtn}
              onPress={startNewConversation}
              activeOpacity={0.8}
            >
              <Text style={styles.modalNewBtnText}>Nueva conversación</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: 70,
    justifyContent: 'flex-end',
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionText: {
    fontSize: 16,
    lineHeight: 18,
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
  offerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  offerBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBtnYes: {
    backgroundColor: colors.primary,
  },
  offerBtnYesText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  offerBtnNo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerBtnNoText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '700',
    fontFamily: fonts.body,
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
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  attachBtnText: {
    fontSize: 18,
  },
  attachPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  attachPreview: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  attachPreviewHint: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  attachRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachRemoveText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.borderSoft,
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
    maxHeight: '70%',
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalEmpty: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.xs,
  },
  historyItemText: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: fontSize.md,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.text,
  },
  historyItemMeta: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyItemDelete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItemDeleteText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  modalNewBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  modalNewBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
});
