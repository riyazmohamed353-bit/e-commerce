import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';

export default function CreateListingScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('phone');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('');
  const [ram, setRam] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [conditionText, setConditionText] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');
  const [photos, setPhotos] = useState([]); // { uri, base64 }

  const [aiEstimate, setAiEstimate] = useState(null);
  const [aiCondition, setAiCondition] = useState(null);
  const [busy, setBusy] = useState(false);

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      allowsMultipleSelection: true,
      quality: 0.6,
    });
    if (!result.canceled) {
      setPhotos(result.assets.slice(0, 4).map((a) => ({ uri: a.uri, base64: a.base64 })));
    }
  };

  const runAiPriceCheck = async () => {
    setBusy(true);
    try {
      const specs = { storage, ram, ageMonths: Number(ageMonths) || 0, batteryHealth: Number(batteryHealth) || 0 };
      const { data } = await client.post('/ai/price-estimate', {
        title, brand, model, specs, conditionText, category, sellerPrice: Number(sellerPrice) || undefined,
      });
      setAiEstimate(data);
    } catch (err) {
      Alert.alert('AI price check failed', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const runAiConditionCheck = async () => {
    if (!photos.length) return Alert.alert('Add photos first');
    setBusy(true);
    try {
      const { data } = await client.post('/ai/condition-check', {
        photosBase64: photos.map((p) => p.base64),
      });
      setAiCondition(data);
    } catch (err) {
      Alert.alert('AI condition check failed', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!title || !sellerPrice) return Alert.alert('Title and price are required');
    setBusy(true);
    try {
      const specs = { storage, ram, ageMonths: Number(ageMonths) || 0, batteryHealth: Number(batteryHealth) || 0 };
      // NOTE: for a real production app, upload photo files to Firebase/S3
      // and store their URLs instead of raw base64 in Mongo.
      const { data } = await client.post('/listings', {
        title, category, brand, model, specs, conditionText,
        sellerPrice: Number(sellerPrice),
        photos: photos.map((p) => p.uri),
        aiEstimate: aiEstimate || undefined,
        aiCondition: aiCondition || undefined,
      });
      Alert.alert('Listing published!');
      navigation.navigate('ListingDetail', { listingId: data._id });
    } catch (err) {
      Alert.alert('Failed to publish', err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <TextInput style={styles.input} placeholder="Title (e.g. iPhone 14 Pro 256GB)" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Category (phone/laptop/tablet)" value={category} onChangeText={setCategory} />
      <TextInput style={styles.input} placeholder="Brand" value={brand} onChangeText={setBrand} />
      <TextInput style={styles.input} placeholder="Model" value={model} onChangeText={setModel} />
      <TextInput style={styles.input} placeholder="Storage (e.g. 256GB)" value={storage} onChangeText={setStorage} />
      <TextInput style={styles.input} placeholder="RAM (e.g. 8GB)" value={ram} onChangeText={setRam} />
      <TextInput style={styles.input} placeholder="Age in months" keyboardType="numeric" value={ageMonths} onChangeText={setAgeMonths} />
      <TextInput style={styles.input} placeholder="Battery health %" keyboardType="numeric" value={batteryHealth} onChangeText={setBatteryHealth} />
      <TextInput style={styles.input} placeholder="Describe the condition" value={conditionText} onChangeText={setConditionText} multiline />
      <TextInput style={styles.input} placeholder="Your asking price (₹)" keyboardType="numeric" value={sellerPrice} onChangeText={setSellerPrice} />

      <TouchableOpacity style={styles.secondaryBtn} onPress={pickPhotos}>
        <Text style={styles.secondaryBtnText}>📷 Add Photos ({photos.length}/4)</Text>
      </TouchableOpacity>
      <View style={styles.photoRow}>
        {photos.map((p, i) => <Image key={i} source={{ uri: p.uri }} style={styles.thumb} />)}
      </View>

      <TouchableOpacity style={styles.secondaryBtn} onPress={runAiPriceCheck} disabled={busy}>
        <Text style={styles.secondaryBtnText}>🤖 Get AI Price Estimate</Text>
      </TouchableOpacity>
      {aiEstimate && (
        <View style={styles.aiBox}>
          <Text style={styles.aiBoxTitle}>AI Estimate: ₹{aiEstimate.low?.toLocaleString('en-IN')} - ₹{aiEstimate.high?.toLocaleString('en-IN')}</Text>
          <Text>Recommended listing: ₹{aiEstimate.recommended?.toLocaleString('en-IN')}</Text>
          <Text style={styles.aiReasoning}>{aiEstimate.reasoning}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.secondaryBtn} onPress={runAiConditionCheck} disabled={busy}>
        <Text style={styles.secondaryBtnText}>🔎 AI Photo Condition Check</Text>
      </TouchableOpacity>
      {aiCondition && (
        <View style={styles.aiBox}>
          <Text style={styles.aiBoxTitle}>Condition score: {aiCondition.score}/100</Text>
          {aiCondition.issues?.map((issue, i) => <Text key={i}>• {issue}</Text>)}
        </View>
      )}

      <TouchableOpacity style={styles.publishBtn} onPress={publish} disabled={busy}>
        <Text style={styles.publishBtnText}>{busy ? 'Working...' : 'Publish Listing'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10 },
  secondaryBtn: { backgroundColor: '#eef2ff', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  secondaryBtnText: { color: '#2563eb', fontWeight: '600' },
  photoRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  thumb: { width: 60, height: 60, borderRadius: 6 },
  aiBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 10 },
  aiBoxTitle: { fontWeight: '700', marginBottom: 4 },
  aiReasoning: { color: '#555', marginTop: 4, fontStyle: 'italic' },
  publishBtn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  publishBtnText: { color: '#fff', fontWeight: '700' },
});
