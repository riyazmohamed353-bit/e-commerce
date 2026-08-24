import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, shadow, typography } from '../theme/theme';

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD CONVERSATIONS
  // ==========================================

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/chat/mine');

      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn(
        'Failed to load chats:',
        err.response?.data?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever Messages screen gets focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ==========================================
  // REFRESH
  // ==========================================

  const onRefresh = async () => {
    setRefreshing(true);

    await load();

    setRefreshing(false);
  };

  // ==========================================
  // FIND OTHER USER
  // ==========================================
  const otherParty = (chat) => {
    if (!chat?.buyer || !chat?.seller) {
      return null;
    }

    const currentUserId =
      user?._id || user?.id;

    if (!currentUserId) {
      console.log(
        'CURRENT USER ID MISSING:',
        user
      );

      return null;
    }

    return String(chat.buyer._id) ===
      String(currentUserId)
      ? chat.seller
      : chat.buyer;
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) return '';

    const messageDate = new Date(date);

    if (Number.isNaN(messageDate.getTime())) {
      return '';
    }

    const now = new Date();

    const sameDay =
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear();

    if (sameDay) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return messageDate.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
    });
  };

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  const getUnreadCount = (chat) => {
    // Supports different backend field names.
    return (
      chat.unreadCount ??
      chat.unreadMessages ??
      0
    );
  };

  // ==========================================
  // LAST MESSAGE
  // ==========================================

  const getLastMessage = (chat) => {
    if (chat.lastMessageText) {
      return chat.lastMessageText;
    }

    if (chat.lastMessage?.text) {
      return chat.lastMessage.text;
    }

    return 'No messages yet';
  };

  // ==========================================
  // LAST MESSAGE TIME
  // ==========================================

  const getLastMessageTime = (chat) => {
    return (
      chat.lastMessageAt ||
      chat.lastMessage?.createdAt ||
      null
    );
  };

  // ==========================================
  // RENDER CHAT
  // ==========================================

  const renderChat = ({ item }) => {
    const other = otherParty(item);

    const unreadCount = getUnreadCount(item);

    const lastMessage = getLastMessage(item);

    const lastMessageTime = getLastMessageTime(item);

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.row}
        onPress={() =>
          navigation.navigate('Chat', {
            chatId: item._id,
            sellerName: other?.name || 'User',
            // FIX: ChatScreen reads route.params.userId / receiverId /
            // sellerId - it does NOT read "otherUserId". Sending the ID
            // under a name ChatScreen doesn't recognize made it think no
            // user was passed at all, which triggered the
            // "User ID was not provided" alert.
            sellerId: other?._id,
            listingId: item.listing?._id,
          })
        }
      >
        {/* ==================================
            PRODUCT IMAGE
        ================================== */}

        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.listing?.photos?.[0] ||
                'https://via.placeholder.com/100',
            }}
            style={styles.thumb}
          />

          {/* Online indicator */}
          {other?.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* ==================================
            CHAT CONTENT
        ================================== */}

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[
                styles.name,
                unreadCount > 0 && styles.unreadName,
              ]}
              numberOfLines={1}
            >
              {other?.name || 'User'}
            </Text>

            <Text
              style={[
                styles.time,
                unreadCount > 0 && styles.unreadTime,
              ]}
            >
              {formatTime(lastMessageTime)}
            </Text>
          </View>

          {/* Listing title */}
          {item.listing?.title ? (
            <Text
              style={styles.listingTitle}
              numberOfLines={1}
            >
              {item.listing.title}
            </Text>
          ) : null}

          {/* ==================================
              LAST MESSAGE + UNREAD BADGE
          ================================== */}

          <View style={styles.previewRow}>
            <Text
              style={[
                styles.preview,
                unreadCount > 0 && styles.unreadPreview,
              ]}
              numberOfLines={1}
            >
              {lastMessage}
            </Text>

            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    );
  };

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>
            Messages
          </Text>

          <Text style={styles.subtitle}>
            Chat with buyers and sellers
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="chatbubbles-outline"
            size={22}
            color={colors.primary}
          />
        </View>
      </View>

      {/* CHAT LIST */}

      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={renderChat}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }

        contentContainerStyle={[
          styles.list,
          chats.length === 0 && styles.emptyList,
        ]}

        showsVerticalScrollIndicator={false}

        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>

              <View style={styles.emptyIcon}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={42}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No messages yet
              </Text>

              <Text style={styles.emptyText}>
                When you contact a buyer or seller,
                your conversations will appear here.
              </Text>

              <TouchableOpacity
                style={styles.marketplaceButton}
                onPress={() =>
                  navigation.navigate('Marketplace')
                }
              >
                <Ionicons
                  name="storefront-outline"
                  size={18}
                  color={colors.white}
                />

                <Text style={styles.marketplaceButtonText}>
                  Browse Marketplace
                </Text>
              </TouchableOpacity>

            </View>
          ) : null
        }
      />
    </View>
  );
}


// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ========================================
  // HEADER
  // ========================================

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,

    backgroundColor: colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  // ========================================
  // LIST
  // ========================================

  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // ========================================
  // CHAT ROW
  // ========================================

  row: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    padding: spacing.md,

    marginBottom: spacing.sm,

    ...shadow.sm,
  },

  // ========================================
  // IMAGE
  // ========================================

  imageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },

  thumb: {
    width: 58,
    height: 58,

    borderRadius: radius.md,

    backgroundColor: colors.border,
  },

  onlineDot: {
    position: 'absolute',

    right: 0,
    bottom: 0,

    width: 14,
    height: 14,

    borderRadius: 7,

    backgroundColor: colors.success,

    borderWidth: 2,
    borderColor: colors.surface,
  },

  // ========================================
  // CONTENT
  // ========================================

  content: {
    flex: 1,
    minWidth: 0,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 2,
  },

  name: {
    ...typography.h3,

    fontSize: 15,

    flex: 1,

    marginRight: spacing.sm,
  },

  unreadName: {
    fontWeight: '800',
  },

  time: {
    color: colors.textMuted,
    fontSize: 11,
  },

  unreadTime: {
    color: colors.primary,
    fontWeight: '700',
  },

  listingTitle: {
    color: colors.textSecondary,

    fontSize: 12,

    marginBottom: 3,
  },

  // ========================================
  // PREVIEW
  // ========================================

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  preview: {
    flex: 1,

    color: colors.textMuted,

    fontSize: 13,
  },

  unreadPreview: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // ========================================
  // UNREAD BADGE
  // ========================================

  unreadBadge: {
    minWidth: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: spacing.sm,

    paddingHorizontal: 5,
  },

  unreadText: {
    color: colors.white,

    fontSize: 11,

    fontWeight: '800',
  },

  // ========================================
  // EMPTY
  // ========================================

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: spacing.xl,
  },

  emptyIcon: {
    width: 86,
    height: 86,

    borderRadius: 43,

    backgroundColor: colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: spacing.lg,
  },

  emptyTitle: {
    ...typography.h2,

    color: colors.textPrimary,

    marginBottom: spacing.sm,
  },

  emptyText: {
    color: colors.textMuted,

    fontSize: 14,

    lineHeight: 21,

    textAlign: 'center',

    marginBottom: spacing.lg,
  },

  marketplaceButton: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    backgroundColor: colors.primary,

    paddingHorizontal: spacing.lg,
    paddingVertical: 13,

    borderRadius: radius.pill,
  },

  marketplaceButtonText: {
    color: colors.white,

    fontSize: 14,

    fontWeight: '700',
  },
});