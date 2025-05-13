import React from 'react';
import { View, Image, Animated, Dimensions, StyleProp, ViewStyle, ImageStyle } from 'react-native'; // Import style types

const { width } = Dimensions.get('window');

interface ProfileImageProps {
  scrollY: Animated.Value;
  avatarUrl: string | null | undefined;
  headerMaxHeight: number;
  headerMinHeight: number;
  profileImageMaxSize: number;
  profileImageMinSize: number;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  scrollY,
  avatarUrl,
  headerMaxHeight,
  headerMinHeight,
  profileImageMaxSize,
  profileImageMinSize,
}) => {

  const profileImageSize: Animated.AnimatedInterpolation<number> = scrollY.interpolate({
    inputRange: [0, headerMaxHeight - headerMinHeight],
    outputRange: [profileImageMaxSize, profileImageMinSize],
    extrapolate: 'clamp'
  });

  const profileImageMarginTop: Animated.AnimatedInterpolation<number> = scrollY.interpolate({
    inputRange: [0, headerMaxHeight - headerMinHeight],
    outputRange: [
      Math.round(headerMaxHeight - profileImageMaxSize / 2),
      Math.round(headerMinHeight - profileImageMinSize / 2)
    ],
    extrapolate: 'clamp'
  });

  // This fixed translateX seems intended to keep the image centered horizontally
  // as its size changes. It's a bit unusual but we'll keep it if it's necessary
  // for the desired effect. Review this if layout issues occur.
  const imageTranslateX = (profileImageMaxSize - profileImageMinSize) / 2;

  const animatedContainerStyle: StyleProp<ViewStyle> = {
    position: 'absolute',
    top: 0,
    left: width / 2 - profileImageMaxSize / 2, // Center based on MAX size
    width: profileImageSize,
    height: profileImageSize,
    marginTop: profileImageMarginTop,
    zIndex: 2, // Ensure image is above header
    elevation: 2, // Elevation for Android
    transform: [{ translateX: imageTranslateX }] // Apply the fixed horizontal adjustment
  };

  // Define the style object for the Image
  const imageStyle: StyleProp<ImageStyle> = {
    width: '100%',
    height: '100%',
    borderRadius: profileImageMaxSize / 2, // Use max size for consistent roundness calculation
    borderWidth: 3,
    borderColor: 'white',
  };


  return (
    <Animated.View
      style={animatedContainerStyle}
    >
      <Image
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require('../../../assets/default-avatar.png') // Adjust path relative to THIS file
        }
        style={imageStyle}
        accessibilityLabel="Profile avatar" // Added accessibility label
      />
    </Animated.View>
  );
};

export default ProfileImage;