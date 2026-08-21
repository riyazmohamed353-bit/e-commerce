import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/theme';

// A styled input used across auth + forms. Pass `secureTextEntry` to get
// an automatic eye / eye-off toggle icon for password fields.
export default function TextField({
  icon,
  secureTextEntry,
  error,
  containerStyle,
  ...rest
}) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          error && styles.containerError,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry ? hidden : false}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.rightIcon}
          >
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  containerError: {
    borderColor: colors.danger,
  },
  leftIcon: { marginRight: spacing.sm },
  rightIcon: { paddingLeft: spacing.sm, paddingVertical: 12 },
  input: {
    flex: 1,
    paddingVertical: 14,
    ...typography.body,
  },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
});
