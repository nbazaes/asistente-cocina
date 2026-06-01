import OpenAI from 'openai';

const SYSTEM_PROMPT = `Eres un asistente de cocina experto. Ayudas a los usuarios con:
- Recomendar recetas basadas en ingredientes disponibles
- Sugerir sustituciones de ingredientes
- Explicar técnicas de cocina y horneado
- Ajustar proporciones y tiempos de cocción
- Dar consejos sobre conservación de alimentos
- Resolver dudas sobre términos culinarios

Responde siempre en español, de forma clara y concisa. Si te preguntan por una receta específica, da instrucciones detalladas paso a paso.`;

let client: OpenAI | null = null;

export function getAIClient(): OpenAI | null {
  return client;
}

export function initializeAI(apiKey: string): void {
  client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export function resetAI(): void {
  client = null;
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
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.choices[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.';
}
