import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthHero from '../components/AuthHero';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../theme/theme';

export default function ResetPasswordScreen({ route }) {
  const { email, otp } = route.params;
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", 'Please re-enter matching passwords.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email, otp, password);
      // AuthContext now has a user -> AppNavigator swaps to the main app automatically.
    } catch (err) {
      Alert.alert('Could not reset password', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHero title="Set a new password" subtitle={`For ${email}`} icon="lock-open-outline" />
      <View style={styles.form}>
        <TextField
          icon="lock-closed-outline"
          placeholder="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextField
          icon="lock-closed-outline"
          placeholder="Confirm new password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
        <PrimaryButton
          title={busy ? 'Updating...' : 'Update Password'}
          onPress={handleSubmit}
          loading={busy}
          icon="checkmark-done-outline"
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.xl, paddingTop: spacing.xxl },
});
