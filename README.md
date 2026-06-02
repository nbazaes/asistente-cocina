# Asistente de Cocina

Aplicación móvil de asistente culinario con inteligencia artificial, construida con Expo y React Native. Gestiona tu despensa, escala recetas por comensales y descubre qué puedes cocinar con lo que tienes.

## Propuesta de valor

**No más ideas para cenar.** El asistente combina tres capacidades que se potencian entre sí:

- **Despensa inteligente** — registra los ingredientes que tienes en casa. La app te dice qué recetas puedes preparar ya mismo y qué te falta comprar, ordenadas por porcentaje de coincidencia.
- **IA con búsqueda web** — el chatbot no solo conversa, también busca recetas en internet (vía Serper API) y las importa automáticamente. Pregúntale "¿qué hago con pollo y pimientos?" y te responderá con recetas reales de sitios como Directo al Paladar o Divina Cocina.
- **Importación desde URL** — pega el enlace de cualquier receta que encuentres en la web. La app extrae nombre, ingredientes, pasos, tiempos y porciones usando los datos estructurados (JSON-LD / schema.org Recipe) de la página. Todo listo para guardar con un toque.
- **Escalado por porciones** — ajusta cualquier receta al número de comensales. Los ingredientes se recalculan automáticamente (con unidades inteligentes: no escala "1 pizca de sal", pero sí "200 g de harina").

## Características

- Gestion de recetas con ingredientes, pasos y tags
- Busqueda por nombre, categoria o ingredientes disponibles en tu despensa
- Despensa virtual con comparacion de coincidencias (match %)
- Escalado de recetas por numero de porciones
- Chatbot con IA que busca recetas en la web y las importa automaticamente
- Importacion de recetas desde URLs (JSON-LD / schema.org)
- Soporte para 8 proveedores de IA con deteccion automatica desde la API key
- Base de datos SQLite local — funciona sin conexion

## Proveedores de IA soportados

OpenAI, OpenRouter, DeepSeek, Groq, Mistral, Gemini, Together, xAI (Grok).

## Tecnologias

- **Expo SDK 56** + Expo Router (navegacion basada en archivos)
- **React Native 0.85** + React 19 + TypeScript 6.0
- **expo-sqlite** + drizzle-orm (base de datos SQLite local)
- **Zustand v5** (estado global)
- **openai** (cliente universal compatible con OpenAI para multiples proveedores de IA)
- **pnpm** (gestor de paquetes)

## Requisitos

- Node.js 18 o superior
- pnpm
- Expo CLI (`npx expo`)

## Instalacion

```bash
pnpm install
```

## Ejecucion

```bash
# Iniciar servidor de desarrollo
pnpm start

# Android
pnpm run android

# iOS
pnpm run ios

# Web
pnpm run web
```

## Estructura del proyecto

```
app/            # Rutas de Expo Router (pantallas)
  (tabs)/       # Tabs: inicio, recetas, ajustes
  recipe/       # Pantallas de detalle y creacion de recetas
  chatbot.tsx   # Pantalla del chatbot con IA
src/
  data/         # Capa de datos (DB, migraciones, repositorios)
  services/     # Servicios: IA, busqueda web, importacion, escalado, matching
  stores/       # Stores de Zustand
  theme/        # Tema (colores, fuentes, espaciado)
assets/         # Imagenes e iconos
```

## Licencia

MIT
