import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AuthHero from '../components/AuthHero';
import OtpInput from '../components/OtpInput';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme/theme';

const RESEND_COOLDOWN = 30; // seconds

export default function OtpVerificationScreen({ route, navigation }) {
  const { email, purpose } = route.params; // purpose: 'verify' | 'reset'
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Enter the code', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    setBusy(true);
    try {
      if (purpose === 'reset') {
        // For reset flow we just confirm the code is well-formed here and
        // hand off to ResetPassword screen, which submits otp + newPassword together.
        navigation.navigate('ResetPassword', { email, otp });
      } else {
        await verifyOtp(email, otp);
        // AuthContext now has a user -> AppNavigator swaps to the main app automatically.
      }
    } catch (err) {
      Alert.alert('Verification failed', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendOtp(email, purpose);
      setCooldown(RESEND_COOLDOWN);
      Alert.alert('Code sent', 'A new verification code has been emailed to you.');
    } catch (err) {
      Alert.alert('Could not resend', err.response?.data?.message || err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHero
        title="Enter verification code"
        subtitle={`We sent a 6-digit code to ${email}`}
        icon="shield-checkmark-outline"
      />

      <View style={styles.form}>
        <OtpInput value={otp} onChange={setOtp} />

        <PrimaryButton
          title={busy ? 'Verifying...' : 'Verify'}
          onPress={handleVerify}
          loading={busy}
          icon="checkmark-circle-outline"
          style={{ marginTop: spacing.xl }}
        />

        <TouchableOpacity
          style={styles.resendRow}
          onPress={handleResend}
          disabled={cooldown > 0}
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={cooldown > 0 ? colors.textMuted : colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[typography.bodyMuted, cooldown === 0 && { color: colors.primary, fontWeight: '700' }]}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.xl, paddingTop: spacing.xxl },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
});
