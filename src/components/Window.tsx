import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize?: () => void;
  status: 'open' | 'minimized' | 'closed';
  active?: boolean;
  onPress?: () => void;
  style?: any;
}

// Apple easing curves from HIG
const EASE_OUT = Easing.bezier(0.25, 0.46, 0.45, 0.94);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1.0);

const Window: React.FC<WindowProps> = ({
  title, children, icon, onClose, onMinimize, onMaximize,
  status, active, onPress, style,
}) => {
  const { settings } = useSettings();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const translateY = useSharedValue(20);
  const isVisible = useSharedValue(0); // 0 = invisible, 1 = visible

  // Track drag position
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const offsetX = React.useRef(0);
  const offsetY = React.useRef(0);

  React.useEffect(() => {
    if (status === 'open') {
      // Smooth entrance / restore from minimized
      opacity.value = withTiming(1, { duration: 200, easing: EASE_OUT });
      scale.value = withTiming(1, { duration: 240, easing: EASE_OUT });
      translateY.value = withTiming(0, { duration: 220, easing: EASE_OUT });
      isVisible.value = 1;
    } else if (status === 'minimized') {
      // Slide and shrink toward the dock at the bottom
      opacity.value = withTiming(0, { duration: 260, easing: EASE_IN_OUT });
      scale.value = withTiming(0.05, { duration: 260, easing: EASE_IN_OUT });
      translateY.value = withTiming(400, { duration: 260, easing: EASE_IN_OUT });
    } else if (status === 'closed') {
      // Quick fade out
      opacity.value = withTiming(0, { duration: 130, easing: EASE_OUT });
      scale.value = withTiming(0.96, { duration: 130, easing: EASE_OUT });
    }
  }, [status]);

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        offsetX.current = dragX.value;
        offsetY.current = dragY.value;
      },
      onPanResponderMove: (_, g) => {
        dragX.value = offsetX.current + g.dx;
        dragY.value = offsetY.current + g.dy;
      },
    })
  ).current;

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: dragX.value },
      { translateY: translateY.value + dragY.value },
      { scale: scale.value },
    ],
  }));

  // Don't render at all if closed and never been opened
  if (status === 'closed') return null;

  return (
    <Animated.View style={[styles.windowWrapper, { zIndex: active ? 100 : 10 }, style, animStyle]}>
      <View style={styles.windowContainer}>
        <BlurView
          intensity={70}
          tint={settings.theme === 'light' ? 'light' : 'dark'}
          style={styles.blurContainer}
        >
          <View style={styles.titleBar}>
            {/* Drag handle covers entire title bar */}
            <View {...panResponder.panHandlers} style={StyleSheet.absoluteFill} />

            <View style={styles.trafficLights}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.dot, styles.closeDot]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
              <TouchableOpacity
                onPress={onMinimize}
                style={[styles.dot, styles.minimizeDot]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
              <TouchableOpacity
                onPress={onMaximize}
                style={[styles.dot, styles.maximizeDot]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
            </View>

            <View style={styles.titleContainer} pointerEvents="none">
              {icon && <View style={styles.iconWrapper}>{icon}</View>}
              <Text style={[styles.titleText, { color: settings.theme === 'light' ? '#333' : '#fff' }]}>
                {title}
              </Text>
            </View>
          </View>

          <Pressable onPress={onPress} style={styles.content}>
            {children}
          </Pressable>
        </BlurView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  windowWrapper: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    height: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  windowContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  blurContainer: { flex: 1 },
  titleBar: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  trafficLights: { flexDirection: 'row', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  closeDot: { backgroundColor: '#FF5F56' },
  minimizeDot: { backgroundColor: '#FFBD2E' },
  maximizeDot: { backgroundColor: '#27C93F' },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 60,
  },
  iconWrapper: { marginRight: 6 },
  titleText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1 },
});

export default Window;
