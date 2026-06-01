import type { UserPantryItem } from '../../models';

export interface IPantryRepository {
  getAll(): Promise<UserPantryItem[]>;
  add(ingredientName: string): Promise<UserPantryItem>;
  remove(id: string): Promise<void>;
  exists(ingredientName: string): Promise<boolean>;
}
