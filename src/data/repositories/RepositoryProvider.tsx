import React, { createContext, useContext, type ReactNode } from 'react';
import type { IRecipeRepository } from './interfaces/IRecipeRepository';
import type { IPantryRepository } from './interfaces/IPantryRepository';
import type { IChatHistoryRepository } from './interfaces/IChatHistoryRepository';
import { LocalRecipeRepository } from './local/LocalRecipeRepository';
import { LocalPantryRepository } from './local/LocalPantryRepository';
import { LocalChatHistoryRepository } from './local/LocalChatHistoryRepository';

interface RepositoryContextValue {
  recipeRepository: IRecipeRepository;
  pantryRepository: IPantryRepository;
  chatHistoryRepository: IChatHistoryRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

const localRecipeRepo = new LocalRecipeRepository();
const localPantryRepo = new LocalPantryRepository();
const localChatHistoryRepo = new LocalChatHistoryRepository();

export function RepositoryProvider({ children }: { children: ReactNode }) {
  return (
    <RepositoryContext.Provider
      value={{
        recipeRepository: localRecipeRepo,
        pantryRepository: localPantryRepo,
        chatHistoryRepository: localChatHistoryRepo,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositories(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) {
    throw new Error('useRepositories must be used within RepositoryProvider');
  }
  return ctx;
}
