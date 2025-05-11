import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable } from 'react-native';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Container } from '@components/Container';
import { useComments } from 'context/CommentContext';
import { useSocialStore } from 'store/socialStore';

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

interface SupabaseComment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  user: {
    name: string;
    avatar_url?: string;
  };
}

type NewsCardProps = {
  id: string;
  title: string;
  published_at: string;
  content: string;
  cover_image_url?: string | null;
  onPress: () => void;
  likes?: number;
  comments?: Comment[];
};

export const NewsCard = ({
  id,
  title,
  published_at,
  content,
  cover_image_url,
  onPress,
  likes = 0,
  comments = [],
}: NewsCardProps) => {
  const { toggleLike, getLikes, getComments } = useSocialStore();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const { openCommentSheet } = useComments();
  
  const transformComments = (comments: SupabaseComment[]): Comment[] => {
    return comments.map(comment => ({
      id: comment.id,
      author: comment.user?.name || 'Anonymous',  // Changed from username/full_name to name
      text: comment.text,
      timestamp: comment.created_at,
      avatar: comment.user?.avatar_url
    }));
  };
  
  useEffect(() => {
    const loadSocialData = async () => {
      const count = await getLikes(id);
      setLikeCount(count);
      
      const fetchedComments = await getComments(id);
      const transformedComments = transformComments(fetchedComments as unknown as SupabaseComment[]);
      setLocalComments(transformedComments);
    };
    loadSocialData();
  }, [id]);

  const handleLike = async () => {
    await toggleLike(id);
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleCommentPress = async () => {
    const fetchedComments = await getComments(id);
    const transformedComments = transformComments(fetchedComments as unknown as SupabaseComment[]);
    openCommentSheet(id, transformedComments);
  };

  const shortText = content.length > 180 ? content.slice(0, 180) + '…' : content;

  const formattedDate = new Date(published_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Container>
      <View className="mb-6 bg-white rounded-xl overflow-hidden shadow-sm">
        {cover_image_url && (
          <Image
            source={{ uri: cover_image_url }}
            className="w-full h-64 rounded-t-xl"
            resizeMode="cover"
          />
        )}

        <View className=" py-5">
          <Text className="text-lg font-semibold text-[#1D1D1F] mb-1 tracking-tight">
            {title}
          </Text>

          <Text className="text-xs text-[#86868B] mb-3 font-medium">
            {formattedDate}
          </Text>

          <Text className="text-[15px] text-[#424245] leading-5 mb-4 font-normal">
            {shortText}
          </Text>

          <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-[#F5F5F7]">
            <View className="flex-row gap-5 items-center">
              <Pressable
                onPress={handleLike}
                className="flex-row items-center gap-1.5"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={18}
                  color={liked ? '#FF2D55' : '#86868B'}
                  fill={liked ? '#FF2D55' : 'transparent'}
                />
                <Text className="text-sm text-[#86868B] font-medium">
                  {likeCount}
                </Text>
              </Pressable>

              <Pressable 
                onPress={handleCommentPress}
                className="flex-row items-center gap-1.5"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MessageCircle size={18} color="#86868B" />
                <Text className="text-sm text-[#86868B] font-medium">
                  {localComments.length}
                </Text>
              </Pressable>
            </View>

            <TouchableOpacity
              onPress={onPress}
              className="px-3.5 py-1.5 bg-[#F5F5F7] rounded-full"
            >
              <Text className="text-[#007AFF] text-sm font-semibold">
                Read More
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Container>
  );
};