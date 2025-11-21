import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Conversation } from '../types/conversation';
import { formatRelativeTime } from '../utils/topicGenerator';

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
  onDelete?: () => void;
}

export function ConversationCard({ conversation, onPress, onDelete }: ConversationCardProps) {
  const swipeAnim = React.useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    Animated.timing(swipeAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDelete) {
        onDelete();
      }
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: swipeAnim }],
          opacity: isDeleting ? 0 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <Text style={styles.topic} numberOfLines={1}>
            {conversation.topic}
          </Text>
          <Text style={styles.time}>
            {formatRelativeTime(conversation.lastMessageTime)}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.messageCount}>
            {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  time: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

