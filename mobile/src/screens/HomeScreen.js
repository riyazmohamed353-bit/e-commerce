import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import client from '../api/client';
import ListingCard from '../components/ListingCard';
import { colors, spacing, typography } from '../theme/theme';

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = useCallback(async () => {
    try {
      const { data } = await client.get('/listings');
      setListings(data);
    } catch (err) {
      console.warn('Failed to load listings', err.message);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h1}>Marketplace</Text>
        <Text style={typography.bodyMuted}>Fresh listings from verified sellers</Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item._id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No listings yet. Be the first to sell!</Text>}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
