import React from 'react';
import { View, Text, Image } from 'react-native';
import { Profile } from 'store/userStore';

interface ProfileInfoProps {
  profile: Profile | null | undefined;
  profileImageSize?: number;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile, profileImageSize = 90 }) => {
  return (
    <View className="px-6 items-center">
      <View 
        className="-mt-12 mb-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Image
          source={
            profile?.profile_picture
              ? { uri: profile.profile_picture }
              : require('../../assets/default-avatar.png')
          }
          style={{
            width: profileImageSize,
            height: profileImageSize,
            borderRadius: profileImageSize / 2,
            borderWidth: 3,
            borderColor: 'white',
          }}
          accessibilityLabel="Profile avatar"
          resizeMode="cover"
        />
      </View>

      {/* Centered User Details */}
      <View className="items-center mb-2">
        <Text 
          className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight text-center"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {profile?.full_name || profile?.full_name || 'Name not set'}
        </Text>
        
        <Text 
          className="text-[#007AFF] text-[15px] mt-0.5 font-medium tracking-tight text-center"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          @{profile?.username || 'username'}
        </Text>
      </View>

      {/* Centered Bio */}
      <Text className="text-[#3A3A3C] text-center mt-3 text-base mb-6">
        {profile?.bio || 'No bio yet'}
      </Text>

      {/* Stats Section - Already centered */}
      <View className="flex-row justify-around w-full bg-[#F2F2F7] rounded-xl p-4">
        <View className="items-center">
          <Text className="text-xl font-bold text-[#1D1D1F]">{profile?.posts_count || 0}</Text>
          <Text className="text-[#8E8E93]">Posts</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-[#1D1D1F]">{profile?.followers_count || 0}</Text>
          <Text className="text-[#8E8E93]">Followers</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-[#1D1D1F]">{profile?.following_count || 0}</Text>
          <Text className="text-[#8E8E93]">Following</Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileInfo;