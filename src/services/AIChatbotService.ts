import OpenAI from 'openai';
import { getProvider } from './AIProviderConfig';
import type { AIProvider } from './AIProviderConfig';
import { webSearchService } from './WebSearchService';
import { importFromUrl, type ImportedRecipeData } from './RecipeImportService';
import type { Difficulty, RecipeType } from '../data/models';
import type { WebSearchResult } from './WebSearchService';

const SYSTEM_PROMPT = `Eres un asistente de cocina experto. SOLO hablas de cocina, gastronomía y alimentación. Ayudas a los usuarios con:
- Sugerir sustituciones de ingredientes
- Explicar técnicas de cocina y horneado
- Ajustar proporciones y tiempos de cocción
- Dar consejos sobre conservación de alimentos
- Resolver dudas sobre términos culinarios
- Recomendar recetas basadas en ingredientes disponibles

Tienes acceso a tres herramientas:
1. search_recipes: busca recetas en sitios web de cocina españoles (recetas.elperiodico.com, divinacocina.es). Úsala cuando el usuario pida recetas "ya probadas" o cuando quieras mostrarle opciones verificadas de la web.
2. import_recipe: importa una receta desde una URL. Úsala cuando el usuario te envíe un enlace de receta, o cuando quieras importar una receta que hayas encontrado con search_recipes.
3. import_recipe_from_image: extrae una receta de una imagen que el usuario haya adjuntado o pegado (una foto de un libro, una tarjeta manuscrita, una captura de pantalla, etc.). Úsala SIEMPRE que el usuario envíe una imagen con una receta: devuelve la receta estructurada completa (nombre, tiempos, porciones, dificultad, tipo, etiquetas, ingredientes con cantidades y unidades, y pasos en orden). Si no hay suficiente información en la imagen (por ejemplo, faltan cantidades o pasos), haz tu mejor estimación razonable y no dejes campos vacíos si puedes evitarlos.

Reglas importantes:
- SOLO respondes preguntas relacionadas con cocina, recetas, ingredientes, técnicas culinarias, gastronomía y alimentación. Si el usuario pregunta sobre cualquier otro tema (política, deportes, tecnología, programación, clima, etc.), responde educadamente que solo puedes ayudar con temas de cocina y sugiérele hacer una pregunta culinaria.
- Cuando un usuario pida una receta, respóndele directamente con una receta de tu propio conocimiento: dale un resumen claro con el nombre, los ingredientes principales y los pasos esenciales. No hace falta que sea exhaustiva, solo útil y clara.
- Después de dar una receta de tu propio conocimiento, pregunta al usuario: "¿Quieres que te dé recetas ya probadas?" y TERMINA tu mensaje con el marcador [OFERTA_BUSQUEDA_WEB:nombre de la receta], donde "nombre de la receta" es el plato que acabas de sugerir. No uses el marcador en ninguna otra situación.
- Si el usuario pide recetas "ya probadas" o confirma la oferta, usa search_recipes.
- Puedes responder con consejos generales, técnicas, sustituciones y resolver dudas con tu propio conocimiento, sin necesidad de usar search_recipes.
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

function normalizeRecipeFromImage(args: Record<string, unknown>): ImportedRecipeData {
  const difficulty: Difficulty =
    args.difficulty === 'easy' || args.difficulty === 'medium' || args.difficulty === 'hard'
      ? args.difficulty
      : 'medium';
  const type: RecipeType =
    args.type === 'dish' || args.type === 'dessert' || args.type === 'drink' || args.type === 'bakery'
      ? args.type
      : 'dish';

  const ingredients = Array.isArray(args.ingredients)
    ? args.ingredients.map((raw, i) => {
        const ing = (raw ?? {}) as Record<string, unknown>;
        return {
          name: String(ing.name ?? `Ingrediente ${i + 1}`),
          quantity: typeof ing.quantity === 'number' ? ing.quantity : 0,
          unit: String(ing.unit ?? 'unidad').toLowerCase() || 'unidad',
          optional: Boolean(ing.optional),
          group: typeof ing.group === 'string' ? ing.group : null,
          scalable:
            typeof ing.scalable === 'boolean'
              ? ing.scalable
              : !['unidad', 'unidades', 'al gusto', 'pizca'].includes(String(ing.unit ?? '').toLowerCase()),
        };
      })
    : [];

  const steps = Array.isArray(args.steps)
    ? args.steps.map((raw, i) => {
        const step = (raw ?? {}) as Record<string, unknown>;
        const dur = typeof step.durationMinutes === 'number' ? step.durationMinutes : null;
        return {
          order: typeof step.order === 'number' ? step.order : i,
          description: String(step.description ?? ''),
          durationMinutes: dur,
          isTimeDependent: Boolean(step.isTimeDependent) || dur != null,
        };
      })
    : [];

  const tags = Array.isArray(args.tags)
    ? args.tags.map(String).filter(Boolean)
    : [];

  return {
    name: String(args.name ?? 'Receta importada'),
    description: String(args.description ?? ''),
    imageUri: null,
    baseServings: typeof args.baseServings === 'number' ? Math.max(1, args.baseServings) : 2,
    prepTime: typeof args.prepTime === 'number' ? Math.max(0, args.prepTime) : 0,
    cookTime: typeof args.cookTime === 'number' ? Math.max(0, args.cookTime) : 0,
    difficulty,
    type,
    tags,
    ingredients,
    steps,
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  imageDataUri?: string;
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
  {
    type: 'function' as const,
    function: {
      name: 'import_recipe_from_image',
      description:
        'Extrae una receta completa a partir de una imagen que el usuario adjuntó o pegó. Devuelve la receta estructurada (ingredientes con cantidades, pasos, tiempos, etc.).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del plato' },
          description: { type: 'string', description: 'Breve descripción de la receta' },
          baseServings: { type: 'number', description: 'Número de porciones base' },
          prepTime: { type: 'number', description: 'Tiempo de preparación en minutos' },
          cookTime: { type: 'number', description: 'Tiempo de cocción en minutos' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], description: 'Dificultad: easy, medium o hard' },
          type: { type: 'string', enum: ['dish', 'dessert', 'drink', 'bakery'], description: 'Tipo de receta: dish, dessert, drink o bakery' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Etiquetas o palabras clave de la receta' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Nombre del ingrediente' },
                quantity: { type: 'number', description: 'Cantidad numérica (0 si no se indica o es "al gusto")' },
                unit: { type: 'string', description: 'Unidad (g, kg, ml, l, cucharadas, unidades, pizca, al gusto...). Usa "unidad" si no se indica.' },
                optional: { type: 'boolean', description: 'Si el ingrediente es opcional' },
                group: { type: 'string', description: 'Grupo del ingrediente, o null si no aplica' },
                scalable: { type: 'boolean', description: 'Si la cantidad escala con las porciones (false para unidades fijas, pizcas, "al gusto")' },
              },
              required: ['name', 'quantity', 'unit', 'optional', 'scalable'],
            },
          },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                order: { type: 'number', description: 'Orden del paso empezando en 0' },
                description: { type: 'string', description: 'Descripción del paso' },
                durationMinutes: { type: 'number', description: 'Duración del paso en minutos, o null' },
                isTimeDependent: { type: 'boolean', description: 'Si el paso depende del tiempo de cocción/espera' },
              },
              required: ['order', 'description', 'durationMinutes', 'isTimeDependent'],
            },
          },
        },
        required: ['name', 'baseServings', 'prepTime', 'cookTime', 'difficulty', 'type', 'tags', 'ingredients', 'steps'],
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
    case 'import_recipe_from_image': {
      const recipeData = normalizeRecipeFromImage(args);
      return {
        type: 'recipe_import',
        recipeData,
      };
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
      const content = m.imageDataUri
        ? [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: { url: m.imageDataUri } },
          ]
        : m.content;
      return {
        role: m.role === 'system' ? 'user' as const : m.role as 'user' | 'assistant',
        content,
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
    max_tokens: 4000,
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
      max_tokens: 4000,
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
