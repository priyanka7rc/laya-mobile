import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  StatusBar,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import { Conversation } from '../types/conversation';
import { MessageBubble } from './MessageBubble';
import { VoiceButton } from './VoiceButton';
import { WaveformAnimation } from './WaveformAnimation';
import { MessageActions } from './MessageActions';
import { generateTopic } from '../utils/topicGenerator';

interface ConversationModalProps {
  visible: boolean;
  conversation: Conversation | null;
  isListening: boolean;
  isBotTyping: boolean;
  currentTranscript?: string;
  showLastMessageActions?: boolean;
  editingMessageId?: string | null;
  onClose: () => void;
  onMicPress: () => void;
  onMicLongPress: () => void;
  onEditLastMessage?: () => void;
  onRetryLastMessage?: () => void;
  onEditComplete?: (messageId: string, newText: string) => void;
  onEditCancel?: () => void;
  micDisabled: boolean;
}

export function ConversationModal({
  visible,
  conversation,
  isListening,
  isBotTyping,
  currentTranscript = '',
  showLastMessageActions = false,
  editingMessageId = null,
  onClose,
  onMicPress,
  onMicLongPress,
  onEditLastMessage,
  onRetryLastMessage,
  onEditComplete,
  onEditCancel,
  micDisabled,
}: ConversationModalProps) {
  const [editText, setEditText] = React.useState('');
  
  // Get last user message
  const lastUserMessage = React.useMemo(() => {
    if (!conversation?.messages) return null;
    const userMessages = conversation.messages.filter(m => m.role === 'user');
    return userMessages[userMessages.length - 1] || null;
  }, [conversation?.messages]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Update edit text when editing a message
  useEffect(() => {
    if (editingMessageId && conversation) {
      const message = conversation.messages.find(m => m.id === editingMessageId);
      if (message) {
        setEditText(message.content);
      }
    }
  }, [editingMessageId, conversation]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change or typing status changes
    if (scrollViewRef.current) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 200);
      });
    }
  }, [conversation?.messages, isBotTyping, currentTranscript]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1000, 0],
  });

  const title = conversation
    ? generateTopic(conversation.messages)
    : 'New Conversation';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Waveform Animation */}
        {(isListening || isBotTyping) && (
          <View style={styles.waveformContainer}>
            <WaveformAnimation isActive={true} />
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {conversation?.messages.map((message, index) => {
            const isLastUserMessage = lastUserMessage?.id === message.id;
            const showActions = isLastUserMessage && showLastMessageActions && !isListening;
            
            return (
              <React.Fragment key={message.id}>
                <MessageBubble message={message} />
                {showActions && onEditLastMessage && onRetryLastMessage && (
                  <MessageActions
                    onEdit={onEditLastMessage}
                    onRetry={onRetryLastMessage}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Show real-time transcript while listening */}
          {isListening && currentTranscript && (
            <View style={styles.transcriptContainer}>
              <View style={styles.transcriptBubble}>
                <Text style={styles.transcriptText}>{currentTranscript}</Text>
                <Text style={styles.transcriptHint}>Listening...</Text>
              </View>
            </View>
          )}

          {isBotTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}

          {!conversation && !isListening && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>Start speaking</Text>
            </View>
          )}
        </ScrollView>

        {/* Mic Button */}
        <View style={styles.micContainer}>
          <VoiceButton
            isListening={isListening}
            onPress={onMicPress}
            onLongPress={onMicLongPress}
            disabled={micDisabled}
            size={100}
          />
        </View>

        {/* Edit Message Modal */}
        {editingMessageId && onEditComplete && onEditCancel && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={onEditCancel}
          >
            <View style={styles.editModalOverlay}>
              <View style={styles.editModalContainer}>
                <Text style={styles.editModalTitle}>Edit Message</Text>
                
                <TextInput
                  style={styles.editModalInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  autoFocus
                  placeholder="Edit your message..."
                />

                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={[styles.editModalButton, styles.editModalCancelButton]}
                    onPress={onEditCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editModalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.editModalButton, styles.editModalSaveButton]}
                    onPress={() => {
                      if (editText.trim()) {
                        onEditComplete(editingMessageId, editText.trim());
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editModalSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '300',
  },
  waveformContainer: {
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  typingContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  micContainer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  transcriptContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  transcriptBubble: {
    backgroundColor: '#E8EDD9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  transcriptText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 4,
  },
  transcriptHint: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  editModalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editModalCancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editModalSaveButton: {
    backgroundColor: '#8A9A5B',
  },
  editModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  editModalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

