import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';

// Decorative gradient hero shown at the top of Login / Register / Forgot
// Password screens - gives the auth flow a distinct, modern identity.
export default function AuthHero({ title, subtitle, icon = 'flash' }) {
  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.badge}>
        <Ionicons name={icon} size={26} color={colors.white} />
      </View>
      <Text style={styles.brand}>ReTech AI</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 64,
    paddingBottom: 36,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brand: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: colors.white, fontSize: 26, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 6 },
});
