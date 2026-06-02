import { create } from 'zustand';
import { initializeAI, resetAI, isInitialized } from '../services/AIChatbotService';
import { detectProvider, getProvider } from '../services/AIProviderConfig';
import { setSerperApiKey as configureSerperApi } from '../services/WebSearchService';

interface SettingsState {
  apiKey: string;
  providerId: string;
  modelId: string;
  serperApiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setProviderId: (id: string) => void;
  setModelId: (id: string) => void;
  setSerperApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: '',
  providerId: 'openai',
  modelId: '',
  serperApiKey: '',

  setApiKey: (key: string) => {
    const trimmed = key.trim();
    const detectedProvider = trimmed ? detectProvider(trimmed) : 'openai';
    const provider = getProvider(detectedProvider);
    const state = get();

    const providerChanged = detectedProvider !== state.providerId;
    const model = providerChanged || !state.modelId ? provider.defaultModel : state.modelId;

    set({
      apiKey: trimmed,
      providerId: detectedProvider,
      modelId: model,
    });

    if (trimmed) {
      initializeAI(trimmed, detectedProvider, model);
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

  setSerperApiKey: (key: string) => {
    const trimmed = key.trim();
    set({ serperApiKey: trimmed });
    configureSerperApi(trimmed);
  },
}));
