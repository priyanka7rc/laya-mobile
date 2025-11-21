import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Task } from '../types/task';
import { EditTaskModal } from '../components/EditTaskModal';

interface TasksScreenProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onBack: () => void;
}

export function TasksScreen({ tasks, onTaskUpdate, onTaskDelete, onBack }: TasksScreenProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter tasks by selected date
  const filteredTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date + 'T00:00:00');
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === selected.getTime();
  });

  // Group filtered tasks by category
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const category = task.category || 'Tasks';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const formatSelectedDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selected.getTime() === today.getTime()) {
      return `Today, ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (selected.getTime() === tomorrow.getTime()) {
      return `Tomorrow, ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleToggleComplete = (task: Task) => {
    onTaskUpdate(task.id, { is_done: !task.is_done });
  };

  const handleTaskPress = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveTask = (updates: Partial<Task>) => {
    if (editingTask) {
      onTaskUpdate(editingTask.id, updates);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = () => {
    if (editingTask) {
      onTaskDelete(editingTask.id);
      setEditingTask(null);
    }
  };

  const renderTask = (task: Task) => {
    return (
      <TouchableOpacity
        key={task.id}
        style={styles.taskRow}
        onPress={() => handleTaskPress(task)}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleComplete(task)}
        >
          <View style={[styles.checkboxInner, task.is_done && styles.checkboxChecked]}>
            {task.is_done && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, task.is_done && styles.taskTitleDone]}>
            {task.title}
          </Text>
          {task.due_time && (
            <Text style={styles.taskMeta}>
              {formatTime(task.due_time)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }: { item: [string, Task[]] }) => {
    const [category, categoryTasks] = item;

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {categoryTasks.map(renderTask)}
      </View>
    );
  };

  const categories = Object.entries(groupedTasks);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Voice Chat</Text>
        </TouchableOpacity>
        
        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity style={styles.dateArrow} onPress={handlePreviousDay}>
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.dateText}>{formatSelectedDate()}</Text>
          
          <TouchableOpacity style={styles.dateArrow} onPress={handleNextDay}>
            <Text style={styles.dateArrowText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No tasks for this date</Text>
          <Text style={styles.emptyText}>
            Use voice chat to create tasks or navigate to another date
          </Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item[0]}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Edit Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          visible={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </SafeAreaView>
  );
}

// Helper function
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#8A9A5B',
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: '#8A9A5B',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  dateArrow: {
    padding: 8,
    marginHorizontal: 8,
  },
  dateArrowText: {
    fontSize: 28,
    color: '#8A9A5B',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 200,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  taskRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    padding: 4,
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8A9A5B',
    borderColor: '#8A9A5B',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

