import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MainApp } from './components/MainApp';

// Using test user bypass - no email authentication required
export default function App() {
  return <MainApp />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFE7',
  },
});
