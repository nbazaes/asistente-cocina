import React, { createContext, useContext, type ReactNode } from 'react';
import type { IRecipeRepository } from './interfaces/IRecipeRepository';
import type { IPantryRepository } from './interfaces/IPantryRepository';
import { LocalRecipeRepository } from './local/LocalRecipeRepository';
import { LocalPantryRepository } from './local/LocalPantryRepository';

interface RepositoryContextValue {
  recipeRepository: IRecipeRepository;
  pantryRepository: IPantryRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

const localRecipeRepo = new LocalRecipeRepository();
const localPantryRepo = new LocalPantryRepository();

export function RepositoryProvider({ children }: { children: ReactNode }) {
  return (
    <RepositoryContext.Provider
      value={{
        recipeRepository: localRecipeRepo,
        pantryRepository: localPantryRepo,
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
