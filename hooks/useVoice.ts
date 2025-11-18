import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Alert } from 'react-native';

// TEMPORARY: Expo Go doesn't support @react-native-voice/voice
// This is a demo version. Real voice will work in the development build.

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable] = useState(true); // Demo mode

  const startListening = async () => {
    try {
      setTranscript('');
      setError(null);
      setIsListening(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Show info about demo mode
      Alert.alert(
        'Demo Mode',
        'Voice recognition requires a development build (not Expo Go).\n\nFor now, this is a UI demo. Real voice coming next!',
        [
          {
            text: 'Got it',
            onPress: () => {
              // Simulate transcript after 2 seconds
              setTimeout(() => {
                setTranscript('Buy groceries, call mom, finish report');
                setIsListening(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }, 2000);
            },
          },
        ]
      );
    } catch (e: any) {
      console.error('Start listening error:', e);
      setError(e.message || 'Could not start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      console.error('Stop listening error:', e);
    }
  };

  const cancelListening = async () => {
    try {
      setTranscript('');
      setError(null);
      setIsListening(false);
    } catch (e: any) {
      console.error('Cancel listening error:', e);
    }
  };

  return {
    isListening,
    transcript,
    error,
    isAvailable,
    startListening,
    stopListening,
    cancelListening,
  };
}


