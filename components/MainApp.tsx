import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useVoice } from '../hooks/useVoice';
import { SmallMicButton } from './SmallMicButton';
import { ConversationModal } from './ConversationModal';
import { ConversationCard } from './ConversationCard';
import { BottomNavigation } from './BottomNavigation';
import { TasksScreen } from '../screens/TasksScreen';
import { WeekView } from '../screens/WeekView';
import { Conversation, Message } from '../types/conversation';
import { Task } from '../types/task';
import { generateBotResponse, parseTaskFromMessage } from '../utils/mockBot';
import { parseDate, parseTime, formatDateForDisplay, formatTimeForDisplay } from '../utils/dateTimeParser';
import { generateTopic } from '../utils/topicGenerator';
import { supabase } from '../lib/supabase';

// Test user ID - bypassing email authentication for testing
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

export function MainApp() {
  const [activeTab, setActiveTab] = useState<'voice' | 'tasks'>('voice');
  const [taskView, setTaskView] = useState<'daily' | 'week'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showLastMessageActions, setShowLastMessageActions] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoadingData(true);
      console.log('📥 Loading data for test user:', TEST_USER_ID);
      
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
      } else if (tasksData) {
        const formattedTasks: Task[] = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          due_date: task.due_date,
          due_time: task.due_time,
          category: task.category || 'Tasks',
          is_done: task.is_done || false,
          created_at: new Date(task.created_at),
        }));
        setTasks(formattedTasks);
        console.log('✅ Loaded tasks:', formattedTasks.length);
      }

      // Load conversations (optional - implement later)
      // For now, keep conversations in local state only

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const processTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: transcript.trim(),
      timestamp: new Date(),
    };

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
    setShowLastMessageActions(false);
    resetInactivityTimer();

    console.log('📝 Processing transcript:', transcript);
    
    const taskInfo = parseTaskFromMessage(transcript);
    console.log('📋 Task info:', taskInfo);
    let createdTask: Task | null = null;
    
    if (taskInfo && taskInfo.isTask) {
      console.log('✅ Detected as task, parsing date/time...');
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
      
      // Save to database
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            user_id: TEST_USER_ID,
            title: createdTask.title,
            due_date: createdTask.due_date,
            due_time: createdTask.due_time,
            category: createdTask.category,
            is_done: false,
          }])
          .select()
          .single();

        if (error) throw error;

        // Use the returned task with proper ID from database
        if (data) {
          const dbTask: Task = {
            id: data.id,
            title: data.title,
            due_date: data.due_date,
            due_time: data.due_time,
            category: data.category || 'Tasks',
            is_done: data.is_done || false,
            created_at: new Date(data.created_at),
          };
          setTasks(prev => [dbTask, ...prev]);
          console.log('✅ Task saved to database:', dbTask);
        }
      } catch (error) {
        console.error('Error saving task:', error);
        // Fallback to local state if database fails
        setTasks(prev => [createdTask!, ...prev]);
        console.log('⚠️ Task saved locally (database failed)');
      }
    }

    // Generate bot response
    setTimeout(() => {
      setIsBotTyping(true);
      
      setTimeout(() => {
        let botReply: string;
        
        if (createdTask) {
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

          if (newConversation.messages.length <= 4) {
            newConversation.topic = generateTopic(newConversation.messages);
          }

          return newConversation;
        });

        setIsBotTyping(false);
        setShowLastMessageActions(true);
        resetInactivityTimer();
      }, 600);
    }, 200);
  };

  const handleTranscriptComplete = (transcript: string) => {
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

  useEffect(() => {
    if (transcript) {
      setCurrentTranscript(transcript);
    } else if (!isListening) {
      setCurrentTranscript('');
    }
  }, [transcript, isListening]);

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
      resetInactivityTimer();
    } else {
      setShowLastMessageActions(false);
      setCurrentTranscript('');
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
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
    
    const messages = activeConversation.messages;
    const lastUserIndex = messages.map(m => m.role).lastIndexOf('user');
    
    if (lastUserIndex !== -1) {
      const newMessages = messages.slice(0, lastUserIndex);
      
      setActiveConversation({
        ...activeConversation,
        messages: newMessages,
      });
      
      setShowLastMessageActions(false);
      
      setTimeout(() => {
        startListening();
      }, 300);
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (activeConversation && activeConversation.messages.length > 0) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('⏱️ Auto-save triggered by inactivity timer (3 min)');
        handleCloseModal();
      }, 180000);
    }
  };

  const handleCloseModal = () => {
    console.log('🚪 Closing modal, active conversation:', activeConversation?.id);
    
    if (isListening) {
      cancelListening();
    }

    if (activeConversation && activeConversation.messages.length > 0) {
      console.log('💾 Auto-saving conversation with', activeConversation.messages.length, 'messages');
      
      const finalTopic = generateTopic(activeConversation.messages);
      console.log('📝 Final topic:', finalTopic);
      
      const savedConversation: Conversation = {
        ...activeConversation,
        topic: finalTopic,
        status: 'saved',
      };

      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== savedConversation.id);
        const updated = [savedConversation, ...filtered];
        console.log('✅ Saved! Total conversations:', updated.length);
        return updated;
      });
    } else {
      console.log('⏭️ No messages to save');
    }

    setActiveConversation(null);
    setIsModalVisible(false);
    setCurrentTranscript('');

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    setActiveConversation({
      ...conversation,
      status: 'active',
    });
    setIsModalVisible(true);
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', TEST_USER_ID);

      if (error) throw error;

      // Update local state
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
      console.log('✅ Task updated in database:', taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      // Still update local state even if database fails
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
      console.log('⚠️ Task updated locally (database failed)');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', TEST_USER_ID);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      console.log('✅ Task deleted from database:', taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Still delete from local state even if database fails
      setTasks(prev => prev.filter(task => task.id !== taskId));
      console.log('⚠️ Task deleted locally (database failed)');
    }
  };

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

  if (loadingData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A9A5B" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EFE7" />
      
      {/* Main Content */}
      {activeTab === 'voice' ? (
        <View style={styles.container}>
          {/* Test User Mode Indicator */}
          <View style={styles.topBar}>
            <Text style={styles.testModeText}>🧪 Test Mode (Database Active)</Text>
          </View>

          {/* Conversations */}
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

          {/* Mic Button */}
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
          if (activeConversation) {
            const messageIndex = activeConversation.messages.findIndex(m => m.id === messageId);
            
            if (messageIndex !== -1) {
              const updatedMessages = [...activeConversation.messages];
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: newText,
              };
              
              const taskInfo = parseTaskFromMessage(newText);
              let createdTask: Task | null = null;
              
              if (taskInfo && taskInfo.isTask) {
                const originalMessage = activeConversation.messages[messageIndex];
                const existingTask = tasks.find(t => 
                  t.title === parseTaskFromMessage(originalMessage.content)?.title
                );
                
                const dueDate = parseDate(taskInfo.rawDate || '');
                const dueTime = parseTime(taskInfo.rawTime || '');
                
                if (existingTask) {
                  createdTask = {
                    ...existingTask,
                    title: taskInfo.title,
                    due_date: dueDate,
                    due_time: dueTime,
                    category: taskInfo.suggestedCategory || existingTask.category,
                  };
                  
                  handleTaskUpdate(existingTask.id, {
                    title: taskInfo.title,
                    due_date: dueDate,
                    due_time: dueTime,
                    category: taskInfo.suggestedCategory || existingTask.category,
                  });
                  console.log('✅ Task updated from edit:', createdTask);
                } else {
                  createdTask = {
                    id: `task-${Date.now()}-edited`,
                    title: taskInfo.title,
                    due_date: dueDate,
                    due_time: dueTime,
                    category: taskInfo.suggestedCategory || 'Tasks',
                    is_done: false,
                    created_at: new Date(),
                  };
                  
                  // Save new task to database
                  supabase
                    .from('tasks')
                    .insert([{
                      user_id: session?.user.id,
                      title: createdTask.title,
                      due_date: createdTask.due_date,
                      due_time: createdTask.due_time,
                      category: createdTask.category,
                      is_done: false,
                    }])
                    .then(({ error }) => {
                      if (error) console.error('Error saving edited task:', error);
                    });

                  setTasks(prev => [createdTask!, ...prev]);
                  console.log('✅ Task created from edit:', createdTask);
                }
              }
              
              if (messageIndex + 1 < updatedMessages.length && updatedMessages[messageIndex + 1].role === 'bot') {
                let newBotReply: string;
                
                if (createdTask) {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFE7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  testModeText: {
    color: '#8A9A5B',
    fontSize: 12,
    fontWeight: '500',
    fontWeight: '500',
  },
  conversationsSection: {
    flex: 1,
    paddingTop: 8,
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


