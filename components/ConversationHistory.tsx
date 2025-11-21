import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ConversationCard } from './ConversationCard';
import { Conversation } from '../types/conversation';

interface ConversationHistoryProps {
  conversations: Conversation[];
  onConversationPress: (conversation: Conversation) => void;
}

export function ConversationHistory({
  conversations,
  onConversationPress,
}: ConversationHistoryProps) {
  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No saved conversations yet</Text>
        <Text style={styles.emptySubtext}>
          Your conversation history will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Previous Conversations</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() => onConversationPress(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
});

