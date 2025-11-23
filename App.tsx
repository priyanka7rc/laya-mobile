import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MainApp } from './components/MainApp';

// Authentication temporarily disabled for testing
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
