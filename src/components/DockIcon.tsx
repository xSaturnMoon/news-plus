import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const DOCK_SPRING = {
  damping: 18,
  stiffness: 260,
  mass: 0.8,
};

interface DockIconProps {
  id: string;
  color: string;
  icon: React.ElementType;
  baseSize: number;
  maxScale?: number;
  dockSize: number;
  isLight?: boolean;
  hasIndicator?: boolean;
  onPress: () => void;
}

export const DockIcon: React.FC<DockIconProps> = ({
  id,
  color,
  icon: Icon,
  baseSize,
  maxScale = 1.4,
  dockSize,
  isLight,
  hasIndicator,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);

  const handleEnter = () => {
    scale.value = withSpring(maxScale, DOCK_SPRING);
    lift.value = withSpring(-(baseSize * (maxScale - 1)) * 0.5, DOCK_SPRING);
  };

  const handleLeave = () => {
    scale.value = withSpring(1, DOCK_SPRING);
    lift.value = withSpring(0, DOCK_SPRING);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value } as { scale: number },
      { translateY: lift.value } as { translateY: number },
    ],
  }));

  const bgColor =
    id === 'filemanager' || id === 'trash' || id === 'appdrawer' ? '#F2F2F7' : color;
  const iconColor =
    id === 'filemanager' ? '#007AFF'
    : id === 'trash' ? '#8E8E93'
    : id === 'appdrawer' ? '#1C1C1E'
    : '#FFFFFF';
  const iconSize = baseSize * 0.58;
  const radius = baseSize * 0.24;

  return (
    <Animated.View
      style={[styles.wrapper, animStyle]}
      // W3C Pointer Events — works on iOS 13.4+ with mouse, Android, Web
      // Supported in React Native 0.71+ without New Architecture
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.iconBox,
          {
            width: baseSize,
            height: baseSize,
            borderRadius: radius,
            backgroundColor: bgColor,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Icon size={iconSize} color={iconColor} strokeWidth={2.0} />
      </Pressable>

      {hasIndicator && (
        <View
          style={{
            position: 'absolute',
            bottom: -(8 * dockSize),
            width: 4 * dockSize,
            height: 4 * dockSize,
            borderRadius: 2 * dockSize,
            backgroundColor: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
          }}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
