import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen({
  route,
  navigation,
}) {
  // ============================================================
  // PARAMS
  // ============================================================

  const {
    userId,
    receiverId,
    sellerId,
    sellerName,
    userName,
  } = route.params || {};

  const otherUserId =
    userId ||
    receiverId ||
    sellerId;

  const otherUserName =
    sellerName ||
    userName ||
    'User';

  // ============================================================
  // AUTH
  // ============================================================

  const { user } = useAuth();

  const currentUserId =
    user?._id ||
    user?.id;

  // ============================================================
  // STATE
  // ============================================================

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const flatListRef =
    useRef(null);

  // ============================================================
  // LOAD CONVERSATION
  // GET /api/chat/messages/:userId
  // ============================================================

  const loadMessages = useCallback(
    async () => {
      if (!otherUserId) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await client.get(
            `/chat/messages/${otherUserId}`
          );

        console.log(
          'CONVERSATION RESPONSE:',
          response.data
        );

        const data =
          response.data?.messages || [];

        setMessages(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {
        console.log(
          'LOAD CHAT ERROR:',
          error.response?.data ||
            error.message
        );

        Alert.alert(
          'Chat Error',
          error.response?.data?.message ||
            'Could not load conversation.'
        );
      } finally {
        setLoading(false);
      }
    },
    [otherUserId]
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!otherUserId) {
      Alert.alert(
        'Chat Error',
        'User ID was not provided.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );

      setLoading(false);
      return;
    }

    loadMessages();
  }, [
    otherUserId,
    loadMessages,
    navigation,
  ]);

  // ============================================================
  // REFRESH
  // ============================================================

  const refreshMessages =
    async () => {
      if (!otherUserId) {
        return;
      }

      try {
        setRefreshing(true);

        await loadMessages();

      } finally {
        setRefreshing(false);
      }
    };

  // ============================================================
  // SEND MESSAGE
  // POST /api/chat/messages
  // ============================================================

  const sendMessage =
    async () => {
      const cleanText =
        text.trim();

      if (!cleanText) {
        return;
      }

      if (!otherUserId) {
        Alert.alert(
          'Chat Error',
          'Receiver ID is missing.'
        );
        return;
      }

      if (!currentUserId) {
        Alert.alert(
          'Chat Error',
          'You are not logged in.'
        );
        return;
      }

      try {
        setSending(true);

        console.log(
          'SENDING MESSAGE:',
          {
            receiverId:
              otherUserId,
            text:
              cleanText,
          }
        );

        const response =
          await client.post(
            '/chat/messages',
            {
              receiverId:
                otherUserId,

              text:
                cleanText,
            }
          );

        console.log(
          'MESSAGE RESPONSE:',
          response.data
        );

        const newMessage =
          response.data;

        setMessages(
          previous => [
            ...previous,
            newMessage,
          ]
        );

        setText('');

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({
            animated: true,
          });
        }, 100);

      } catch (error) {
        console.log(
          'SEND MESSAGE ERROR:',
          error.response?.data ||
            error.message
        );

        Alert.alert(
          'Message Failed',
          error.response?.data?.message ||
            error.message ||
            'Could not send message.'
        );
      } finally {
        setSending(false);
      }
    };

  // ============================================================
  // CHECK MY MESSAGE
  // ============================================================

  const isMyMessage =
    message => {
      const senderId =
        message.sender?._id ||
        message.sender?.id ||
        message.sender;

      return (
        String(senderId) ===
        String(currentUserId)
      );
    };

  // ============================================================
  // TIME
  // ============================================================

  const formatTime =
    date => {
      if (!date) {
        return '';
      }

      const parsed =
        new Date(date);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return '';
      }

      return parsed.toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    };

  // ============================================================
  // MESSAGE ITEM
  // ============================================================

  const renderMessage =
    ({ item }) => {
      const mine =
        isMyMessage(item);

      return (
        <View
          style={[
            styles.messageRow,
            mine
              ? styles.myMessageRow
              : styles.theirMessageRow,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              mine
                ? styles.myBubble
                : styles.theirBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                mine
                  ? styles.myMessageText
                  : styles.theirMessageText,
              ]}
            >
              {item.text ||
                '[Message unavailable]'}
            </Text>

            <View
              style={
                styles.messageMeta
              }
            >
              <Text
                style={[
                  styles.messageTime,
                  mine
                    ? styles.myTime
                    : styles.theirTime,
                ]}
              >
                {formatTime(
                  item.createdAt
                )}
              </Text>

              {mine && (
                <Ionicons
                  name={
                    item.status ===
                    'read'
                      ? 'checkmark-done'
                      : 'checkmark'
                  }
                  size={15}
                  color={
                    item.status ===
                    'read'
                      ? '#60a5fa'
                      : '#dbeafe'
                  }
                />
              )}
            </View>
          </View>
        </View>
      );
    };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Opening chat...
        </Text>
      </View>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
      keyboardVerticalOffset={
        Platform.OS === 'ios'
          ? 90
          : 0
      }
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111827"
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerAvatar
          }
        >
          <Text
            style={
              styles.headerAvatarText
            }
          >
            {otherUserName
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={
            styles.headerInfo
          }
        >
          <Text
            style={
              styles.headerName
            }
            numberOfLines={1}
          >
            {otherUserName}
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Marketplace user
          </Text>
        </View>
      </View>

      {/* MESSAGES */}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={
          (item, index) =>
            String(
              item._id ||
                item.id ||
                index
            )
        }
        renderItem={
          renderMessage
        }
        contentContainerStyle={
          messages.length === 0
            ? styles.emptyContent
            : styles.messagesContent
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshing={
          refreshing
        }
        onRefresh={
          refreshMessages
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="chatbubbles-outline"
                size={35}
                color="#2563eb"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Start a conversation
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Send a message to{' '}
              {otherUserName}.
            </Text>
          </View>
        }
      />

      {/* INPUT */}

      <View
        style={
          styles.inputContainer
        }
      >
        <TextInput
          value={text}
          onChangeText={
            setText
          }
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={2000}
          style={styles.input}
          editable={!sending}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() ||
              sending) &&
              styles.sendButtonDisabled,
          ]}
          onPress={
            sendMessage
          }
          disabled={
            !text.trim() ||
            sending
          }
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#f8fafc',
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#f8fafc',
    },

    loadingText: {
      marginTop: 12,
      color: '#64748b',
      fontSize: 15,
    },

    header: {
      height: 72,
      backgroundColor:
        '#fff',
      flexDirection: 'row',
      alignItems:
        'center',
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        '#e2e8f0',
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    headerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#dbeafe',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginLeft: 3,
    },

    headerAvatarText: {
      fontSize: 17,
      fontWeight: '800',
      color: '#2563eb',
    },

    headerInfo: {
      flex: 1,
      marginLeft: 11,
    },

    headerName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#111827',
    },

    headerSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: '#64748b',
    },

    messagesContent: {
      paddingHorizontal: 14,
      paddingVertical: 16,
      paddingBottom: 20,
    },

    messageRow: {
      width: '100%',
      marginBottom: 9,
      flexDirection: 'row',
    },

    myMessageRow: {
      justifyContent:
        'flex-end',
    },

    theirMessageRow: {
      justifyContent:
        'flex-start',
    },

    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 16,
    },

    myBubble: {
      backgroundColor:
        '#2563eb',
      borderBottomRightRadius: 4,
    },

    theirBubble: {
      backgroundColor:
        '#fff',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor:
        '#e2e8f0',
    },

    messageText: {
      fontSize: 15,
      lineHeight: 21,
    },

    myMessageText: {
      color: '#fff',
    },

    theirMessageText: {
      color: '#1e293b',
    },

    messageMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'flex-end',
      marginTop: 4,
    },

    messageTime: {
      fontSize: 10,
    },

    myTime: {
      color: '#dbeafe',
    },

    theirTime: {
      color: '#94a3b8',
    },

    emptyContent: {
      flexGrow: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      padding: 30,
    },

    emptyContainer: {
      alignItems:
        'center',
      maxWidth: 300,
    },

    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor:
        '#eff6ff',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    emptyTitle: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '800',
      color: '#111827',
    },

    emptyText: {
      marginTop: 7,
      textAlign: 'center',
      color: '#64748b',
      lineHeight: 20,
    },

    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor:
        '#fff',
      borderTopWidth: 1,
      borderTopColor:
        '#e2e8f0',
      paddingHorizontal: 10,
      paddingVertical: 9,
    },

    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 110,
      backgroundColor:
        '#f1f5f9',
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 11,
      paddingBottom: 11,
      color: '#111827',
      fontSize: 15,
      marginRight: 8,
    },

    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        '#2563eb',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    sendButtonDisabled: {
      backgroundColor:
        '#94a3b8',
    },
  });