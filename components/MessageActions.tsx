import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface MessageActionsProps {
  onEdit: () => void;
  onRetry: () => void;
}

export function MessageActions({ onEdit, onRetry }: MessageActionsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>E</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>R</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});

