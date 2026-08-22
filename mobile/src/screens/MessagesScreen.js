import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, shadow, typography } from '../theme/theme';

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/chat/mine');
      setChats(data);
    } catch (err) {
      console.warn('Failed to load chats', err.message);
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

  const otherParty = (chat) => (chat.buyer._id === user.id ? chat.seller : chat.buyer);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h1}>Messages</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
        renderItem={({ item }) => {
          const other = otherParty(item);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Chat', { chatId: item._id, sellerName: other?.name })}
            >
              <Image
                source={{ uri: item.listing?.photos?.[0] || 'https://via.placeholder.com/60' }}
                style={styles.thumb}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{other?.name || 'User'}</Text>
                <Text style={styles.listingTitle} numberOfLines={1}>{item.listing?.title}</Text>
                {item.lastMessageText ? (
                  <Text style={styles.preview} numberOfLines={1}>{item.lastMessageText}</Text>
                ) : (
                  <Text style={styles.previewMuted}>No messages yet</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>
              No conversations yet. Message a seller from a listing to start one.
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, ...shadow.sm,
  },
  thumb: { width: 52, height: 52, borderRadius: radius.md },
  name: { ...typography.h3, fontSize: 15 },
  listingTitle: { ...typography.caption, marginTop: 2 },
  preview: { ...typography.bodyMuted, marginTop: 2 },
  previewMuted: { ...typography.caption, marginTop: 2, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
