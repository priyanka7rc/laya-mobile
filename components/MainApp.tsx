import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
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
import { useAuth } from '../context/AuthContext';
import { generateUUID } from '../utils/uuid';
import { parseTaskWithAPI } from '../lib/api';
import { checkForSimilarTasks } from '../utils/similarTaskDetector';

export function MainApp() {
  const { session, signOut } = useAuth();
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
    if (session?.user) {
      loadUserData();
    }
  }, [session]);

  const loadUserData = async () => {
    if (!session?.user) return;
    
    try {
      setLoadingData(true);
      console.log('📥 Loading data for user:', session.user.email);
      
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
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

      // Load conversations with messages
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!messages_conversation_id_fkey (
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('last_message_time', { ascending: false });

      if (conversationsError) {
        console.error('Error loading conversations:', conversationsError);
      } else if (conversationsData) {
        const formattedConversations: Conversation[] = conversationsData.map(conv => ({
          id: conv.id,
          topic: conv.topic,
          status: conv.status as 'active' | 'saved',
          lastMessageTime: new Date(conv.last_message_time),
          messages: (conv.messages || [])
            .map((msg: any) => ({
              id: msg.id,
              role: msg.role as 'user' | 'bot',
              content: msg.content,
              timestamp: new Date(msg.created_at),
            }))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()), // Sort messages by time
        }));
        setConversations(formattedConversations);
        console.log('✅ Loaded conversations:', formattedConversations.length);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const processTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: Message = {
      id: generateUUID(),
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
        id: generateUUID(),
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
    
    let createdTask: Task | null = null;
    let isOptimistic = false;

    // OPTIMISTIC: Parse with regex immediately (instant feedback)
    const taskInfo = parseTaskFromMessage(transcript);
    console.log('📋 Regex task info:', taskInfo);
    
    if (taskInfo && taskInfo.isTask) {
      console.log('✅ Detected as task, parsing date/time...');
      const dueDate = parseDate(taskInfo.rawDate || '');
      const dueTime = parseTime(taskInfo.rawTime || '');
      console.log('📅 Parsed date:', dueDate);
      console.log('🕐 Parsed time:', dueTime);
      
      createdTask = {
        id: generateUUID(),
        title: taskInfo.title,
        due_date: dueDate,
        due_time: dueTime,
        category: taskInfo.suggestedCategory || 'Tasks',
        is_done: false,
        created_at: new Date(),
      };
      isOptimistic = true;
    }
    
    if (createdTask) {
      
      // Save to database
      try {
        if (!session?.user) {
          console.error('No authenticated user - cannot save task');
          return;
        }

        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            user_id: session.user.id,
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

    // Generate bot response immediately (optimistic UI)
    setTimeout(() => {
      setIsBotTyping(true);
      
      setTimeout(() => {
        let botReply: string;
        
        if (createdTask) {
          const dateDisplay = createdTask.due_date ? formatDateForDisplay(createdTask.due_date) : 'Today';
          const timeDisplay = createdTask.due_time ? formatTimeForDisplay(createdTask.due_time) : '8:00 PM';
          botReply = `✓ Task created: "${createdTask.title}"\n📅 ${dateDisplay} at ${timeDisplay}\n📁 ${createdTask.category}`;
          
          // Check for similar tasks and add suggestion
          const suggestion = checkForSimilarTasks(createdTask, tasks);
          if (suggestion) {
            botReply += `\n\n${suggestion}`;
          }

          // If this is optimistic (regex), add "Laya is working..." message
          if (isOptimistic) {
            botReply += '\n\n⏳ Laya is working...';
          }
        } else {
          botReply = generateBotResponse(transcript, false);
        }
        
        const botMessage: Message = {
          id: generateUUID(),
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

        // If optimistic, try to improve with AI in background
        if (isOptimistic && createdTask) {
          improveTaskWithAI(transcript, createdTask, botMessage.id);
        }
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
          id: generateUUID(),
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

  const improveTaskWithAI = async (transcript: string, optimisticTask: Task, botMessageId: string) => {
    console.log('🤖 Improving task with AI in background...');
    
    try {
      // Call AI API
      const apiTask = await parseTaskWithAPI(transcript, session?.access_token);
      
      if (!apiTask) {
        // AI failed, remove "Laya is working..." message
        updateBotMessage(botMessageId, (content) => 
          content.replace('\n\n⏳ Laya is working...', '')
        );
        return;
      }

      console.log('🎯 AI result:', apiTask);

      // Check if AI result is different/better
      const isDifferent = 
        apiTask.title !== optimisticTask.title ||
        apiTask.due_date !== optimisticTask.due_date ||
        apiTask.due_time !== optimisticTask.due_time ||
        apiTask.category !== optimisticTask.category;

      if (isDifferent) {
        console.log('✨ AI improved the task!');
        
        // Update task in database
        const aiTask: Task = {
          ...optimisticTask,
          title: apiTask.title,
          due_date: apiTask.due_date,
          due_time: apiTask.due_time,
          category: apiTask.category || 'Tasks',
        };

        await handleTaskUpdate(optimisticTask.id, {
          title: aiTask.title,
          due_date: aiTask.due_date,
          due_time: aiTask.due_time,
          category: aiTask.category,
        });

        // Update bot message with improved result
        const dateDisplay = aiTask.due_date ? formatDateForDisplay(aiTask.due_date) : 'Today';
        const timeDisplay = aiTask.due_time ? formatTimeForDisplay(aiTask.due_time) : '8:00 PM';
        const newReply = `✓ Task created: "${aiTask.title}"\n📅 ${dateDisplay} at ${timeDisplay}\n📁 ${aiTask.category}`;
        
        updateBotMessage(botMessageId, () => newReply);
      } else {
        console.log('✅ Regex parsing was accurate!');
        // Just remove loading message
        updateBotMessage(botMessageId, (content) => 
          content.replace('\n\n⏳ Laya is working...', '')
        );
      }
    } catch (error) {
      console.error('❌ AI improvement failed:', error);
      // Remove loading message on error
      updateBotMessage(botMessageId, (content) => 
        content.replace('\n\n⏳ Laya is working...', '')
      );
    }
  };

  const updateBotMessage = (messageId: string, updateFn: (content: string) => string) => {
    setActiveConversation(prev => {
      if (!prev) return null;
      
      const updatedMessages = prev.messages.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: updateFn(msg.content),
          };
        }
        return msg;
      });

      return {
        ...prev,
        messages: updatedMessages,
      };
    });
  };

  const saveConversationToDatabase = async (conversation: Conversation) => {
    if (!session?.user) return;

    try {
      // Upsert conversation
      const { error: convError } = await supabase
        .from('conversations')
        .upsert({
          id: conversation.id,
          user_id: session.user.id,
          topic: conversation.topic,
          status: conversation.status,
          last_message_time: conversation.lastMessageTime.toISOString(),
        });

      if (convError) throw convError;

      // Delete existing messages for this conversation
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversation.id);

      // Insert all messages
      if (conversation.messages.length > 0) {
        const { error: msgError } = await supabase
          .from('messages')
          .insert(
            conversation.messages.map(msg => ({
              id: msg.id,
              conversation_id: conversation.id,
              role: msg.role,
              content: msg.content,
              created_at: msg.timestamp.toISOString(),
            }))
          );

        if (msgError) throw msgError;
      }

      console.log('✅ Conversation saved to database:', conversation.id);
    } catch (error) {
      console.error('Error saving conversation:', error);
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

  const handleCloseModal = async () => {
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

      // Save to database
      await saveConversationToDatabase(savedConversation);

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

  const handleDeleteConversation = async (conversationId: string) => {
    if (!session?.user) return;

    try {
      // Delete from database (messages will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      console.log('✅ Conversation deleted:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!session?.user) return;

    try {
      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', session.user.id);

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
    if (!session?.user) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', session.user.id);

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
          {/* User Info & Sign Out */}
          <View style={styles.topBar}>
            <Text style={styles.userEmail}>{session?.user?.email}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
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
                    id: generateUUID(),
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
  },
  userEmail: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  signOutText: {
    color: '#8A9A5B',
    fontSize: 14,
    fontWeight: '600',
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


