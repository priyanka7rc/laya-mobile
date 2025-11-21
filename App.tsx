import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  Text,
} from 'react-native';
import { useVoice } from './hooks/useVoice';
import { SmallMicButton } from './components/SmallMicButton';
import { ConversationModal } from './components/ConversationModal';
import { ConversationCard } from './components/ConversationCard';
import { BottomNavigation } from './components/BottomNavigation';
import { TasksScreen } from './screens/TasksScreen';
import { WeekView } from './screens/WeekView';
import { Conversation, Message } from './types/conversation';
import { Task } from './types/task';
import { generateBotResponse, parseTaskFromMessage } from './utils/mockBot';
import { parseDate, parseTime, formatDateForDisplay, formatTimeForDisplay } from './utils/dateTimeParser';
import { generateTopic } from './utils/topicGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'voice' | 'tasks'>('voice');
  const [taskView, setTaskView] = useState<'daily' | 'week'>('week'); // Week view by default
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showLastMessageActions, setShowLastMessageActions] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const processTranscript = (transcript: string) => {
    if (!transcript.trim()) return;

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: transcript.trim(),
      timestamp: new Date(),
    };

    // Add to active conversation or create new one
    let updatedConversation: Conversation;
    
    if (activeConversation) {
      updatedConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, userMessage],
        lastMessageTime: new Date(),
      };
    } else {
      updatedConversation = {
        id: `conv-${Date.now()}`,
        topic: 'New Conversation',
        messages: [userMessage],
        lastMessageTime: new Date(),
        status: 'active',
      };
    }

    setActiveConversation(updatedConversation);
    setShowLastMessageActions(false); // Hide actions when new message is added
    resetInactivityTimer();

    console.log('📝 Processing transcript:', transcript);
    
    // Check if message is a task
    const taskInfo = parseTaskFromMessage(transcript);
    console.log('📋 Task info:', taskInfo);
    let createdTask: Task | null = null;
    
    if (taskInfo && taskInfo.isTask) {
      console.log('✅ Detected as task, parsing date/time...');
      // Create task
      const dueDate = parseDate(taskInfo.rawDate || '');
      const dueTime = parseTime(taskInfo.rawTime || '');
      console.log('📅 Parsed date:', dueDate);
      console.log('🕐 Parsed time:', dueTime);
      
      createdTask = {
        id: `task-${Date.now()}`,
        title: taskInfo.title,
        due_date: dueDate,
        due_time: dueTime,
        category: taskInfo.suggestedCategory || 'Tasks',
        is_done: false,
        created_at: new Date(),
      };
      
      // Add to tasks list
      setTasks(prev => [createdTask!, ...prev]);
      
      console.log('✅ Task created:', createdTask);
    }

    // Generate bot response
    setTimeout(() => {
      setIsBotTyping(true);
      
      setTimeout(() => {
        let botReply: string;
        
        if (createdTask) {
          // Task-specific response with details
          const dateDisplay = createdTask.due_date ? formatDateForDisplay(createdTask.due_date) : 'Today';
          const timeDisplay = createdTask.due_time ? formatTimeForDisplay(createdTask.due_time) : '8:00 PM';
          botReply = `✓ Task created: "${createdTask.title}"\n📅 ${dateDisplay} at ${timeDisplay}\n📁 ${createdTask.category}`;
        } else {
          botReply = generateBotResponse(transcript, false);
        }
        
        const botMessage: Message = {
          id: `msg-${Date.now()}-bot`,
          role: 'bot',
          content: botReply,
          timestamp: new Date(),
        };

        setActiveConversation(prev => {
          if (!prev) return null;
          
          const newConversation = {
            ...prev,
            messages: [...prev.messages, botMessage],
            lastMessageTime: new Date(),
          };

          // Update topic if this is early in the conversation
          if (newConversation.messages.length <= 4) {
            newConversation.topic = generateTopic(newConversation.messages);
          }

          return newConversation;
        });

        setIsBotTyping(false);
        // Show E/R buttons after bot responds
        setShowLastMessageActions(true);
        // Always reset timer after bot responds
        resetInactivityTimer();
      }, 600);
    }, 200);
  };

  const handleTranscriptComplete = (transcript: string) => {
    // Auto-accept transcript immediately
    processTranscript(transcript);
  };

  const {
    isListening,
    transcript,
    isAvailable,
    permissionStatus,
    startListening,
    stopListening,
    cancelListening,
  } = useVoice(handleTranscriptComplete);

  // Update current transcript for real-time display
  useEffect(() => {
    if (transcript) {
      setCurrentTranscript(transcript);
    } else if (!isListening) {
      // Clear transcript when not listening (after processing)
      setCurrentTranscript('');
    }
  }, [transcript, isListening]);

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
      // Reset timer when stopping (user might speak again soon)
      resetInactivityTimer();
    } else {
      // Hide E/R buttons when starting new recording
      setShowLastMessageActions(false);
      
      // Clear current transcript when starting fresh
      setCurrentTranscript('');
      
      // Clear timer while actively listening
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
      // If no active conversation, create one
      if (!activeConversation) {
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          topic: 'New Conversation',
          messages: [],
          lastMessageTime: new Date(),
          status: 'active',
        };
        setActiveConversation(newConversation);
      }
      
      // Open modal if not already open
      if (!isModalVisible) {
        setIsModalVisible(true);
      }
      
      startListening();
    }
  };

  const handleEditLastMessage = () => {
    if (!activeConversation) return;
    
    const userMessages = activeConversation.messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (lastUserMessage) {
      setEditingMessageId(lastUserMessage.id);
    }
  };

  const handleRetryLastMessage = () => {
    if (!activeConversation) return;
    
    // Find and remove last user message and its bot response
    const messages = activeConversation.messages;
    const lastUserIndex = messages.map(m => m.role).lastIndexOf('user');
    
    if (lastUserIndex !== -1) {
      // Remove last user message and any messages after it (bot response)
      const newMessages = messages.slice(0, lastUserIndex);
      
      setActiveConversation({
        ...activeConversation,
        messages: newMessages,
      });
      
      setShowLastMessageActions(false);
      
      // Start listening for new message
      setTimeout(() => {
        startListening();
      }, 300);
    }
  };

  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Only set timer if there's an active conversation with messages
    if (activeConversation && activeConversation.messages.length > 0) {
      // Set new timer for 3 minutes (extended from 1 minute)
      inactivityTimerRef.current = setTimeout(() => {
        console.log('⏱️ Auto-save triggered by inactivity timer (3 min)');
        handleCloseModal();
      }, 180000); // 180 seconds = 3 minutes
    }
  };

  const handleCloseModal = () => {
    console.log('🚪 Closing modal, active conversation:', activeConversation?.id);
    
    // Stop listening if active
    if (isListening) {
      cancelListening();
    }

    // Auto-save conversation if it has messages
    if (activeConversation && activeConversation.messages.length > 0) {
      console.log('💾 Auto-saving conversation with', activeConversation.messages.length, 'messages');
      
      // Update topic one final time
      const finalTopic = generateTopic(activeConversation.messages);
      console.log('📝 Final topic:', finalTopic);
      
      const savedConversation: Conversation = {
        ...activeConversation,
        topic: finalTopic,
        status: 'saved',
      };

      // Remove from conversations if it exists, then add to top
      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== savedConversation.id);
        const updated = [savedConversation, ...filtered];
        console.log('✅ Saved! Total conversations:', updated.length);
        return updated;
      });
    } else {
      console.log('⏭️ No messages to save');
    }

    // Clear active conversation and close modal
    setActiveConversation(null);
    setIsModalVisible(false);
    setCurrentTranscript('');

    // Clear timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      )
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Set as active and open modal
    setActiveConversation(conversation);
    setIsModalVisible(true);
    
    // Remove from saved conversations list
    setConversations(prev => prev.filter(c => c.id !== conversation.id));
    
    resetInactivityTimer();
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (isListening) {
        cancelListening();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EFE7" />
      
      {/* Main Content - Conditional Rendering */}
      {activeTab === 'voice' ? (
        <View style={styles.container}>
          {/* Top Half: Recent Conversations */}
          <View style={styles.conversationsSection}>
            {conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyText}>No conversations yet</Text>
                <Text style={styles.emptySubtext}>Tap the mic to start</Text>
              </View>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ConversationCard
                    conversation={item}
                    onPress={() => handleConversationPress(item)}
                    onDelete={() => handleDeleteConversation(item.id)}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>

          {/* Bottom Half: Mic Button */}
          <View style={styles.micSection}>
            <SmallMicButton
              onPress={handleMicPress}
              disabled={!isAvailable || permissionStatus === 'denied'}
            />
          </View>
        </View>
      ) : taskView === 'daily' ? (
        <TasksScreen
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onBack={() => setActiveTab('voice')}
          onWeekView={() => setTaskView('week')}
          initialDate={selectedDate}
        />
      ) : (
        <WeekView
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onBack={() => setActiveTab('voice')}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setTaskView('daily');
          }}
          initialDate={selectedDate}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />

      {/* Conversation Modal */}
      <ConversationModal
        visible={isModalVisible}
        conversation={activeConversation}
        isListening={isListening}
        isBotTyping={isBotTyping}
        currentTranscript={currentTranscript}
        showLastMessageActions={showLastMessageActions}
        editingMessageId={editingMessageId}
        onClose={handleCloseModal}
        onMicPress={handleMicPress}
        onMicLongPress={() => cancelListening()}
        onEditLastMessage={handleEditLastMessage}
        onRetryLastMessage={handleRetryLastMessage}
        onEditComplete={(messageId, newText) => {
          // Update the message and regenerate bot response
          if (activeConversation) {
            const messageIndex = activeConversation.messages.findIndex(m => m.id === messageId);
            
            if (messageIndex !== -1) {
              const updatedMessages = [...activeConversation.messages];
              
              // Update user message
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: newText,
              };
              
              // Check if edited message is now a task
              const taskInfo = parseTaskFromMessage(newText);
              let createdTask: Task | null = null;
              
              if (taskInfo && taskInfo.isTask) {
                // Find existing task from original message
                const originalMessage = activeConversation.messages[messageIndex];
                const existingTask = tasks.find(t => 
                  t.title === parseTaskFromMessage(originalMessage.content)?.title
                );
                
                const dueDate = parseDate(taskInfo.rawDate || '');
                const dueTime = parseTime(taskInfo.rawTime || '');
                
                if (existingTask) {
                  // Update existing task
                  createdTask = {
                    ...existingTask,
                    title: taskInfo.title,
                    due_date: dueDate,
                    due_time: dueTime,
                    category: taskInfo.suggestedCategory || existingTask.category,
                  };
                  
                  setTasks(prev => prev.map(t => t.id === existingTask.id ? createdTask! : t));
                  console.log('✅ Task updated from edit:', createdTask);
                } else {
                  // Create new task
                  createdTask = {
                    id: `task-${Date.now()}-edited`,
                    title: taskInfo.title,
                    due_date: dueDate,
                    due_time: dueTime,
                    category: taskInfo.suggestedCategory || 'Tasks',
                    is_done: false,
                    created_at: new Date(),
                  };
                  
                  setTasks(prev => [createdTask!, ...prev]);
                  console.log('✅ Task created from edit:', createdTask);
                }
              }
              
              // Regenerate bot response if there's a bot message right after
              if (messageIndex + 1 < updatedMessages.length && updatedMessages[messageIndex + 1].role === 'bot') {
                let newBotReply: string;
                
                if (createdTask) {
                  // Task-specific response
                  const dateDisplay = createdTask.due_date ? formatDateForDisplay(createdTask.due_date) : 'Today';
                  const timeDisplay = createdTask.due_time ? formatTimeForDisplay(createdTask.due_time) : '8:00 PM';
                  newBotReply = `✓ Task created: "${createdTask.title}"\n📅 ${dateDisplay} at ${timeDisplay}\n📁 ${createdTask.category}`;
                } else {
                  newBotReply = generateBotResponse(newText, false);
                }
                
                updatedMessages[messageIndex + 1] = {
                  ...updatedMessages[messageIndex + 1],
                  content: newBotReply,
                };
              }
              
              setActiveConversation({
                ...activeConversation,
                messages: updatedMessages,
              });
            }
          }
          setEditingMessageId(null);
        }}
        onEditCancel={() => setEditingMessageId(null)}
        micDisabled={!isAvailable || permissionStatus === 'denied'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3EFE7',
  },
  container: {
    flex: 1,
  },
  conversationsSection: {
    flex: 1,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  micSection: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F3EFE7',
  },
});
