import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface WaveformAnimationProps {
  isActive: boolean;
  color?: string;
}

export function WaveformAnimation({ isActive, color = '#8A9A5B' }: WaveformAnimationProps) {
  const bars = useRef(
    Array.from({ length: 5 }, () => ({
      height: new Animated.Value(8),
    }))
  ).current;

  useEffect(() => {
    if (isActive) {
      // Create staggered animations for each bar
      const animations = bars.map((bar, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(bar.height, {
              toValue: 32,
              duration: 400,
              useNativeDriver: false,
            }),
            Animated.timing(bar.height, {
              toValue: 8,
              duration: 400,
              useNativeDriver: false,
            }),
          ])
        );
      });

      Animated.parallel(animations).start();
    } else {
      // Reset all bars to minimum height
      bars.forEach(bar => {
        bar.height.setValue(8);
      });
    }
  }, [isActive, bars]);

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: bar.height,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 8,
    maxHeight: 32,
  },
});

