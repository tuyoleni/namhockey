import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Tables } from 'types/database.types';
import { useInteractionStore } from 'store/interactionStore';
import { useUserStore } from 'store/userStore';
import { Heart, ChevronRight } from 'lucide-react-native';
import ArticleMetaInfo from '@components/article/ArticleMetaInfo';

type NewsArticleWithAuthor = Tables<'news_articles'> & {
  profiles?: Tables<'profiles'> | null;
};

interface NewsPostItemProps {
  post: NewsArticleWithAuthor;
}

const MAX_CONTENT_LENGTH = 120;

const NewsPostItem: React.FC<NewsPostItemProps> = ({ post }) => {
  const router = useRouter();
  const { authUser } = useUserStore();
  const {
    likes,
    fetchLikesForPost,
    isPostLikedByUser,
    loadingLikes,
  } = useInteractionStore();

  const postLikes = likes.filter(like => like.post_id === post.id);
  const userLiked = authUser ? isPostLikedByUser(post.id, authUser.id) : false;
  const truncatedContent = post.content && post.content.length > MAX_CONTENT_LENGTH
    ? `${post.content.substring(0, MAX_CONTENT_LENGTH)}...`
    : post.content;

  useEffect(() => {
    fetchLikesForPost(post.id);
  }, [post.id, fetchLikesForPost]);

  const navigateToDetail = () => {
    router.push({
      pathname: '/news/[id]',
      params: { id: post.id }
    });
  };

  return (
    <TouchableOpacity
      onPress={navigateToDetail}
      activeOpacity={0.9}
      className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {post.cover_image_url && (
        <Image
          source={{ uri: post.cover_image_url }}
          className="w-full h-48"
          style={{ resizeMode: 'cover' }}
        />
      )}

      <View className="p-4">
        {post.profiles && (
          <ArticleMetaInfo
            profile={post.profiles}
            authorProfileId={post.author_profile_id}
            publishedAt={post.published_at}
          />
        )}

        <Text className="text-lg font-bold text-gray-900 mb-2">
          {post.title}
        </Text>

        <Text className="text-base text-gray-700 mb-3 leading-5">
          {truncatedContent}
        </Text>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Heart
              size={16}
              color={userLiked ? '#FF3B30' : '#9CA3AF'}
              fill={userLiked ? '#FF3B30' : 'none'}
            />
            <Text className="text-sm text-gray-500 ml-1">
              {postLikes.length}
            </Text>

            {loadingLikes && (
              <ActivityIndicator />
            )}
          </View>

          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-[#007AFF] mr-1">
              Read more
            </Text>
            <ChevronRight size={16} color="#007AFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NewsPostItem;
