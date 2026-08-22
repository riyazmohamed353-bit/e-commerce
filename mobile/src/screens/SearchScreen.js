import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import ListingCard from '../components/ListingCard';
import { colors, spacing, radius, typography } from '../theme/theme';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filtersUsed, setFiltersUsed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setSearched(true);
    try {
      // Step 1: Gemini turns free text into structured filters
      const { data: filters } = await client.post('/ai/search-parse', { query });
      setFiltersUsed(filters);

      // Step 2: run those filters as a normal Mongo query (backend handles
      // fuzzy category matching and numeric RAM comparisons)
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.minRam) params.minRam = filters.minRam;

      const { data: listings } = await client.get('/listings', { params });
      setResults(listings);
    } catch (err) {
      Alert.alert('Search failed', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h1}>Smart Search</Text>
        <Text style={typography.bodyMuted}>Describe what you want in plain English</Text>
      </View>

      <View style={styles.searchBox}>
        <TextField
          icon="sparkles-outline"
          placeholder='Try: "gaming laptop under 50000 with 16GB RAM"'
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          containerStyle={{ marginBottom: spacing.sm }}
        />
        <PrimaryButton
          title={busy ? 'Searching...' : 'Search with AI'}
          onPress={runSearch}
          loading={busy}
          icon="search-outline"
        />
      </View>

      {filtersUsed && !busy && (
        <View style={styles.filterRow}>
          {filtersUsed.category && <Text style={styles.filterChip}>📱 {filtersUsed.category}</Text>}
          {filtersUsed.brand && <Text style={styles.filterChip}>{filtersUsed.brand}</Text>}
          {filtersUsed.minRam && <Text style={styles.filterChip}>{filtersUsed.minRam}+ RAM</Text>}
          {(filtersUsed.minPrice || filtersUsed.maxPrice) && (
            <Text style={styles.filterChip}>
              ₹{filtersUsed.minPrice?.toLocaleString('en-IN') || '0'} - ₹{filtersUsed.maxPrice?.toLocaleString('en-IN') || '∞'}
            </Text>
          )}
        </View>
      )}

      {busy ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>Understanding your search...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item._id })}
            />
          )}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
          ListEmptyComponent={
            searched ? (
              <View style={styles.centerState}>
                <Ionicons name="search-outline" size={36} color={colors.textMuted} />
                <Text style={[typography.bodyMuted, { marginTop: spacing.sm, textAlign: 'center' }]}>
                  No listings matched that search. Try being less specific.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  searchBox: { paddingHorizontal: spacing.lg },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  filterChip: {
    backgroundColor: colors.primaryLight, color: colors.primary, fontWeight: '600', fontSize: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill,
  },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
});