import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/theme';

export default function OtpInput({ length = 6, value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (text, index) => {
    // Support paste of the full code into any box
    if (text.length > 1) {
      onChange(text.replace(/\D/g, '').slice(0, length));
      inputs.current[Math.min(text.length, length) - 1]?.focus();
      return;
    }
    const next = digits.slice();
    next[index] = text.replace(/\D/g, '');
    onChange(next.join(''));
    if (text && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          style={[styles.box, d ? styles.boxFilled : null]}
          value={d}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={length}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: {
    width: 46,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
});
