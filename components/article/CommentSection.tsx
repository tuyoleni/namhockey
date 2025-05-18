import React, { ReactElement } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ListRenderItem } from "react-native";
import { X } from "lucide-react-native";

interface CommentSectionProps {
  comments: any[]; // Consider a more specific type for comments
  loadingComments: boolean;
  renderCommentItem: ListRenderItem<any>; // Explicitly use ListRenderItem
  showCommentInput: boolean;
  toggleCommentInput: () => void;
  authUser: any; // Consider a more specific type
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  loadingComments,
  renderCommentItem,
  showCommentInput,
  toggleCommentInput,
  authUser,
}) => {
  return (
    <View className="flex-1 px-5">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-[#1d1d1f]">Comments</Text>
        {authUser && (
          <TouchableOpacity
            onPress={toggleCommentInput}
            className="bg-[#007aff] rounded-full px-4 py-1.5"
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-medium">
              {showCommentInput ? "Cancel" : "Add Comment"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loadingComments ? (
        <ActivityIndicator color="#007AFF" />
      ) : comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: showCommentInput ? 180 : 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="bg-[#f5f5f7] rounded-2xl p-6 items-center">
          <Text className="text-[15px] text-[#86868b] text-center">
            No comments yet. Be the first to comment!
          </Text>
        </View>
      )}
    </View>
  );
};

export default CommentSection;