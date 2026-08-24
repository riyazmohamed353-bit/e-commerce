import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, radius, typography, shadow } from '../theme/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [city, setCity] = useState(user?.city || '');

  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      Alert.alert('Invalid pincode', 'Pincode must contain 6 digits.');
      return;
    }

    try {
      setSaving(true);

      await client.patch('/auth/profile', {
        name: name.trim(),
        phone: phone.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
      });

      Alert.alert(
        'Profile updated',
        'Your profile has been updated successfully.'
      );
    } catch (err) {
      Alert.alert(
        'Update failed',
        err.response?.data?.message || err.message || 'Unable to update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const trustScore = Number(user?.trustScore || 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>
          {user?.name || 'User'}
        </Text>

        <Text style={styles.email}>
          {user?.email || ''}
        </Text>

        <View style={styles.verifiedBadge}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={colors.success}
          />
          <Text style={styles.verifiedText}>
            {user?.emailVerified ? 'Email verified' : 'Email not verified'}
          </Text>
        </View>
      </View>

      {/* Trust Score */}
      <View style={styles.trustCard}>
        <View style={styles.trustTop}>
          <View>
            <Text style={styles.trustTitle}>
              Seller Trust Score
            </Text>

            <Text style={styles.trustSubtitle}>
              Build trust by selling honestly
            </Text>
          </View>

          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>
              {trustScore}
            </Text>
            <Text style={styles.scoreSmall}>
              /100
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(Math.max(trustScore, 0), 100)}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Account Information */}
      <Text style={styles.sectionTitle}>
        Account information
      </Text>

      <View style={styles.card}>
        <TextField
          icon="person-outline"
          placeholder="Full name"
          value={name}
          onChangeText={setName}
        />

        <TextField
          icon="mail-outline"
          placeholder="Email"
          value={user?.email || ''}
          editable={false}
        />

        <TextField
          icon="call-outline"
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Location */}
      <Text style={styles.sectionTitle}>
        Location
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <TextField
            icon="location-outline"
            placeholder="Pincode"
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
            containerStyle={styles.half}
          />

          <TextField
            icon="business-outline"
            placeholder="City"
            value={city}
            onChangeText={setCity}
            containerStyle={styles.half}
          />
        </View>
      </View>

      {/* Save */}
      <PrimaryButton
        title={saving ? 'Saving...' : 'Save Changes'}
        loading={saving}
        onPress={saveProfile}
        icon="checkmark-outline"
        style={styles.saveButton}
      />

      {/* My Listings */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('MyListings')}
      >
        <View style={styles.menuIcon}>
          <Ionicons
            name="pricetags-outline"
            size={22}
            color={colors.primary}
          />
        </View>

        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>
            My Listings
          </Text>

          <Text style={styles.menuSubtitle}>
            Manage your products and sold items
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutItem}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={22}
          color={colors.danger}
        />

        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>

      <Text style={styles.version}>
        RETech AI Marketplace
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadow.sm,
  },

  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
  },

  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },

  email: {
    ...typography.bodyMuted,
    marginTop: 3,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
  },

  verifiedText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },

  trustCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },

  trustTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  trustTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  trustSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  scoreCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  scoreText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },

  scoreSmall: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 7,
  },

  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },

  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },

  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },

  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  half: {
    flex: 1,
  },

  saveButton: {
    marginBottom: spacing.lg,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },

  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  menuSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },

  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    paddingVertical: 15,
    marginTop: spacing.md,
    gap: 8,
  },

  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },

  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xl,
  },
});