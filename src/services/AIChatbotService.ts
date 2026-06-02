import OpenAI from 'openai';
import { getProvider } from './AIProviderConfig';
import type { AIProvider } from './AIProviderConfig';
import { webSearchService } from './WebSearchService';
import { importFromUrl, type ImportedRecipeData } from './RecipeImportService';
import type { WebSearchResult } from './WebSearchService';

const SYSTEM_PROMPT = `Eres un asistente de cocina experto. Ayudas a los usuarios con:
- Sugerir sustituciones de ingredientes
- Explicar técnicas de cocina y horneado
- Ajustar proporciones y tiempos de cocción
- Dar consejos sobre conservación de alimentos
- Resolver dudas sobre términos culinarios
- Recomendar recetas basadas en ingredientes disponibles (usa search_recipes, nunca improvises una receta completa)

Tienes acceso a dos herramientas:
1. search_recipes: busca recetas en sitios web de cocina españoles (recetas.elperiodico.com, directoalpaladar.com, divinacocina.es). Úsala SIEMPRE que el usuario te pida una receta, un plato, o cualquier preparación culinaria. NO generes recetas tú mismo, siempre busca primero.
2. import_recipe: importa una receta desde una URL. Úsala cuando el usuario te envíe un enlace de receta, o cuando quieras importar una receta que hayas encontrado con search_recipes.

Reglas importantes:
- Cuando un usuario pida una receta (ej. "dame una receta de tarta de queso", "cómo hago paella"), NUNCA respondas con una receta inventada por ti. Usa search_recipes y preséntale las mejores opciones encontradas para que el usuario elija.
- Solo da instrucciones paso a paso cuando el usuario pregunte sobre una receta que YA ha sido importada desde una URL o encontrada por search_recipes.
- Puedes dar consejos generales, técnicas, sustituciones y resolver dudas con tu propio conocimiento, pero nunca improvises recetas completas.
- Cuando uses search_recipes, SOLO responde con un mensaje muy corto como "Aquí tienes los resultados:" o "Esto es lo que encontré:". NO enumeres ni describas los resultados en tu respuesta — las tarjetas con los detalles se muestran automáticamente debajo de tu mensaje.
- Cuando uses import_recipe y tenga éxito, preséntale al usuario un resumen de la receta importada (nombre, tiempo, porciones, número de ingredientes). Si falla, dile al usuario que no se pudo encontrar la receta en esa URL y sugiérele buscar recetas similares con search_recipes.

Responde siempre en español, de forma clara y concisa.`;

let client: OpenAI | null = null;
let currentModel: string = 'gpt-4o-mini';
let currentProviderId: string = 'openai';

export function getAIClient(): OpenAI | null {
  return client;
}

export function getCurrentModel(): string {
  return currentModel;
}

export function getCurrentProviderId(): string {
  return currentProviderId;
}

export function isInitialized(): boolean {
  return client !== null;
}

export function initializeAI(apiKey: string, providerId: string, model?: string): void {
  const provider = getProvider(providerId);
  currentProviderId = provider.id;
  currentModel = model ?? provider.defaultModel;

  client = new OpenAI({
    apiKey,
    baseURL: provider.baseURL,
    dangerouslyAllowBrowser: true,
  });
}

export function resetAI(): void {
  client = null;
  currentModel = 'gpt-4o-mini';
  currentProviderId = 'openai';
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIToolResult {
  type: 'search_results' | 'recipe_import';
  searchResults?: WebSearchResult[];
  recipeData?: ImportedRecipeData;
  importUrl?: string;
  error?: string;
}

export interface AIResponse {
  content: string;
  toolResults?: AIToolResult[];
}

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_recipes',
      description:
        'Busca recetas en sitios de cocina españoles. Usa esta herramienta cuando necesites encontrar recetas online.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Términos de búsqueda para la receta, en español',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'import_recipe',
      description:
        'Importa una receta desde una URL. Usa esta herramienta cuando el usuario quiera guardar una receta desde un enlace.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL de la receta a importar',
          },
        },
        required: ['url'],
      },
    },
  },
];

async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<AIToolResult> {
  switch (name) {
    case 'search_recipes': {
      try {
        const results = await webSearchService.search(args.query as string);
        return { type: 'search_results', searchResults: results };
      } catch (e) {
        return {
          type: 'search_results',
          error: (e as Error).message,
        };
      }
    }
    case 'import_recipe': {
      try {
        const recipeData = await importFromUrl(args.url as string);
        return {
          type: 'recipe_import',
          recipeData,
          importUrl: args.url as string,
        };
      } catch (e) {
        return {
          type: 'recipe_import',
          error: (e as Error).message,
          importUrl: args.url as string,
        };
      }
    }
    default:
      return { type: 'search_results', error: `Herramienta desconocida: ${name}` };
  }
}

export async function sendMessage(messages: ChatMessage[]): Promise<AIResponse> {
  if (!client) {
    throw new Error('AI client not initialized. Please configure an API key.');
  }

  const mappedMessages = messages
    .map((m) => {
      if (m.toolCalls && m.role === 'assistant') {
        return {
          role: 'assistant' as const,
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        };
      }
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: m.toolCallId ?? '',
          content: m.content,
        };
      }
      return {
        role: m.role === 'system' ? 'user' as const : m.role as 'user' | 'assistant',
        content: m.content,
      };
    });

  const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(mappedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
  ];

  let completion = await client.chat.completions.create({
    model: currentModel,
    messages: apiMessages,
    temperature: 0.7,
    max_tokens: 1000,
    tools: TOOLS,
    tool_choice: 'auto',
  });

  const toolResults: AIToolResult[] = [];
  let iterations = 0;
  const maxIterations = 5;

  while (completion.choices[0]?.message?.tool_calls?.length && iterations < maxIterations) {
    iterations++;

    const responseMsg = completion.choices[0].message;
    const rawToolCalls = responseMsg.tool_calls!;
    apiMessages.push({
      role: 'assistant',
      content: responseMsg.content,
      tool_calls: rawToolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: 'function' in tc ? tc.function.name : '',
          arguments: 'function' in tc ? tc.function.arguments : '{}',
        },
      })),
    });

    for (const toolCall of rawToolCalls) {
      if (!('function' in toolCall)) continue;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }
      const result = await executeToolCall(toolCall.function.name, args);
      toolResults.push(result);
      apiMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    completion = await client.chat.completions.create({
      model: currentModel,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
      tools: TOOLS,
      tool_choice: 'auto',
    });
  }

  const content = completion.choices[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.';

  return {
    content,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
  };
}
