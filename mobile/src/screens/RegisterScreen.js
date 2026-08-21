import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthHero from '../components/AuthHero';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing details', 'Name, email and password are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const data = await register(name.trim(), email.trim(), password, phone.trim());
      navigation.navigate('OtpVerification', { email: data.email, purpose: 'verify' });
    } catch (err) {
      Alert.alert('Registration failed', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <AuthHero title="Create your account" subtitle="Buy and sell used electronics, backed by AI" icon="person-add-outline" />

        <View style={styles.form}>
          <TextField icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} />
          <TextField
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            icon="call-outline"
            placeholder="Phone (optional)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextField
            icon="lock-closed-outline"
            placeholder="Password (min. 6 characters)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <PrimaryButton
            title={busy ? 'Creating account...' : 'Create Account'}
            onPress={handleRegister}
            loading={busy}
            icon="rocket-outline"
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.footerRow}>
            <Text style={typography.bodyMuted}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.xl, paddingTop: spacing.xxl, flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
