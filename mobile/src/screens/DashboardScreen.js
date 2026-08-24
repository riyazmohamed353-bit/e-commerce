import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ListingCard from '../components/ListingCard';
import { colors, spacing, typography, radius, shadow } from '../theme/theme';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    active: 0,
    sold: 0,
    total: 0,
    recent: [],
  });

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/listings/dashboard-stats');

      setStats({
        active: data?.active || 0,
        sold: data?.sold || 0,
        total: data?.total || 0,
        recent: Array.isArray(data?.recent) ? data.recent : [],
      });
    } catch (err) {
      console.warn(
        'Failed to load dashboard:',
        err.response?.data?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const trustScore = Math.min(
    100,
    Math.max(0, Number(user?.trustScore) || 0)
  );

  const firstName = user?.name?.trim()?.split(' ')[0] || 'there';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.smallWelcome}>Welcome back</Text>

          <Text style={styles.username}>
            {firstName} <Text style={styles.wave}>👋</Text>
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage your marketplace activity
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons
              name="person-outline"
              size={21}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.logoutButton}
            onPress={logout}
          >
            <Ionicons
              name="log-out-outline"
              size={21}
              color={colors.danger}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* TRUST SCORE */}
      <View style={styles.trustCard}>
        <View style={styles.trustTop}>
          <View style={styles.trustIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color={colors.primary}
            />
          </View>

          <View style={styles.trustTextContainer}>
            <Text style={styles.trustTitle}>Seller Trust Score</Text>
            <Text style={styles.trustDescription}>
              Build trust by completing sales
            </Text>
          </View>

          <Text style={styles.trustScore}>{trustScore}</Text>
          <Text style={styles.trustOutOf}>/100</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${trustScore}%` },
            ]}
          />
        </View>
      </View>

      {/* STAT CARDS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your activity</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="pricetags-outline"
          label="Active"
          value={stats.active}
          tint={colors.primary}
          tintBg={colors.primaryLight}
        />

        <StatCard
          icon="checkmark-circle-outline"
          label="Sold"
          value={stats.sold}
          tint={colors.success}
          tintBg={colors.successLight}
        />

        <StatCard
          icon="albums-outline"
          label="Total"
          value={stats.total}
          tint={colors.accent}
          tintBg={colors.accentLight}
        />
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => navigation.navigate('CreateListing')}
        >
          <View style={[styles.actionIcon, styles.primaryIcon]}>
            <Ionicons
              name="add-circle-outline"
              size={27}
              color={colors.primary}
            />
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Sell a Device</Text>
            <Text style={styles.actionSubtitle}>
              Create a new listing
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => navigation.navigate('MyListings')}
        >
          <View style={[styles.actionIcon, styles.greenIcon]}>
            <Ionicons
              name="list-outline"
              size={27}
              color={colors.success}
            />
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>My Listings</Text>
            <Text style={styles.actionSubtitle}>
              Manage your products
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={[styles.actionIcon, styles.purpleIcon]}>
            <Ionicons
              name="sparkles-outline"
              size={27}
              color={colors.accent}
            />
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Smart Search</Text>
            <Text style={styles.actionSubtitle}>
              Find devices with AI
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => navigation.navigate('Marketplace')}
        >
          <View style={[styles.actionIcon, styles.orangeIcon]}>
            <Ionicons
              name="storefront-outline"
              size={27}
              color={colors.warning || colors.primary}
            />
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Marketplace</Text>
            <Text style={styles.actionSubtitle}>
              Browse used electronics
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* RECENT LISTINGS */}
      <View style={styles.recentHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recent listings</Text>
          <Text style={styles.sectionSubtitle}>
            Your latest products
          </Text>
        </View>

        {stats.total > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyListings')}
          >
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LOADING */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />
          <Text style={styles.loadingText}>
            Loading your listings...
          </Text>
        </View>
      ) : stats.recent.length === 0 ? (
        /* EMPTY STATE */
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="cube-outline"
              size={38}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No listings yet
          </Text>

          <Text style={styles.emptyText}>
            Sell your first used electronic device and start
            earning.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.emptyButton}
            onPress={() => navigation.navigate('CreateListing')}
          >
            <Ionicons
              name="add"
              size={19}
              color={colors.white}
            />

            <Text style={styles.emptyButtonText}>
              Sell a Device
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {stats.recent.map((item) => (
            <ListingCard
              key={item._id}
              listing={item}
              onPress={() =>
                navigation.navigate('ListingDetail', {
                  listingId: item._id,
                })
              }
            />
          ))}
        </View>
      )}

      {/* BOTTOM INFO */}
      <View style={styles.infoCard}>
        <Ionicons
          name="sparkles"
          size={22}
          color={colors.primary}
        />

        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>
            AI-powered marketplace
          </Text>

          <Text style={styles.infoDescription}>
            Get fair price estimates and AI condition checks
            before selling.
          </Text>
        </View>
      </View>
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
    paddingBottom: spacing.xxl + 20,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },

  headerLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },

  smallWelcome: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 3,
  },

  username: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  wave: {
    fontSize: 24,
  },

  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* TRUST */

  trustCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },

  trustTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trustIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  trustTextContainer: {
    flex: 1,
  },

  trustTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  trustDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },

  trustScore: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.primary,
  },

  trustOutOf: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    marginLeft: 2,
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

  /* SECTIONS */

  sectionHeader: {
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },

  /* STATS */

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  /* QUICK ACTIONS */

  actionGrid: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  actionCard: {
    minHeight: 72,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.sm,
  },

  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  primaryIcon: {
    backgroundColor: colors.primaryLight,
  },

  greenIcon: {
    backgroundColor: colors.successLight,
  },

  purpleIcon: {
    backgroundColor: colors.accentLight,
  },

  orangeIcon: {
    backgroundColor: colors.primaryLight,
  },

  actionText: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  actionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },

  /* RECENT */

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  viewAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  /* LOADING */

  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.sm,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: spacing.lg,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 7,
  },

  emptyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  /* INFO */

  infoCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  infoDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },
});