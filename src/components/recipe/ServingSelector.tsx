import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../theme';

interface ServingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  baseServing: number;
  min?: number;
  max?: number;
}

export function ServingSelector({ value, onChange, baseServing, min = 1, max = 20 }: ServingSelectorProps) {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };

  const increase = () => {
    if (value < max) onChange(value + 1);
  };

  const isScaled = value !== baseServing;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, value <= min && styles.btnDisabled]}
        onPress={decrease}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, value <= min && styles.btnTextDisabled]}>−</Text>
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, isScaled && styles.valueScaled]}>{value}</Text>
        <Text style={styles.label}>
          {isScaled ? `de ${baseServing}` : 'personas'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, value >= max && styles.btnDisabled]}
        onPress={increase}
        disabled={value >= max}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, value >= max && styles.btnTextDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: colors.border,
  },
  btnText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 26,
  },
  btnTextDisabled: {
    color: colors.textLight,
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  value: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
  },
  valueScaled: {
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -2,
  },
});
