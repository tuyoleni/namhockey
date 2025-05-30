import React from 'react';
import { View, Text, Image } from 'react-native';
import type { MediaPostWithAuthor } from 'store/mediaStore'; // Import the exported type

interface MediaPostItemProps {
  post: MediaPostWithAuthor; 
}

const MediaPostItem: React.FC<MediaPostItemProps> = ({ post }) => {
  const authorProfile = post.profiles;
  const authorName = authorProfile?.display_name || ''; 
  const profilePictureUrl = authorProfile?.profile_picture;

  return (
    <View className="bg-white p-4 rounded-lg mb-4 border border-gray-100">
      {authorProfile && (
        <View className="flex-row items-center mb-3">
          {profilePictureUrl ? (
            <Image 
              source={{ uri: profilePictureUrl }} 
              className="w-10 h-10 rounded-full mr-3 bg-gray-200" 
            />
          ) : (
            <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 items-center justify-center">
              <Text className="text-white font-bold text-sm">
                {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          {authorName ? (
            <Text className="font-semibold text-gray-800 text-base">{authorName}</Text>
          ) : (
            <Text className="font-semibold text-gray-500 text-base italic">User</Text> 
          )}
        </View>
      )}

      {post.caption && (
        <Text className="text-gray-700 mb-3 text-base leading-relaxed">{post.caption}</Text>
      )}

      {post.type === 'image' && post.url && (
        <Image 
          source={{ uri: post.url }} 
          className="w-full aspect-[16/9] rounded-md bg-gray-200 mb-2" 
          resizeMode="cover" 
        />
      )}
      {post.type === 'video' && post.url && (
         <View className="w-full aspect-[16/9] rounded-md bg-black items-center justify-center mb-2">
            <Text className="text-white">Video placeholder</Text>
         </View>
      )}
      
      <Text className="text-xs text-gray-500 mt-2">
        {new Date(post.created_at).toLocaleDateString()}
      </Text>
    </View>
  );
};

export default MediaPostItem;