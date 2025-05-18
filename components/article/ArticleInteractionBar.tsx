// components/article/ArticleInteractionBar.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Heart, MessageCircle, ChevronDown, Share, ChevronUp } from "lucide-react-native";

interface ArticleInteractionBarProps {
  articleId: string | undefined;
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
  onLikePress: () => void;
  onToggleComments: () => void;
  showComments: boolean;
  authUser: any; // Consider a more specific type
}

const ArticleInteractionBar: React.FC<ArticleInteractionBarProps> = ({
  articleId,
  likesCount,
  commentsCount,
  userLiked,
  onLikePress,
  onToggleComments,
  showComments,
  authUser,
}) => {
  return (
    <View className="flex-row items-center justify-between py-4 mb-5 border-y border-[#f2f2f7]">
      <View className="flex-row items-center space-x-8">
        <TouchableOpacity
          onPress={onLikePress}
          disabled={!authUser}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Heart size={20} color={userLiked ? "#ff3b30" : "#86868b"} fill={userLiked ? "#ff3b30" : "none"} />
          <Text className={`text-[15px] ml-2 ${userLiked ? "text-[#ff3b30]" : "text-[#86868b]"}`}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onToggleComments} className="flex-row items-center" activeOpacity={0.7}>
          <MessageCircle size={20} color="#86868b" />
          <Text className="text-[15px] text-[#86868b] ml-2">{commentsCount}</Text>
          {showComments ? <ChevronUp size={16} color="#86868b" className="ml-1" /> : <ChevronDown size={16} color="#86868b" className="ml-1" />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="w-9 h-9 items-center justify-center rounded-full bg-[#f2f2f7]"
        activeOpacity={0.7}
      >
        <Share size={18} color="#86868b" />
      </TouchableOpacity>
    </View>
  );
};

export default ArticleInteractionBar;