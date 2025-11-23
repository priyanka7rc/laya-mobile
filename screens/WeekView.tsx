import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Task } from '../types/task';
import { EditTaskModal } from '../components/EditTaskModal';

interface WeekViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onBack: () => void;
  onDateSelect: (date: Date) => void;
  initialDate?: Date;
}

export function WeekView({ tasks, onTaskUpdate, onTaskDelete, onBack, onDateSelect, initialDate }: WeekViewProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const start = initialDate ? new Date(initialDate) : new Date();
    // Get Sunday of the week
    const day = start.getDay();
    const diff = start.getDate() - day;
    const sunday = new Date(start.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Get 7 days of the week (Sun-Sat)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedWeekStart);
    date.setDate(selectedWeekStart.getDate() + i);
    return date;
  });

  // Group tasks by date
  const tasksByDate = weekDays.map(date => {
    const dateStr = formatDateKey(date);
    const dayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      return task.due_date === dateStr;
    });
    return { date, tasks: dayTasks };
  });

  const handlePreviousWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setSelectedWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setSelectedWeekStart(newStart);
  };

  const handleDateTap = (index: number) => {
    const selectedDate = weekDays[index];
    onDateSelect(selectedDate);
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

  const getMonthDisplay = () => {
    const firstDate = weekDays[0];
    const lastDate = weekDays[6];
    const firstMonth = firstDate.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDate.toLocaleDateString('en-US', { month: 'short' });
    const year = firstDate.getFullYear();

    if (firstMonth === lastMonth) {
      return `${firstMonth} ${year}`;
    } else {
      return `${firstMonth} - ${lastMonth} ${year}`;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Voice Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Date Bar */}
      <View style={styles.dateBarContainer}>
        <TouchableOpacity style={styles.navArrow} onPress={handlePreviousWeek}>
          <Text style={styles.navArrowText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.dateBar}>
          {weekDays.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateColumn,
                isToday(date) && styles.dateColumnToday,
              ]}
              onPress={() => handleDateTap(index)}
            >
              <Text style={[styles.dayName, isToday(date) && styles.dayNameToday]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[styles.dateNumber, isToday(date) && styles.dateNumberToday]}>
                {date.getDate()}
              </Text>
              <Text style={[styles.monthName, isToday(date) && styles.monthNameToday]}>
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.navArrow} onPress={handleNextWeek}>
          <Text style={styles.navArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Month Display */}
      <View style={styles.monthDisplay}>
        <Text style={styles.monthText}>{getMonthDisplay()}</Text>
      </View>

      {/* Task List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {tasksByDate.map((dayData, index) => (
          <View key={index}>
            {/* Date Section Header */}
            <Text style={styles.sectionHeader}>
              {dayData.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
              {isToday(dayData.date) && ' (Today)'}
            </Text>

            {/* Tasks */}
            {dayData.tasks.length === 0 ? (
              <Text style={styles.noTasks}>(No tasks)</Text>
            ) : (
              dayData.tasks.map(task => (
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
                  </View>

                  {task.due_time && (
                    <Text style={styles.taskTime}>{formatTime(task.due_time)}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}
      </ScrollView>

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

// Helper functions
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dateBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navArrow: {
    padding: 8,
  },
  navArrowText: {
    fontSize: 24,
    color: '#8A9A5B',
    fontWeight: '600',
  },
  dateBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateColumn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
  },
  dateColumnToday: {
    backgroundColor: '#f0f4e8',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  dayNameToday: {
    color: '#8A9A5B',
    fontWeight: '700',
  },
  dateNumber: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateNumberToday: {
    color: '#8A9A5B',
    fontWeight: '700',
  },
  monthName: {
    fontSize: 10,
    color: '#9ca3af',
  },
  monthNameToday: {
    color: '#8A9A5B',
    fontWeight: '600',
  },
  monthDisplay: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  noTasks: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 16,
    marginLeft: 8,
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
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
});

