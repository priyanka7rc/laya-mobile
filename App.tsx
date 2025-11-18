import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

export default function App() {
  const [count, setCount] = React.useState(0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>🎉 Laya Mobile</Text>
        <Text style={styles.subtitle}>Voice-First Task Manager</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setCount(count + 1)}
        >
          <Text style={styles.buttonText}>🎤</Text>
        </TouchableOpacity>

        <Text style={styles.counter}>Taps: {count}</Text>
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            ✅ App is working! Voice coming next...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 60,
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 60,
  },
  counter: {
    marginTop: 24,
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  badgeText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
    textAlign: 'center',
  },
});
