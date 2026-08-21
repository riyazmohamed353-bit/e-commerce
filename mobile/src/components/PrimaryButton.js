import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography, shadow, spacing } from '../theme/theme';

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
  variant = 'primary', // 'primary' | 'outline' | 'ghost'
  style,
}) {
  const isDisabled = disabled || loading;

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <TouchableOpacity
        style={[
          styles.base,
          variant === 'outline' ? styles.outline : styles.ghost,
          isDisabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={18} color={colors.primary} style={styles.icon} /> : null}
              <Text style={[typography.button, { color: colors.primary }]}>{title}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.shadowWrap, isDisabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.base}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={18} color={colors.white} style={styles.icon} /> : null}
              <Text style={typography.button}>{title}</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: radius.md, ...shadow.md },
  base: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: spacing.sm },
  disabled: { opacity: 0.55 },
});
