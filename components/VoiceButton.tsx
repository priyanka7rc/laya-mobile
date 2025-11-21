import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

interface VoiceButtonProps {
  isListening: boolean;
  onPress: () => void;
  onLongPress: () => void;
  disabled?: boolean;
  size?: number;
}

export function VoiceButton({
  isListening,
  onPress,
  onLongPress,
  disabled = false,
  size = BUTTON_SIZE,
}: VoiceButtonProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isListening) {
      // Pulse animation while listening
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.ripple,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: (size * 1.5) / 2,
            transform: [{ scale: pulseAnim }],
            opacity: isListening ? 0.3 : 0,
          },
        ]}
      />
      
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          isListening && styles.buttonListening,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.icon, { fontSize: size * 0.375 }]}>
          {isListening ? '🔴' : '🎤'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {isListening ? 'Listening...' : 'Tap to speak'}
      </Text>
    </View>
  );
}

const { width } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(width * 0.4, 160);

// Smaller size for modal
export const MODAL_BUTTON_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#8A9A5B', // Olive green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonListening: {
    backgroundColor: '#EF4444', // Red when listening
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  icon: {
    // Size is set dynamically
  },
  hint: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  ripple: {
    position: 'absolute',
    backgroundColor: '#8A9A5B',
  },
});


