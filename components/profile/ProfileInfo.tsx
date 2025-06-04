import React from 'react';
import { View, Text, Image } from 'react-native';
import { Profile } from 'store/userStore'; // Assuming this path is correct and Profile type is updated
import { StarIcon, ShieldCheckIcon, UserCircleIcon, HashIcon } from 'lucide-react-native'; // Example icons

interface ProfileInfoProps {
  profile: Profile | null | undefined;
  profileImageSize?: number;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile, profileImageSize = 90 }) => {
  const displayName = profile?.full_name || profile?.authUserMetadataFullName || profile?.display_name || 'Name not set';
  const usernameHandle = profile?.authUserUsername || profile?.display_name || 'username';

  const hasHockeyDetails =
    profile?.favorite_nhl_team ||
    profile?.playing_position ||
    profile?.skill_level ||
    profile?.jersey_number;

  return (
    <View className="px-4 items-center w-full">
      {/* Profile Image */}
      <View
        className="-mt-12 mb-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2, // for Android shadow
        }}
      >
        <Image
          source={
            profile?.profile_picture
              ? { uri: profile.profile_picture }
              : require('assets/default-avatar.png')
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

      {/* User Name and Username */}
      <View className="items-center mb-2 px-4">
        <Text
          className="text-[22px] font-semibold text-gray-800 tracking-tight text-center"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>

        <Text
          className="text-sky-600 text-[15px] mt-0.5 font-medium tracking-tight text-center"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          @{usernameHandle}
        </Text>
      </View>

      {/* Bio */}
      <Text className="text-gray-600 text-center mt-3 text-base mb-6 px-4">
        {profile?.bio || 'No bio yet. Tap edit to add one!'}
      </Text>

      {/* Stats Section */}
      <View className="flex-row justify-around w-full bg-gray-100 rounded-xl p-4 mb-6">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-800">{profile?.posts_count || 0}</Text>
          <Text className="text-gray-500">Posts</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-800">{profile?.followers_count || 0}</Text>
          <Text className="text-gray-500">Followers</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-800">{profile?.following_count || 0}</Text>
          <Text className="text-gray-500">Following</Text>
        </View>
      </View>

      {/* Hockey Details Section */}
      {hasHockeyDetails && (
        <View className="w-full bg-gray-100 rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3 text-center">Hockey Info</Text>
          <View className="space-y-2">
            {profile?.favorite_nhl_team && (
              <View className="flex-row items-center">
                <StarIcon size={18} color="#4B5563" className="mr-2" />
                <Text className="text-base text-gray-700">
                  Favorite Team: {profile.favorite_nhl_team}
                </Text>
              </View>
            )}
            {profile?.playing_position && (
              <View className="flex-row items-center">
                <ShieldCheckIcon size={18} color="#4B5563" className="mr-2" />
                <Text className="text-base text-gray-700">
                  Position: {profile.playing_position}
                </Text>
              </View>
            )}
            {profile?.skill_level && (
              <View className="flex-row items-center">
                <UserCircleIcon size={18} color="#4B5563" className="mr-2" />
                <Text className="text-base text-gray-700">
                  Skill Level: {profile.skill_level}
                </Text>
              </View>
            )}
            {profile?.jersey_number !== null && profile?.jersey_number !== undefined && (
              <View className="flex-row items-center">
                <HashIcon size={18} color="#4B5563" className="mr-2" />
                <Text className="text-base text-gray-700">
                  Jersey #: {profile.jersey_number}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default ProfileInfo;
