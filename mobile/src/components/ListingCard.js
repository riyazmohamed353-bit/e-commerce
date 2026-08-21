import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow, typography } from '../theme/theme';

export default function ListingCard({ listing, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: listing.photos?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.price}>₹{listing.sellerPrice?.toLocaleString('en-IN')}</Text>

        <View style={styles.tagRow}>
          {listing.aiEstimate?.recommended ? (
            <View style={styles.aiTag}>
              <Ionicons name="sparkles" size={11} color={colors.accent} />
              <Text style={styles.aiTagText}>AI ₹{listing.aiEstimate.recommended.toLocaleString('en-IN')}</Text>
            </View>
          ) : null}

          {listing.aiCondition?.score != null ? (
            <View style={styles.conditionTag}>
              <Text style={styles.conditionTagText}>{listing.aiCondition.score}/100</Text>
            </View>
          ) : null}
        </View>

        {listing.isSuspicious ? (
          <View style={styles.warningRow}>
            <Ionicons name="warning-outline" size={12} color={colors.danger} />
            <Text style={styles.warning}>Below market value</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  image: { width: 88, height: 88 },
  info: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  title: { ...typography.h3, fontSize: 15 },
  price: { ...typography.h3, fontSize: 17, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accentLight, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  aiTagText: { fontSize: 11, fontWeight: '700', color: colors.accent },
  conditionTag: {
    backgroundColor: colors.primaryLight, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  conditionTagText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  warning: { fontSize: 11, color: colors.danger, fontWeight: '600' },
  chevron: { marginRight: spacing.sm },
});
