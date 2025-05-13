import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileType } from 'types/profile.types';
interface ProfileInfoProps {
  profile: ProfileType | null | undefined;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  const router = useRouter();

  return (
    <View className="px-6 items-center">
      <Text className="text-2xl font-bold text-center text-[#1D1D1F]">
        {profile?.full_name || 'Name not set'}
      </Text>
      <Text className="text-[#8E8E93] text-center mt-1 text-base">
        @{profile?.username || 'username'}
      </Text>

      <Text className="text-[#3A3A3C] text-center mt-3 text-base">
        {profile?.bio || 'No bio yet'}
      </Text>

      <View className="flex-row justify-around w-full mt-6 bg-[#F2F2F7] rounded-xl p-4">
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

      <TouchableOpacity
        onPress={() => router.push('/profile/edit')}
        className="mt-6 py-3 px-6 bg-[#007AFF] rounded-full w-full"
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
      >
        <Text className="text-center font-semibold text-white">Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileInfo;