export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  baseURL: string;
  defaultModel: string;
  keyPrefixes: string[];
  websiteURL: string;
  models: AIModel[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyPrefixes: ['sk-'],
    websiteURL: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
      { id: 'o4-mini', name: 'o4 Mini' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    keyPrefixes: ['sk-or-'],
    websiteURL: 'https://openrouter.ai/keys',
    models: [
      { id: 'openrouter/auto', name: 'Auto (gratis)' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'openai/o4-mini', name: 'o4 Mini' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'anthropic/claude-4-sonnet', name: 'Claude 4 Sonnet' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
      { id: 'qwen/qwen-3-235b-a22b', name: 'Qwen 3 235B' },
      { id: 'mistralai/mistral-large', name: 'Mistral Large' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    keyPrefixes: [],
    websiteURL: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPrefixes: ['gsk_'],
    websiteURL: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill' },
      { id: 'qwen-qwq-32b', name: 'Qwen QWQ 32B' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    keyPrefixes: [],
    websiteURL: 'https://console.mistral.ai/api-keys',
    models: [
      { id: 'mistral-small-latest', name: 'Mistral Small' },
      { id: 'mistral-large-latest', name: 'Mistral Large' },
      { id: 'codestral-latest', name: 'Codestral' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.5-flash',
    keyPrefixes: [],
    websiteURL: 'https://aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    keyPrefixes: [],
    websiteURL: 'https://api.together.xyz/settings/api-keys',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
      { id: 'Qwen/QwQ-32B', name: 'Qwen QWQ 32B' },
    ],
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    baseURL: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-1212',
    keyPrefixes: ['xai-'],
    websiteURL: 'https://console.x.ai',
    models: [
      { id: 'grok-2-1212', name: 'Grok 2' },
    ],
  },
];

export function detectProvider(apiKey: string): string {
  const sorted = [...AI_PROVIDERS].sort(
    (a, b) => Math.max(...b.keyPrefixes.map(p => p.length), 0)
            - Math.max(...a.keyPrefixes.map(p => p.length), 0)
  );
  for (const provider of sorted) {
    for (const prefix of provider.keyPrefixes) {
      if (apiKey.startsWith(prefix)) {
        return provider.id;
      }
    }
  }
  return 'openai';
}

export function getProvider(id: string): AIProvider {
  return AI_PROVIDERS.find(p => p.id === id) ?? AI_PROVIDERS[0];
}
