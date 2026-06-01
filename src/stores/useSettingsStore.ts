import { create } from 'zustand';
import { initializeAI, resetAI } from '../services/AIChatbotService';

interface SettingsState {
  openAIKey: string;
  setOpenAIKey: (key: string) => void;
  clearOpenAIKey: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  openAIKey: '',

  setOpenAIKey: (key: string) => {
    set({ openAIKey: key });
    if (key) {
      initializeAI(key);
    } else {
      resetAI();
    }
  },

  clearOpenAIKey: () => {
    set({ openAIKey: '' });
    resetAI();
  },
}));
