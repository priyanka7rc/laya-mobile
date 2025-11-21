import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BottomNavigationProps {
  activeTab: 'voice' | 'tasks';
  onTabPress: (tab: 'voice' | 'tasks') => void;
}

export function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
        onPress={() => onTabPress('tasks')}
      >
        <Text style={[styles.icon, activeTab === 'tasks' && styles.activeIcon]}>
          📝
        </Text>
        <Text style={[styles.label, activeTab === 'tasks' && styles.activeLabel]}>
          Tasks
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Active state styling
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  activeIcon: {
    opacity: 1,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#8A9A5B',
    fontWeight: '600',
  },
});

