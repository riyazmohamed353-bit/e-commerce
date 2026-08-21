import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow, typography } from '../theme/theme';

export default function StatCard({ icon, label, value, tint = colors.primary, tintBg = colors.primaryLight }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minWidth: 120,
    ...shadow.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { ...typography.h2, fontSize: 20 },
  label: { ...typography.caption, marginTop: 2 },
});
