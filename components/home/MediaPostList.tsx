import React from 'react';
import { View, Text, Image } from 'react-native';
import type { Tables } from 'types/database.types';

type PostAuthorProfile = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'profile_picture'> | null;

interface MediaPostFromStore extends Tables<'media_posts'> {
  profiles: PostAuthorProfile;
}

interface MediaPostItemProps {
  post: MediaPostFromStore; 
}

const MediaPostItem: React.FC<MediaPostItemProps> = ({ post }) => {
  const authorProfile = post.profiles;
  const authorName = authorProfile?.display_name || ''; 
  const profilePictureUrl = authorProfile?.profile_picture;

  return (
    <View className="bg-white rounded-lg mb-4 border border-gray-100 overflow-hidden">
      {post.type === 'image' && post.url && (
        <Image 
          source={{ uri: post.url }} 
          className="w-full aspect-[16/9] bg-gray-200" 
          resizeMode="cover" 
        />
      )}
      {post.type === 'video' && post.url && (
         <View className="w-full aspect-[16/9] bg-black items-center justify-center">
            <Text className="text-white">Video placeholder</Text>
         </View>
      )}
      
      <View className="p-4">
        {authorProfile && (
          <View className="flex-row items-center mb-2">
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
        
        <Text className="text-xs text-gray-500">
          {new Date(post.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

export default MediaPostItem;