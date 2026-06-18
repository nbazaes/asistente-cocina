import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fonts } from '../../src/theme';

export default function PoliticaPrivacidadScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Política de Privacidad</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Lo que NO hacemos</Text>
          <Text style={styles.text}>
            No recopilamos datos personales. No usamos rastreadores ni analíticas.
            No compartimos información con terceros. No tenemos servidores donde
            almacenar tus datos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Dónde se guarda tu información</Text>
          <Text style={styles.text}>
            Todas tus recetas, ingredientes y configuraciones se almacenan
            exclusivamente en tu dispositivo, en una base de datos local. Si
            desinstalas la app, toda tu información se elimina junto con ella.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Clave de API para IA</Text>
          <Text style={styles.text}>
            Para usar el asistente virtual, necesitas proporcionar tu propia clave
            de API de un proveedor de inteligencia artificial (como OpenAI,
            DeepSeek, etc.). Esta clave se guarda únicamente en tu dispositivo y
            solo se envía directamente al proveedor que elijas para procesar tus
            consultas. Nunca pasa por servidores intermedios.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Búsqueda web (opcional)</Text>
          <Text style={styles.text}>
            Si configuras una clave de Serper.dev, las consultas de búsqueda se
            envían directamente a ese servicio. Es totalmente opcional.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Código abierto</Text>
          <Text style={styles.text}>
            Esta aplicación es software libre. El código fuente está disponible en
            GitHub bajo la licencia MIT. Puedes revisarlo, modificarlo y compartirlo
            libremente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Contacto</Text>
          <Text style={styles.text}>
            Si tienes dudas sobre esta política, puedes abrir un issue en el
            repositorio de GitHub o contactar al autor del proyecto.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fonts.display,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: fontSize.lg,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
