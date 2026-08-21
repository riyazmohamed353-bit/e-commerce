import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import client, { BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, shadow, typography } from '../theme/theme';

const SOCKET_URL = BASE_URL.replace('/api', '');

export default function ChatScreen({ route }) {
  const { chatId, sellerName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    client.get(`/chat/${chatId}`).then(({ data }) => setMessages(data));

    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('joinRoom', chatId);
    socket.on('newMessage', (msg) => setMessages((prev) => [...prev, msg]));

    return () => socket.disconnect();
  }, [chatId]);

  const send = () => {
    if (!text.trim()) return;
    socketRef.current.emit('sendMessage', { chatId, senderId: user.id, text: text.trim() });
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{sellerName?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.headerText}>{sellerName}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, i) => item._id || String(i)}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === user.id ? styles.mine : styles.theirs]}>
            <Text style={item.sender === user.id ? styles.mineText : styles.theirsText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={styles.empty}>Say hello 👋 — start the conversation.</Text>}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '700' },
  headerText: { ...typography.h3 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  bubble: { padding: 12, borderRadius: radius.lg, marginBottom: spacing.sm, maxWidth: '75%', ...shadow.sm },
  mine: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  mineText: { color: colors.white },
  theirsText: { color: colors.textPrimary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
    borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: 10, color: colors.textPrimary,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
