import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthHero from '../components/AuthHero';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../theme/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'We need your email to send a reset code.');
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      navigation.navigate('OtpVerification', { email: email.trim(), purpose: 'reset' });
    } catch (err) {
      Alert.alert('Something went wrong', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHero
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a reset code"
        icon="key-outline"
      />
      <View style={styles.form}>
        <TextField
          icon="mail-outline"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PrimaryButton
          title={busy ? 'Sending...' : 'Send Reset Code'}
          onPress={handleSubmit}
          loading={busy}
          icon="paper-plane-outline"
          style={{ marginTop: spacing.sm }}
        />
        <PrimaryButton
          title="Back to Sign In"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={{ marginTop: spacing.md }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.xl, paddingTop: spacing.xxl },
});
