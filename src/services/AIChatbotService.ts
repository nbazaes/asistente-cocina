import OpenAI from 'openai';
import { getProvider } from './AIProviderConfig';
import type { AIProvider } from './AIProviderConfig';

const SYSTEM_PROMPT = `Eres un asistente de cocina experto. Ayudas a los usuarios con:
- Recomendar recetas basadas en ingredientes disponibles
- Sugerir sustituciones de ingredientes
- Explicar técnicas de cocina y horneado
- Ajustar proporciones y tiempos de cocción
- Dar consejos sobre conservación de alimentos
- Resolver dudas sobre términos culinarios

Responde siempre en español, de forma clara y concisa. Si te preguntan por una receta específica, da instrucciones detalladas paso a paso.`;

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
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  if (!client) {
    throw new Error('AI client not initialized. Please configure an API key.');
  }

  const completion = await client.chat.completions.create({
    model: currentModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.choices[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.';
}
