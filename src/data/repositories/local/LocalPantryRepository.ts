import { eq } from 'drizzle-orm';
import { db } from '../../database';
import { userPantry } from '../../database/schema';
import type { IPantryRepository } from '../interfaces/IPantryRepository';
import type { UserPantryItem } from '../../models';
import { generateId } from './helpers';

export class LocalPantryRepository implements IPantryRepository {
  async getAll(): Promise<UserPantryItem[]> {
    const rows = await db.select().from(userPantry).orderBy(userPantry.ingredientName);
    return rows.map(row => ({
      id: row.id,
      ingredientName: row.ingredientName,
    }));
  }

  async add(ingredientName: string): Promise<UserPantryItem> {
    const id = generateId();
    await db.insert(userPantry).values({
      id,
      ingredientName: ingredientName.toLowerCase().trim(),
    });
    return { id, ingredientName: ingredientName.toLowerCase().trim() };
  }

  async remove(id: string): Promise<void> {
    await db.delete(userPantry).where(eq(userPantry.id, id));
  }

  async exists(ingredientName: string): Promise<boolean> {
    const rows = await db.select().from(userPantry).where(eq(userPantry.ingredientName, ingredientName.toLowerCase().trim())).limit(1);
    return rows.length > 0;
  }
}
