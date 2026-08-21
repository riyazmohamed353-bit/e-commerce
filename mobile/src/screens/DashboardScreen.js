import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ListingCard from '../components/ListingCard';
import { colors, spacing, typography, radius, shadow } from '../theme/theme';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ active: 0, sold: 0, total: 0, recent: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/listings/dashboard-stats');
      setStats(data);
    } catch (err) {
      console.warn('Failed to load dashboard stats', err.message);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={typography.bodyMuted}>Welcome back,</Text>
          <Text style={typography.h1}>{user?.name?.split(' ')[0] || 'there'} 👋</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.trustCard}>
        <View>
          <Text style={styles.trustLabel}>Trust Score</Text>
          <Text style={styles.trustValue}>{user?.trustScore ?? '-'}/100</Text>
        </View>
        <View style={styles.trustBarTrack}>
          <View style={[styles.trustBarFill, { width: `${user?.trustScore ?? 0}%` }]} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="pricetags-outline" label="Active listings" value={stats.active} tint={colors.primary} tintBg={colors.primaryLight} />
        <StatCard icon="checkmark-done-outline" label="Sold" value={stats.sold} tint={colors.success} tintBg={colors.successLight} />
        <StatCard icon="albums-outline" label="Total posted" value={stats.total} tint={colors.accent} tintBg={colors.accentLight} />
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Smart Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('CreateListing')}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Sell Device</Text>
        </TouchableOpacity>
      </View>

      <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Your recent listings</Text>
      {!loading && stats.recent.length === 0 ? (
        <Text style={typography.bodyMuted}>No listings yet. Tap "Sell Device" to post your first one.</Text>
      ) : (
        stats.recent.map((item) => (
          <ListingCard
            key={item._id}
            listing={item}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item._id })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  logoutBtn: {
    width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.dangerLight,
    alignItems: 'center', justifyContent: 'center',
  },
  trustCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadow.sm,
  },
  trustLabel: { ...typography.caption },
  trustValue: { ...typography.h2, marginTop: 2, marginBottom: spacing.sm },
  trustBarTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  trustBarFill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.accent },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryLight, borderRadius: radius.lg, paddingVertical: 14, gap: 8,
  },
  quickActionText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
