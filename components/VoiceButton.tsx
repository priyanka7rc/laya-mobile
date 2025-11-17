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
}

export function VoiceButton({
  isListening,
  onPress,
  onLongPress,
  disabled = false,
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
            transform: [{ scale: pulseAnim }],
            opacity: isListening ? 0.3 : 0,
          },
        ]}
      />
      
      <TouchableOpacity
        style={[
          styles.button,
          isListening && styles.buttonListening,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>{isListening ? '🔴' : '🎤'}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {isListening ? 'Listening...' : 'Tap to speak'}
      </Text>
    </View>
  );
}

const { width } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(width * 0.4, 160);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#8B5CF6', // Purple
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
    fontSize: 60,
  },
  hint: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  ripple: {
    position: 'absolute',
    width: BUTTON_SIZE * 1.5,
    height: BUTTON_SIZE * 1.5,
    borderRadius: (BUTTON_SIZE * 1.5) / 2,
    backgroundColor: '#8B5CF6',
  },
});

