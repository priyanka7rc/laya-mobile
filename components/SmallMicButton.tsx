import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface SmallMicButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function SmallMicButton({ onPress, disabled = false }: SmallMicButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>🎤</Text>
    </TouchableOpacity>
  );
}

const BUTTON_SIZE = 80; // Smaller than the main mic button

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#8A9A5B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  icon: {
    fontSize: 36,
  },
});

