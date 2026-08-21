import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet, Alert } from 'react-native';
import client from '../api/client';
import ListingCard from '../components/ListingCard';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setBusy(true);
    try {
      // Step 1: Gemini turns free text into structured filters
      const { data: filters } = await client.post('/ai/search-parse', { query });

      // Step 2: run those filters as a normal Mongo query
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
      <TextInput
        style={styles.input}
        placeholder='Try: "gaming laptop under 50000 with 16GB RAM"'
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={runSearch}
      />
      <TouchableOpacity style={styles.button} onPress={runSearch} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Searching...' : 'Search with AI'}</Text>
      </TouchableOpacity>

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item._id })}
          />
        )}
        contentContainerStyle={{ paddingTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10 },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
