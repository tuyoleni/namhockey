import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Tables } from 'types/database.types';
// Assuming expo-av is installed for video playback
// import { Video, ResizeMode } from 'expo-av';
// Placeholder for Video component if not using expo-av
const Video = ({ source, style, useNativeControls, resizeMode, isLooping }: any) => (
    <View style={[style, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#555' }}>Video Placeholder</Text>
        <Text style={{ fontSize: 10, color: '#555', marginTop: 5, textAlign: 'center', paddingHorizontal: 10 }}>{source.uri}</Text>
    </View>
);
const ResizeMode = { CONTAIN: 'contain', COVER: 'cover' }; // Placeholder


// Define a type for a media post with potential author details
type MediaPostWithAuthor = Tables<'media_posts'> & {
  profiles?: { username: string | null; avatar_url: string | null } | null;
};

interface MediaPostItemProps {
  post: MediaPostWithAuthor;
}

const MediaPostItem: React.FC<MediaPostItemProps> = ({ post }) => {
  return (
    <View className="bg-white p-4 mx-4 my-2 rounded-lg">
       {post.profiles && (
        <View className="flex-row items-center mb-3">
          {post.profiles.avatar_url && (
            <Image source={{ uri: post.profiles.avatar_url }} className="w-8 h-8 rounded-full mr-3" />
          )}
          <Text className="text-sm font-bold text-gray-900">{post.profiles.username || 'Unknown User'}</Text>
        </View>
      )}

      {post.type === 'image' && post.url && (
        <Image source={{ uri: post.url }} className="w-full h-64 rounded-lg mb-3" resizeMode="cover" />
      )}
      {post.type === 'video' && post.url && (
         <Video
           source={{ uri: post.url }}
           className="w-full h-64 rounded-lg mb-3"
           useNativeControls
           resizeMode={ResizeMode.CONTAIN}
           isLooping
         />
      )}

      {post.caption && (
        <Text className="text-sm text-gray-800 mb-3">{post.caption}</Text>
      )}

       <Text className="text-xs text-gray-500">{post.created_at ? new Date(post.created_at).toLocaleString() : 'N/A'}</Text>

       {/* Interaction elements (likes, comments) would go here */}
       {/* You would integrate with useInteractionStore similar to NewsPostItem */}

    </View>
  );
};

export default MediaPostItem;
