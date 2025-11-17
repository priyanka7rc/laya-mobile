import { useState, useEffect, useRef } from 'react';
import Voice from '@react-native-voice/voice';
import * as Haptics from 'expo-haptics';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if voice recognition is available
    Voice.isAvailable().then(available => {
      setIsAvailable(!!available);
    });

    // Set up event listeners
    Voice.onSpeechStart = () => {
      setIsListening(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechError = (e) => {
      console.error('Speech error:', e);
      setError(e.error?.message || 'Voice recognition error');
      setIsListening(false);
    };

    // Cleanup
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setTranscript('');
      setError(null);
      await Voice.start('en-US');
    } catch (e: any) {
      console.error('Start listening error:', e);
      setError(e.message || 'Could not start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e: any) {
      console.error('Stop listening error:', e);
    }
  };

  const cancelListening = async () => {
    try {
      await Voice.cancel();
      setTranscript('');
      setError(null);
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

