import { useState, useEffect, useRef } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Haptics from 'expo-haptics';

export function useVoice(onTranscriptComplete?: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      console.log('🔍 Checking permissions...');
      const status = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log('✅ Permission response:', JSON.stringify(status, null, 2));
      console.log('📊 Status:', status.status);
      console.log('🔐 Granted:', status.granted);
      console.log('🔓 CanAskAgain:', status.canAskAgain);
      
      setPermissionStatus(status.status);
      // Available if granted OR if we can ask (undetermined or can ask again)
      // Only unavailable if explicitly denied and can't ask again
      const available = status.granted || status.status === 'undetermined' || status.canAskAgain;
      console.log('🎤 Setting isAvailable to:', available);
      setIsAvailable(available);
    } catch (e: any) {
      console.error('❌ Permission check error:', e);
      console.error('❌ Error details:', JSON.stringify(e, null, 2));
      setError('Could not check permissions');
      setIsAvailable(false);
    }
  };

  // Listen for speech recognition results
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      // Get the latest result (interim or final)
      const latestResult = event.results[event.results.length - 1];
      if (latestResult.transcript) {
        // Always update transcript for real-time display (interim results)
        setTranscript(latestResult.transcript);
        
        // Only process final results (complete utterances)
        if (latestResult.isFinal && onTranscriptComplete) {
          // Use the final transcript
          const finalTranscript = latestResult.transcript.trim();
          if (finalTranscript.length > 0) {
            onTranscriptComplete(finalTranscript);
            // Don't clear transcript immediately - let it show until next start
          }
        }
      }
    }
  });

  // Listen for errors
  useSpeechRecognitionEvent('error', (event) => {
    // Ignore "aborted" errors - these are expected during cleanup
    if (event.error === 'aborted' || event.code === -1) {
      return; // Silently ignore abort errors
    }
    
    console.error('Speech recognition error:', event);
    setError(event.message || 'Speech recognition error');
    setIsListening(false);
  });

  // Listen for start event
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
  });

  // Listen for speech end
  useSpeechRecognitionEvent('speechend', () => {
    // Keep listening if continuous mode is enabled
    // The transcript will be updated via the 'result' event
  });

  const startListening = async () => {
    try {
      // Check permissions first
      if (permissionStatus !== 'granted') {
        const status = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setPermissionStatus(status.status);
        setIsAvailable(status.granted);
        
        if (!status.granted) {
          setError('Microphone permission is required');
          return;
        }
      }

      // Clear any previous transcript and errors
      setTranscript('');
      setError(null);
      
      // Ensure any previous recognition is stopped first
      try {
        await ExpoSpeechRecognitionModule.abort();
      } catch (e) {
        // Ignore abort errors - might already be stopped
      }
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start listening
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        continuous: true,
        interimResults: true,
      });

      setIsListening(true);

    } catch (e: any) {
      console.error('Start listening error:', e);
      setError(e.message || 'Could not start voice recognition');
      setIsListening(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const stopListening = async () => {
    try {
      // Stop the recognition
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Process final transcript if available (wait a bit for final result)
      if (transcript && transcript.trim().length > 0 && onTranscriptComplete) {
        // Small delay to ensure final result is processed
        setTimeout(() => {
          if (onTranscriptComplete) {
            onTranscriptComplete(transcript.trim());
          }
        }, 300);
      }
    } catch (e: any) {
      console.error('Stop listening error:', e);
      setIsListening(false);
      // Ensure we abort if stop fails
      try {
        await ExpoSpeechRecognitionModule.abort();
      } catch (abortError) {
        console.error('Abort error:', abortError);
      }
    }
  };

  const cancelListening = async () => {
    try {
      // Properly abort recognition to prevent network errors
      await ExpoSpeechRecognitionModule.abort();
      setTranscript('');
      setError(null);
      setIsListening(false);
      
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    } catch (e: any) {
      console.error('Cancel listening error:', e);
      setIsListening(false);
    }
  };

  // Cleanup function to ensure recognition is stopped
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isListening) {
        try {
          const abortPromise = ExpoSpeechRecognitionModule.abort();
          if (abortPromise && typeof abortPromise.catch === 'function') {
            abortPromise.catch(console.error);
          }
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    };
  }, [isListening]);

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    error,
    isAvailable,
    permissionStatus,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  };
}