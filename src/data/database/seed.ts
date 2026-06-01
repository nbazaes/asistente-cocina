import { db } from './index';
import { recipes, ingredients, steps } from './schema';
import { generateId } from '../repositories/local/helpers';

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.select().from(recipes).limit(1);
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  // --- Tarta de manzana ---
  const r1 = generateId();
  await db.insert(recipes).values({
    id: r1,
    name: 'Tarta de manzana',
    description: 'Una clásica tarta de manzana casera con masa quebrada y canela. Perfecta para cualquier ocasión.',
    baseServings: 6,
    prepTime: 30,
    cookTime: 45,
    difficulty: 'medium',
    type: 'dessert',
    tags: JSON.stringify(['horno', 'fruta', 'clásico']),
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(ingredients).values([
    { id: generateId(), recipeId: r1, name: 'harina de trigo', quantity: 250, unit: 'g', optional: 0, scalable: 1, group: 'Masa' },
    { id: generateId(), recipeId: r1, name: 'mantequilla', quantity: 125, unit: 'g', optional: 0, scalable: 1, group: 'Masa' },
    { id: generateId(), recipeId: r1, name: 'azúcar', quantity: 100, unit: 'g', optional: 0, scalable: 1, group: 'Masa' },
    { id: generateId(), recipeId: r1, name: 'huevo', quantity: 1, unit: 'unidad', optional: 0, scalable: 0, group: 'Masa' },
    { id: generateId(), recipeId: r1, name: 'manzanas', quantity: 4, unit: 'unidades', optional: 0, scalable: 1, group: 'Relleno' },
    { id: generateId(), recipeId: r1, name: 'canela en polvo', quantity: 1, unit: 'cucharadita', optional: 0, scalable: 0, group: 'Relleno' },
    { id: generateId(), recipeId: r1, name: 'azúcar moreno', quantity: 50, unit: 'g', optional: 0, scalable: 1, group: 'Relleno' },
    { id: generateId(), recipeId: r1, name: 'zumo de limón', quantity: 1, unit: 'cucharada', optional: 0, scalable: 0, group: 'Relleno' },
  ]);
  await db.insert(steps).values([
    { id: generateId(), recipeId: r1, order: 0, description: 'Mezcla la harina con la mantequilla fría hasta obtener una textura arenosa. Añade el azúcar y el huevo, y amasa hasta formar una bola. Envuelve en film y refrigera 30 minutos.', durationMinutes: 30, isTimeDependent: 0 },
    { id: generateId(), recipeId: r1, order: 1, description: 'Pela y corta las manzanas en láminas finas. Mezcla con canela, azúcar moreno y zumo de limón.', durationMinutes: 10, isTimeDependent: 1 },
    { id: generateId(), recipeId: r1, order: 2, description: 'Estira la masa y cubre un molde engrasado. Pincha la base con un tenedor.', durationMinutes: 5, isTimeDependent: 0 },
    { id: generateId(), recipeId: r1, order: 3, description: 'Coloca las manzanas sobre la masa en forma decorativa.', durationMinutes: 5, isTimeDependent: 0 },
    { id: generateId(), recipeId: r1, order: 4, description: 'Hornea a 180°C durante 40-45 minutos hasta que esté dorada.', durationMinutes: 45, isTimeDependent: 0 },
  ]);

  // --- Tortilla de patatas ---
  const r2 = generateId();
  await db.insert(recipes).values({
    id: r2,
    name: 'Tortilla de patatas',
    description: 'La auténtica tortilla española, con patatas y cebolla pochada. Jugosa por dentro y dorada por fuera.',
    baseServings: 4,
    prepTime: 15,
    cookTime: 30,
    difficulty: 'easy',
    type: 'dish',
    tags: JSON.stringify(['española', 'tradicional', 'sartén']),
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(ingredients).values([
    { id: generateId(), recipeId: r2, name: 'patatas', quantity: 500, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r2, name: 'cebolla', quantity: 1, unit: 'unidad', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r2, name: 'huevos', quantity: 5, unit: 'unidades', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r2, name: 'aceite de oliva', quantity: 200, unit: 'ml', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r2, name: 'sal', quantity: 1, unit: 'cucharadita', optional: 0, scalable: 0 },
  ]);
  await db.insert(steps).values([
    { id: generateId(), recipeId: r2, order: 0, description: 'Pela las patatas y córtalas en láminas finas. Pica la cebolla en juliana.', durationMinutes: 10, isTimeDependent: 1 },
    { id: generateId(), recipeId: r2, order: 1, description: 'Calienta abundante aceite en una sartén y pocha las patatas con la cebolla a fuego medio-bajo durante 15-20 minutos. Deben quedar tiernas, no crujientes.', durationMinutes: 20, isTimeDependent: 1 },
    { id: generateId(), recipeId: r2, order: 2, description: 'Escurre las patatas y cebolla del aceite. Bate los huevos con la sal y mezcla con las patatas.', durationMinutes: 2, isTimeDependent: 0 },
    { id: generateId(), recipeId: r2, order: 3, description: 'En una sartén antiadherente con un poco de aceite, vierte la mezcla. Cocina a fuego medio 3-4 minutos por cada lado.', durationMinutes: 8, isTimeDependent: 0 },
    { id: generateId(), recipeId: r2, order: 4, description: 'Deja reposar 2 minutos antes de servir. Puedes dejarla jugosa o más cuajada al gusto.', durationMinutes: 2, isTimeDependent: 0 },
  ]);

  // --- Gazpacho andaluz ---
  const r3 = generateId();
  await db.insert(recipes).values({
    id: r3,
    name: 'Gazpacho andaluz',
    description: 'Sopa fría tradicional andaluza a base de tomate. Refrescante y nutritiva, ideal para el verano.',
    baseServings: 4,
    prepTime: 15,
    cookTime: 0,
    difficulty: 'easy',
    type: 'dish',
    tags: JSON.stringify(['frío', 'verano', 'saludable']),
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(ingredients).values([
    { id: generateId(), recipeId: r3, name: 'tomates maduros', quantity: 1, unit: 'kg', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r3, name: 'pepino', quantity: 1, unit: 'unidad', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r3, name: 'pimiento verde', quantity: 1, unit: 'unidad', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r3, name: 'ajo', quantity: 1, unit: 'diente', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r3, name: 'pan del día anterior', quantity: 50, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r3, name: 'aceite de oliva virgen extra', quantity: 50, unit: 'ml', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r3, name: 'vinagre de Jerez', quantity: 2, unit: 'cucharadas', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r3, name: 'sal', quantity: 1, unit: 'cucharadita', optional: 0, scalable: 0 },
  ]);
  await db.insert(steps).values([
    { id: generateId(), recipeId: r3, order: 0, description: 'Lava los tomates, el pepino y el pimiento. Trocea todo.', durationMinutes: 5, isTimeDependent: 1 },
    { id: generateId(), recipeId: r3, order: 1, description: 'Pon todos los ingredientes en una batidora: tomate, pepino, pimiento, ajo, pan, aceite y vinagre. Tritura hasta obtener una crema fina.', durationMinutes: 3, isTimeDependent: 0 },
    { id: generateId(), recipeId: r3, order: 2, description: 'Añade agua fría hasta conseguir la textura deseada. Ajusta de sal y vinagre.', durationMinutes: 1, isTimeDependent: 0 },
    { id: generateId(), recipeId: r3, order: 3, description: 'Refrigera al menos 2 horas antes de servir. Sirve bien frío.', durationMinutes: 120, isTimeDependent: 0 },
  ]);

  // --- Arroz con leche ---
  const r4 = generateId();
  await db.insert(recipes).values({
    id: r4,
    name: 'Arroz con leche',
    description: 'Postre cremoso de arroz cocinado en leche con canela y limón. Un clásico que nunca falla.',
    baseServings: 4,
    prepTime: 5,
    cookTime: 45,
    difficulty: 'easy',
    type: 'dessert',
    tags: JSON.stringify(['cremoso', 'tradicional', 'postre']),
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(ingredients).values([
    { id: generateId(), recipeId: r4, name: 'arroz redondo', quantity: 150, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r4, name: 'leche entera', quantity: 1, unit: 'L', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r4, name: 'azúcar', quantity: 120, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r4, name: 'canela en rama', quantity: 1, unit: 'rama', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r4, name: 'cáscara de limón', quantity: 1, unit: 'tira', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r4, name: 'canela en polvo', quantity: 1, unit: 'cucharadita', optional: 1, scalable: 0 },
  ]);
  await db.insert(steps).values([
    { id: generateId(), recipeId: r4, order: 0, description: 'Pon el arroz en un colador y lávalo bajo agua fría hasta que salga clara.', durationMinutes: 2, isTimeDependent: 0 },
    { id: generateId(), recipeId: r4, order: 1, description: 'En una cacerola, calienta la leche con la canela en rama y la cáscara de limón. Cuando empiece a hervir, añade el arroz.', durationMinutes: 5, isTimeDependent: 0 },
    { id: generateId(), recipeId: r4, order: 2, description: 'Cocina a fuego bajo, removiendo ocasionalmente, durante 40-45 minutos hasta que el arroz esté tierno y la mezcla cremosa.', durationMinutes: 45, isTimeDependent: 1 },
    { id: generateId(), recipeId: r4, order: 3, description: 'Retira la canela y el limón. Añade el azúcar y remueve 2 minutos más.', durationMinutes: 2, isTimeDependent: 0 },
    { id: generateId(), recipeId: r4, order: 4, description: 'Reparte en cuencos y deja enfriar. Espolvorea con canela en polvo antes de servir.', durationMinutes: 0, isTimeDependent: 0 },
  ]);

  // --- Pollo al curry ---
  const r5 = generateId();
  await db.insert(recipes).values({
    id: r5,
    name: 'Pollo al curry',
    description: 'Un sabroso pollo al curry con leche de coco. Cremoso, aromático y perfecto con arroz basmati.',
    baseServings: 4,
    prepTime: 15,
    cookTime: 30,
    difficulty: 'medium',
    type: 'dish',
    tags: JSON.stringify(['exótico', 'picante', 'arroces']),
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(ingredients).values([
    { id: generateId(), recipeId: r5, name: 'pechuga de pollo', quantity: 500, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r5, name: 'leche de coco', quantity: 400, unit: 'ml', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r5, name: 'cebolla', quantity: 1, unit: 'unidad', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r5, name: 'ajo', quantity: 2, unit: 'dientes', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r5, name: 'curry en polvo', quantity: 2, unit: 'cucharadas', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r5, name: 'jengibre fresco', quantity: 1, unit: 'trozo', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r5, name: 'aceite vegetal', quantity: 2, unit: 'cucharadas', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r5, name: 'sal', quantity: 1, unit: 'cucharadita', optional: 0, scalable: 0 },
    { id: generateId(), recipeId: r5, name: 'arroz basmati', quantity: 300, unit: 'g', optional: 0, scalable: 1 },
  ]);
  await db.insert(steps).values([
    { id: generateId(), recipeId: r5, order: 0, description: 'Corta el pollo en cubos. Pica la cebolla, el ajo y ralla el jengibre.', durationMinutes: 10, isTimeDependent: 1 },
    { id: generateId(), recipeId: r5, order: 1, description: 'En una sartén grande, calienta el aceite y sofríe la cebolla hasta que esté transparente. Añade ajo y jengibre, cocina 1 minuto.', durationMinutes: 5, isTimeDependent: 1 },
    { id: generateId(), recipeId: r5, order: 2, description: 'Añade el pollo y dóralo por todos lados. Incorpora el curry en polvo y mezcla bien.', durationMinutes: 5, isTimeDependent: 1 },
    { id: generateId(), recipeId: r5, order: 3, description: 'Vierte la leche de coco, reduce el fuego y cocina a fuego lento 15-20 minutos hasta que el pollo esté cocido.', durationMinutes: 20, isTimeDependent: 1 },
    { id: generateId(), recipeId: r5, order: 4, description: 'Mientras, cuece el arroz basmati según las instrucciones del paquete.', durationMinutes: 12, isTimeDependent: 0 },
    { id: generateId(), recipeId: r5, order: 5, description: 'Sirve el pollo al curry sobre el arroz caliente.', durationMinutes: 0, isTimeDependent: 0 },
  ]);

  // --- Brownie de chocolate ---
  const r6 = generateId();
  await db.insert(recipes).values({
    id: r6,
    name: 'Brownie de chocolate',
    description: 'Brownie intenso de chocolate con nueces. Crujiente por fuera y jugoso por dentro.',
    baseServings: 8,
    prepTime: 15,
    cookTime: 25,
    difficulty: 'easy',
    type: 'bakery',
    tags: JSON.stringify(['chocolate', 'horno', 'americano']),
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(ingredients).values([
    { id: generateId(), recipeId: r6, name: 'chocolate negro', quantity: 200, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r6, name: 'mantequilla', quantity: 150, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r6, name: 'azúcar', quantity: 200, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r6, name: 'huevos', quantity: 3, unit: 'unidades', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r6, name: 'harina de trigo', quantity: 80, unit: 'g', optional: 0, scalable: 1 },
    { id: generateId(), recipeId: r6, name: 'nueces', quantity: 80, unit: 'g', optional: 1, scalable: 1 },
    { id: generateId(), recipeId: r6, name: 'sal', quantity: 1, unit: 'pizca', optional: 0, scalable: 0 },
  ]);
  await db.insert(steps).values([
    { id: generateId(), recipeId: r6, order: 0, description: 'Precalienta el horno a 180°C. Engrasa un molde cuadrado.', durationMinutes: 5, isTimeDependent: 0 },
    { id: generateId(), recipeId: r6, order: 1, description: 'Derrite el chocolate con la mantequilla al baño maría o en el microondas. Mezcla hasta integrar.', durationMinutes: 5, isTimeDependent: 0 },
    { id: generateId(), recipeId: r6, order: 2, description: 'En un bol, bate los huevos con el azúcar hasta que estén espumosos. Incorpora el chocolate derretido.', durationMinutes: 3, isTimeDependent: 0 },
    { id: generateId(), recipeId: r6, order: 3, description: 'Tamiza la harina con la sal y añade a la mezcla. Incorpora las nueces troceadas.', durationMinutes: 2, isTimeDependent: 0 },
    { id: generateId(), recipeId: r6, order: 4, description: 'Vierte la masa en el molde y hornea 20-25 minutos. El centro debe quedar ligeramente húmedo.', durationMinutes: 25, isTimeDependent: 0 },
    { id: generateId(), recipeId: r6, order: 5, description: 'Deja enfriar 10 minutos antes de cortar en porciones.', durationMinutes: 10, isTimeDependent: 0 },
  ]);
}
