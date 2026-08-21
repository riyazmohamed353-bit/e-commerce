import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthHero from '../components/AuthHero';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresOtp) {
        // Account exists but was never verified - backend already sent a
        // fresh code, so send the user straight to the OTP screen.
        navigation.navigate('OtpVerification', { email: data.email, purpose: 'verify' });
        return;
      }
      Alert.alert('Login failed', data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <AuthHero title="Welcome back" subtitle="Sign in to buy and sell smarter with AI" icon="log-in-outline" />

        <View style={styles.form}>
          <TextField
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            icon="lock-closed-outline"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title={busy ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            loading={busy}
            icon="log-in-outline"
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.footerRow}>
            <Text style={typography.bodyMuted}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.xl, paddingTop: spacing.xxl, flex: 1 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.xs },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
