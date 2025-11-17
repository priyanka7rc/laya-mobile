import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { VoiceButton } from './components/VoiceButton';
import { useVoice } from './hooks/useVoice';

export default function App() {
  const {
    isListening,
    transcript,
    error,
    isAvailable,
    startListening,
    stopListening,
  } = useVoice();

  const handleVoicePress = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isAvailable) {
        Alert.alert(
          'Voice Not Available',
          'Voice recognition is not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }
      startListening();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>What's on your mind?</Text>
            <Text style={styles.subtitle}>
              Speak naturally and I'll capture your thoughts
            </Text>
          </View>

          {/* Voice Button */}
          <View style={styles.voiceSection}>
            <VoiceButton
              isListening={isListening}
              onPress={handleVoicePress}
              onLongPress={handleVoicePress}
              disabled={!isAvailable}
            />
          </View>

          {/* Transcript Display */}
          {(transcript || error) && (
            <View style={styles.transcriptContainer}>
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptLabel}>You said:</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}
            </View>
          )}

          {/* Instructions */}
          {!transcript && !error && (
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>How to use:</Text>
              <Text style={styles.instructionText}>
                • Tap the microphone button
              </Text>
              <Text style={styles.instructionText}>
                • Speak your tasks naturally
              </Text>
              <Text style={styles.instructionText}>
                • Tap again to stop recording
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isAvailable
                ? '🎙️ Voice recognition ready'
                : '⚠️ Voice recognition unavailable'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  voiceSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  transcriptContainer: {
    marginTop: 32,
  },
  transcriptBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transcriptLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  transcriptText: {
    fontSize: 18,
    color: '#111827',
    lineHeight: 26,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 16,
    color: '#991B1B',
  },
  instructions: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 24,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
