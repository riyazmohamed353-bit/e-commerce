import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} from '../theme/theme';

const CATEGORIES = [
  { key: 'phone', label: 'Phone', icon: 'phone-portrait-outline' },
  { key: 'laptop', label: 'Laptop', icon: 'laptop-outline' },
  { key: 'tablet', label: 'Tablet', icon: 'tablet-portrait-outline' },
  { key: 'smartwatch', label: 'Watch', icon: 'watch-outline' },
  { key: 'camera', label: 'Camera', icon: 'camera-outline' },
  { key: 'other', label: 'Other', icon: 'cube-outline' },
];

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

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
  const [photos, setPhotos] = useState([]);

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
      setPhotos(
        result.assets
          .slice(0, 4)
          .map((a) => ({
            uri: a.uri,
            base64: a.base64,
          }))
      );
    }
  };

  const runAiPriceCheck = async () => {
    setBusy(true);

    try {
      const specs = {
        storage,
        ram,
        ageMonths: Number(ageMonths) || 0,
        batteryHealth: Number(batteryHealth) || 0,
      };

      const { data } = await client.post('/ai/price-estimate', {
        title,
        brand,
        model,
        specs,
        conditionText,
        category,
        sellerPrice: Number(sellerPrice) || undefined,
      });

      setAiEstimate(data);
    } catch (err) {
      Alert.alert(
        'AI price check failed',
        err.response?.data?.message || err.message
      );
    } finally {
      setBusy(false);
    }
  };

  const runAiConditionCheck = async () => {
    if (!photos.length) {
      return Alert.alert('Add photos first');
    }

    setBusy(true);

    try {
      const { data } = await client.post('/ai/condition-check', {
        photosBase64: photos.map((p) => p.base64),
      });

      setAiCondition(data);
    } catch (err) {
      Alert.alert(
        'AI condition check failed',
        err.response?.data?.message || err.message
      );
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!title || !sellerPrice) {
      return Alert.alert('Title and price are required');
    }

    setBusy(true);

    try {
      const specs = {
        storage,
        ram,
        ageMonths: Number(ageMonths) || 0,
        batteryHealth: Number(batteryHealth) || 0,
      };

      // Store photos as base64 data URIs so they're actually persisted
      // on the server (in MongoDB) and visible to everyone - not just
      // a local file path on this phone, which disappears once the
      // image cache clears.
      const { data } = await client.post('/listings', {
        title,
        category,
        brand,
        model,
        specs,
        conditionText,
        sellerPrice: Number(sellerPrice),
        photos: photos.map(
          (p) => `data:image/jpeg;base64,${p.base64}`
        ),
        aiEstimate: aiEstimate || undefined,
        aiCondition: aiCondition || undefined,
      });

      Alert.alert('Listing published!');
      navigation.navigate('ListingDetail', {
        listingId: data._id,
      });
    } catch (err) {
      Alert.alert(
        'Failed to publish',
        err.response?.data?.message || err.message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <SectionLabel>Category</SectionLabel>

        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => {
            const active = category === c.key;

            return (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
                onPress={() => setCategory(c.key)}
              >
                <Ionicons
                  name={c.icon}
                  size={16}
                  color={
                    active ? colors.white : colors.primary
                  }
                />

                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionLabel>Basic info</SectionLabel>

        <TextField
          icon="pricetag-outline"
          placeholder="Title (e.g. iPhone 14 Pro 256GB)"
          value={title}
          onChangeText={setTitle}
        />

        <TextField
          icon="business-outline"
          placeholder="Brand (e.g. Apple, Samsung)"
          value={brand}
          onChangeText={setBrand}
        />

        <TextField
          icon="cube-outline"
          placeholder="Model"
          value={model}
          onChangeText={setModel}
        />

        <SectionLabel>Specs</SectionLabel>

        <View style={styles.row2}>
          <TextField
            icon="save-outline"
            placeholder="Storage (256GB)"
            value={storage}
            onChangeText={setStorage}
            containerStyle={styles.half}
          />

          <TextField
            icon="hardware-chip-outline"
            placeholder="RAM (8GB)"
            value={ram}
            onChangeText={setRam}
            containerStyle={styles.half}
          />
        </View>

        <View style={styles.row2}>
          <TextField
            icon="time-outline"
            placeholder="Age (months)"
            keyboardType="numeric"
            value={ageMonths}
            onChangeText={setAgeMonths}
            containerStyle={styles.half}
          />

          <TextField
            icon="battery-half-outline"
            placeholder="Battery health %"
            keyboardType="numeric"
            value={batteryHealth}
            onChangeText={setBatteryHealth}
            containerStyle={styles.half}
          />
        </View>

        <TextField
          icon="document-text-outline"
          placeholder="Describe the condition (scratches, dents, accessories included...)"
          value={conditionText}
          onChangeText={setConditionText}
          multiline
          style={{
            minHeight: 70,
            textAlignVertical: 'top',
            paddingTop: 12,
          }}
        />

        <TextField
          icon="cash-outline"
          placeholder="Your asking price (₹)"
          keyboardType="numeric"
          value={sellerPrice}
          onChangeText={setSellerPrice}
        />

        <SectionLabel>Photos</SectionLabel>

        <PrimaryButton
          title={`Add Photos (${photos.length}/4)`}
          onPress={pickPhotos}
          variant="outline"
          icon="camera-outline"
          style={{ marginBottom: spacing.sm }}
        />

        {photos.length > 0 && (
          <View style={styles.photoRow}>
            {photos.map((p, i) => (
              <Image
                key={i}
                source={{ uri: p.uri }}
                style={styles.thumb}
              />
            ))}
          </View>
        )}

        <SectionLabel>AI tools</SectionLabel>

        <PrimaryButton
          title="Get AI Price Estimate"
          onPress={runAiPriceCheck}
          loading={busy}
          variant="outline"
          icon="sparkles-outline"
          style={{ marginBottom: spacing.sm }}
        />

        {aiEstimate && (
          <View style={styles.aiBox}>
            <Text style={styles.aiBoxTitle}>
              AI Estimate: ₹
              {aiEstimate.low?.toLocaleString('en-IN')} - ₹
              {aiEstimate.high?.toLocaleString('en-IN')}
            </Text>

            <Text style={typography.body}>
              Recommended listing: ₹
              {aiEstimate.recommended?.toLocaleString('en-IN')}
            </Text>

            <Text style={styles.aiReasoning}>
              {aiEstimate.reasoning}
            </Text>
          </View>
        )}

        <PrimaryButton
          title="AI Photo Condition Check"
          onPress={runAiConditionCheck}
          loading={busy}
          variant="outline"
          icon="scan-outline"
          style={{
            marginTop: spacing.sm,
            marginBottom: spacing.sm,
          }}
        />

        {aiCondition && (
          <View style={styles.aiBox}>
            <Text style={styles.aiBoxTitle}>
              Condition score: {aiCondition.score}/100
            </Text>

            {aiCondition.issues?.map((issue, i) => (
              <Text
                key={i}
                style={typography.body}
              >
                • {issue}
              </Text>
            ))}
          </View>
        )}

        <PrimaryButton
          title={busy ? 'Working...' : 'Publish Listing'}
          onPress={publish}
          loading={busy}
          icon="rocket-outline"
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },

  chipActive: {
    backgroundColor: colors.primary,
  },

  chipText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },

  chipTextActive: {
    color: colors.white,
  },

  row2: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  half: {
    flex: 1,
  },

  photoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },

  aiBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },

  aiBoxTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: colors.textPrimary,
  },

  aiReasoning: {
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
    fontSize: 13,
  },
});