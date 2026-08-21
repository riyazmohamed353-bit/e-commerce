import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ListingDetailScreen({ route, navigation }) {
  const { listingId } = route.params;
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [negotiation, setNegotiation] = useState(null);

  useEffect(() => {
    client.get(`/listings/${listingId}`).then(({ data }) => setListing(data));
  }, [listingId]);

  const getNegotiationTip = async () => {
    try {
      const { data } = await client.post('/ai/negotiate', {
        sellerPrice: listing.sellerPrice,
        aiEstimate: listing.aiEstimate?.recommended,
        conditionScore: listing.aiCondition?.score || 80,
      });
      setNegotiation(data);
    } catch (err) {
      Alert.alert('Could not get negotiation tip', err.response?.data?.message || err.message);
    }
  };

  const openChat = () => {
    const chatId = [listingId, user.id, listing.seller._id].sort().join('_');
    navigation.navigate('Chat', { chatId, sellerName: listing.seller.name });
  };

  if (!listing) return null;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: listing.photos?.[0] || 'https://via.placeholder.com/400' }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>₹{listing.sellerPrice.toLocaleString('en-IN')}</Text>

        {listing.isSuspicious && (
          <Text style={styles.warning}>⚠️ {listing.suspiciousReason}</Text>
        )}

        {listing.aiEstimate && (
          <View style={styles.aiBox}>
            <Text style={styles.aiBoxTitle}>AI Fair Price</Text>
            <Text>₹{listing.aiEstimate.low?.toLocaleString('en-IN')} - ₹{listing.aiEstimate.high?.toLocaleString('en-IN')}</Text>
            <Text style={styles.aiReasoning}>{listing.aiEstimate.reasoning}</Text>
          </View>
        )}

        {listing.aiCondition && (
          <View style={styles.aiBox}>
            <Text style={styles.aiBoxTitle}>Condition: {listing.aiCondition.score}/100</Text>
            {listing.aiCondition.issues?.map((issue, i) => <Text key={i}>• {issue}</Text>)}
          </View>
        )}

        <Text style={styles.sectionLabel}>Specs</Text>
        <Text>Storage: {listing.specs?.storage || '-'}</Text>
        <Text>RAM: {listing.specs?.ram || '-'}</Text>
        <Text>Age: {listing.specs?.ageMonths ?? '-'} months</Text>
        <Text>Battery health: {listing.specs?.batteryHealth ?? '-'}%</Text>

        <Text style={styles.sectionLabel}>Seller</Text>
        <Text>{listing.seller?.name}</Text>

        <TouchableOpacity style={styles.secondaryBtn} onPress={getNegotiationTip}>
          <Text style={styles.secondaryBtnText}>💰 Get AI Negotiation Tip</Text>
        </TouchableOpacity>
        {negotiation && (
          <View style={styles.aiBox}>
            <Text style={styles.aiBoxTitle}>
              Suggested offer: ₹{negotiation.offerLow?.toLocaleString('en-IN')} - ₹{negotiation.offerHigh?.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.aiReasoning}>{negotiation.message}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
          <Text style={styles.chatBtnText}>Message Seller</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 260 },
  body: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  price: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  warning: { color: '#dc2626', marginTop: 8 },
  aiBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginTop: 12 },
  aiBoxTitle: { fontWeight: '700', marginBottom: 4 },
  aiReasoning: { color: '#555', marginTop: 4, fontStyle: 'italic' },
  sectionLabel: { fontWeight: '700', marginTop: 16, marginBottom: 4 },
  secondaryBtn: { backgroundColor: '#eef2ff', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  secondaryBtnText: { color: '#2563eb', fontWeight: '600' },
  chatBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 40 },
  chatBtnText: { color: '#fff', fontWeight: '700' },
});
