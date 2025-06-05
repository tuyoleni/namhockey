import {
  View,
  Text,
  ScrollView as RNScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNewsStore } from "store/newsStore";
import { useInteractionStore } from "store/interactionStore";
import { useUserStore } from "store/userStore";
import type { Tables } from "database.types";
import { useCallback, useEffect, useRef, useState } from "react";
import ArticleHeader from "@components/article/ArticleHeader";
import ArticleInteractionBar from "@components/article/ArticleInteractionBar";
import CommentInput from "@components/article/CommentInput";
import CommentSection from "@components/article/CommentSection";
import ArticleMetaInfo from "@components/article/ArticleMetaInfo";

// --- Types ---
type ProfileRow = Tables<'profiles'>;

type NewsArticleRow = Tables<'news_articles'> & {
  profiles: ProfileRow | null;
};

type CommentItemType = Tables<'comments'> & { profiles?: Tables<'profiles'> | null };

// --- Component ---
export default function NewsDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const scrollRef = useRef<RNScrollView>(null);
  const { newsArticles, fetchArticleById } = useNewsStore();
  const { authUser } = useUserStore();
  const {
    likes,
    comments,
    fetchLikesForPost,
    likePost,
    unlikePost,
    isPostLikedByUser,
    fetchCommentsForPost,
    addCommentToPost,
    loadingComments,
  } = useInteractionStore();

  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [article, setArticle] = useState<NewsArticleRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchArticle = async () => {
      if (id) {
        setLoadingArticle(true);
        setError(null);
        try {
          const fetchedArticle = await fetchArticleById(id);
          setArticle(fetchedArticle as NewsArticleRow | null);
        } catch (err: any) {
          setError(err.message || "Failed to load article");
        } finally {
          setLoadingArticle(false);
        }
      } else {
        setError("Article ID is missing.");
        setLoadingArticle(false);
        setArticle(null);
      }
    };

    if (id) {
        const preFetchedArticle = newsArticles.find((a) => a.id === id);
        if (preFetchedArticle) {
          setArticle(preFetchedArticle as NewsArticleRow);
          setLoadingArticle(false);
        } else {
          fetchArticle();
        }
    } else {
        setError("Article ID is missing.");
        setLoadingArticle(false);
        setArticle(null);
    }
  }, [id, fetchArticleById, newsArticles]);

  const articleLikes = id ? likes.filter((like) => like.post_id === id) : [];
  const articleComments = id ? comments.filter((comment) => comment.post_id === id) : [];
  const userLiked = authUser && id ? isPostLikedByUser(id, authUser.id) : false;

  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }, []);

  useEffect(() => {
    if (id) {
      fetchLikesForPost(id);
      fetchCommentsForPost(id);
    }
  }, [id, fetchLikesForPost, fetchCommentsForPost]);

  const handleLikePress = async () => {
    if (!authUser || !id) return;
    if (userLiked) {
      await unlikePost(id, authUser.id);
    } else {
      await likePost(id, authUser.id);
    }
  };

  const handleAddComment = async () => {
    if (!authUser || !newCommentText.trim() || !id) return;
    setIsSubmittingComment(true);
    try {
      const commentData = {
        post_id: id,
        user_id: authUser.id,
        content: newCommentText.trim(),
      };
      const added = await addCommentToPost(commentData);
      if (added) {
        setNewCommentText("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (showCommentInput && !showComments) {
      setShowCommentInput(false);
    }
  };

  const toggleCommentInput = () => {
    if (!authUser) return;
    setShowCommentInput(!showCommentInput);
    if (!showComments && !showCommentInput) {
      setShowComments(true);
    }
  };

  const renderCommentItem = useCallback(({ item }: { item: CommentItemType }) => {
    let displayUser = `User ${item.user_id.substring(0, 6)}`;
    let profilePictureUrl = null;

    if (item.profiles?.display_name) {
      displayUser = item.profiles.display_name;
    }
     if (item.profiles?.profile_picture) {
        profilePictureUrl = item.profiles.profile_picture;
    }

    return (
      <View className="bg-[#f5f5f7] rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center gap-2">
             {profilePictureUrl && (
                <Image
                  source={{ uri: profilePictureUrl }}
                  style={{ width: 30, height: 30, borderRadius: 15 }}
                  className="rounded-full"
                />
              )}
            <Text className="text-[15px] font-medium text-[#1d1d1f]">
              {displayUser}
            </Text>
          </View>
          <Text className="text-xs text-[#86868b]">
            {item.created_at ? formatDate(item.created_at) : ""}
          </Text>
        </View>
        <Text className="text-[15px] text-[#424245]">{item.content}</Text>
      </View>
    );
  }, [formatDate]);

  if (loadingArticle) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-[#86868b]">Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-lg text-[#ff3b30] mb-2 font-medium">Error loading article</Text>
          <Text className="text-[#86868b] text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-[#86868b]">Article not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showComments) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="light-content" />
        <ArticleHeader coverImageUrl={article.cover_image_url} scrollY={scrollY} />
        <View className="px-5 pt-4 pb-2">
          <Text className="text-xl font-semibold text-[#1d1d1f] leading-tight mb-2">{article.title}</Text>
          <ArticleInteractionBar
            articleId={id}
            likesCount={articleLikes.length}
            commentsCount={articleComments.length}
            userLiked={userLiked}
            onLikePress={handleLikePress}
            onToggleComments={toggleComments}
            showComments={showComments}
            authUser={authUser}
          />
        </View>

        <CommentSection
          comments={articleComments}
          loadingComments={loadingComments}
          renderCommentItem={renderCommentItem}
          showCommentInput={showCommentInput}
          toggleCommentInput={toggleCommentInput}
          authUser={authUser}
        />

        {authUser && showCommentInput && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
          >
            <CommentInput
              newCommentText={newCommentText}
              setNewCommentText={setNewCommentText}
              handleAddComment={handleAddComment}
              isSubmittingComment={isSubmittingComment}
              setShowCommentInput={setShowCommentInput}
            />
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Animated.ScrollView
          ref={scrollRef}
          className="flex-1"
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <ArticleHeader coverImageUrl={article.cover_image_url} scrollY={scrollY} />
          <View className="px-5 pt-6">
            <Text className="text-2xl font-semibold text-[#1d1d1f] leading-tight mb-3">{article.title}</Text>
            {article.profiles && (
              <ArticleMetaInfo
                profile={article.profiles}
                authorProfileId={article.author_profile_id}
                publishedAt={article.published_at}
              />
            )}
            <ArticleInteractionBar
              articleId={id}
              likesCount={articleLikes.length}
              commentsCount={articleComments.length}
              userLiked={userLiked}
              onLikePress={handleLikePress}
              onToggleComments={toggleComments}
              showComments={showComments}
              authUser={authUser}
            />
            <Text className="text-[17px] text-[#1d1d1f] leading-relaxed mb-8">{article.content}</Text>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

