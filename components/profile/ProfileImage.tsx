import React from 'react';
import { View, Image, Dimensions, StyleProp, ViewStyle, ImageStyle } from 'react-native';

const { width } = Dimensions.get('window');

interface ProfileImageProps {
  avatarUrl: string | null | undefined;
  profileImageSize: number;
  profileImageMarginTop: number;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  avatarUrl,
  profileImageSize,
  profileImageMarginTop,
}) => {
  // Twitter-like container style
  const containerStyle: StyleProp<ViewStyle> = {
    position: 'absolute',
    top: 0,
    left: width / 2 - profileImageSize / 2,
    width: profileImageSize,
    height: profileImageSize,
    marginTop: profileImageMarginTop,
    zIndex: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  };

  // Twitter-like image style
  const imageStyle: StyleProp<ImageStyle> = {
    width: '100%',
    height: '100%',
    borderRadius: profileImageSize / 2,
    borderWidth: 4, // Thicker border like Twitter
    borderColor: 'white',
    // Twitter-like image styling
    backgroundColor: '#f0f0f0', // Fallback color
  };

  return (
    <View style={containerStyle}>
      <Image
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require('../../assets/default-avatar.png')
        }
        style={imageStyle}
        accessibilityLabel="Profile avatar"
        resizeMode="cover" // Ensure proper image scaling
      />
    </View>
  );
};

export default ProfileImage;