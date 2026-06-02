# Asistente de Cocina

Aplicación móvil de asistente culinario con inteligencia artificial, construida con Expo y React Native.

## Características

- Gestión de recetas con ingredientes y pasos de preparación
- Búsqueda y filtrado de recetas por nombre, tags o ingredientes
- Despensa virtual para llevar control de ingredientes disponibles
- Chatbot con IA para recibir sugerencias de recetas basadas en los ingredientes de tu despensa
- Soporte para múltiples proveedores de IA (OpenAI, OpenRouter, DeepSeek, Groq, Mistral, Gemini, Together, xAI)

## Tecnologías

- **Expo SDK 56** + Expo Router (navegación basada en archivos)
- **React Native 0.85** + React 19 + TypeScript 6.0
- **expo-sqlite** + drizzle-orm (base de datos SQLite local)
- **Zustand v5** (estado global)
- **openai** (cliente universal compatible con OpenAI para múltiples proveedores de IA)

## Requisitos

- Node.js 18 o superior
- Expo CLI (`npx expo`)

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Iniciar servidor de desarrollo
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Estructura del proyecto

```
app/            # Rutas de Expo Router (pantallas)
  (tabs)/       # Tabs: inicio, recetas, ajustes
  recipe/       # Pantallas de detalle y creación de recetas
  chatbot.tsx   # Pantalla del chatbot con IA
src/
  data/         # Capa de datos (DB, migraciones, repositorios)
  services/     # Servicio de chatbot con IA
  stores/       # Stores de Zustand
  theme/        # Tema (colores, fuentes, espaciado)
assets/         # Imágenes e iconos
```

## Licencia

MIT
