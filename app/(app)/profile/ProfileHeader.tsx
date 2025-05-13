import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleProp, ViewStyle } from 'react-native'; // Import StyleProp, ViewStyle
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ProfileHeaderProps {
  scrollY: Animated.Value;
  profileUsername: string | null | undefined;
  onLogout: () => Promise<void> | void;
  headerMaxHeight: number;
  headerMinHeight: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  scrollY,
  profileUsername,
  onLogout,
  headerMaxHeight,
  headerMinHeight,
}) => {

  // Explicitly type the interpolated values
  const headerHeight: Animated.AnimatedInterpolation<number> = scrollY.interpolate({
    inputRange: [0, headerMaxHeight - headerMinHeight],
    outputRange: [headerMaxHeight, headerMinHeight],
    extrapolate: 'clamp'
  });

  // zIndex can sometimes be tricky with Animated.
  // Keeping the original logic but be aware it might be a source of native issues.
  const headerZIndex: Animated.AnimatedInterpolation<number | string> = scrollY.interpolate({
    inputRange: [0, headerMaxHeight - headerMinHeight, headerMaxHeight],
    outputRange: [0, 0, 1], // Outputting numbers
    extrapolate: 'clamp'
    // If you needed to output strings like 'auto', the type would be different
  });

  const headerTitleOpacity: Animated.AnimatedInterpolation<number> = scrollY.interpolate({
    inputRange: [0, headerMaxHeight - headerMinHeight - 20, headerMaxHeight - headerMinHeight],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp'
  });

  // Define the style object with the Animated values
  const animatedHeaderStyle: StyleProp<ViewStyle> = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: headerHeight,
    width: '100%',
    zIndex: headerZIndex, // Animated ZIndex
    elevation: headerZIndex as Animated.AnimatedInterpolation<number>, // Cast for elevation (expects number)
    backgroundColor: '#007AFF' // Fallback color
  };

  return (
    <Animated.View
      style={animatedHeaderStyle}
    >
      <BlurView
        intensity={80}
        tint="dark" // 'dark', 'light', or 'default'
        className="absolute inset-0"
      />

      <SafeAreaView style={{ flex: 1 }}> {/* Use inline style for flex */}
        <Animated.View
          style={{ opacity: headerTitleOpacity }}
          className="flex-row justify-between items-center px-4 h-[44px]" // Standard header height
        >
          <Text className="text-lg font-semibold text-white">
            {profileUsername || 'Profile'}
          </Text>
          <TouchableOpacity onPress={onLogout} accessibilityLabel="Sign out"> {/* Added accessibility label */}
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

export default ProfileHeader;