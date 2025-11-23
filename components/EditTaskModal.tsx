import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Task } from '../types/task';

interface EditTaskModalProps {
  task: Task;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

const CATEGORIES = ['Tasks', 'Shopping', 'Meals', 'Work', 'Health', 'Home', 'Personal', 'Finance'];

export function EditTaskModal({ task, visible, onClose, onSave, onDelete }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [dueTime, setDueTime] = useState(task.due_time || '');
  const [category, setCategory] = useState(task.category || 'Tasks');
  const [isDone, setIsDone] = useState(task.is_done);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      due_date: dueDate || null,
      due_time: dueTime || null,
      category: category || 'Tasks',
      is_done: isDone,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Task</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Task title"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Due Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2025-11-22)</Text>
          </View>

          {/* Due Time */}
          <View style={styles.field}>
            <Text style={styles.label}>Due Time</Text>
            <TextInput
              style={styles.input}
              value={dueTime}
              onChangeText={setDueTime}
              placeholder="HH:MM"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.hint}>Format: HH:MM (e.g., 15:00 for 3 PM)</Text>
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.pickerButtonText}>{category}</Text>
              <Text style={styles.pickerArrow}>{showCategoryPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <View style={styles.pickerOptions}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.pickerOption,
                      category === cat && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        category === cat && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Is Done */}
          <View style={styles.field}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsDone(!isDone)}
            >
              <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Mark as complete</Text>
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  saveText: {
    fontSize: 16,
    color: '#8A9A5B',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  pickerOptions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionSelected: {
    backgroundColor: '#f0f4e8',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerOptionTextSelected: {
    color: '#8A9A5B',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});

