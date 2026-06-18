import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { RepositoryProvider } from '../src/data/repositories/RepositoryProvider';
import { runMigrations } from '../src/data/database/migrations';
import { seedIfEmpty } from '../src/data/database/seed';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { initializeAI } from '../src/services/AIChatbotService';
import { setSerperApiKey } from '../src/services/WebSearchService';
import { colors, fonts } from '../src/theme';

function AppContent() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        await seedIfEmpty();

        await useSettingsStore.persist.rehydrate();

        const { apiKey, providerId, modelId, serperApiKey } = useSettingsStore.getState();
        if (apiKey) {
          initializeAI(apiKey, providerId, modelId);
        }
        if (serperApiKey) {
          setSerperApiKey(serperApiKey);
        }

        setReady(true);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.background }}>
        <Text style={{ color: colors.error, fontSize: 16, textAlign: 'center', fontFamily: fonts.body }}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 16, fontFamily: fonts.body }}>Preparando todo...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="recipe/[id]"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="recipe/add"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="chatbot"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <RepositoryProvider>
      <AppContent />
    </RepositoryProvider>
  );
}
