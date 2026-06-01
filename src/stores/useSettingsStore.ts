import { create } from 'zustand';
import { initializeAI, resetAI, isInitialized } from '../services/AIChatbotService';
import { detectProvider, getProvider } from '../services/AIProviderConfig';

interface SettingsState {
  apiKey: string;
  providerId: string;
  modelId: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setProviderId: (id: string) => void;
  setModelId: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: '',
  providerId: 'openai',
  modelId: '',

  setApiKey: (key: string) => {
    const trimmed = key.trim();
    const detectedProvider = trimmed ? detectProvider(trimmed) : 'openai';
    const provider = getProvider(detectedProvider);

    set({
      apiKey: trimmed,
      providerId: detectedProvider,
      modelId: provider.defaultModel,
    });

    if (trimmed) {
      initializeAI(trimmed, detectedProvider, provider.defaultModel);
    } else {
      resetAI();
    }
  },

  clearApiKey: () => {
    set({ apiKey: '', providerId: 'openai', modelId: '' });
    resetAI();
  },

  setProviderId: (id: string) => {
    const state = get();
    const provider = getProvider(id);

    set({ providerId: id, modelId: provider.defaultModel });

    if (state.apiKey) {
      initializeAI(state.apiKey, id, provider.defaultModel);
    }
  },

  setModelId: (id: string) => {
    const state = get();
    set({ modelId: id });

    if (state.apiKey) {
      initializeAI(state.apiKey, state.providerId, id);
    }
  },
}));
