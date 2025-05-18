// components/CommentInput.tsx
import React from "react";
import { View, TextInput, TouchableOpacity, SafeAreaView, Text } from "react-native";
import { Send} from "lucide-react-native";

interface CommentInputProps {
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  handleAddComment: () => void;
  isSubmittingComment: boolean;
  setShowCommentInput: (show: boolean) => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  newCommentText,
  setNewCommentText,
  handleAddComment,
  isSubmittingComment,
  setShowCommentInput,
}) => {
  return (
    <SafeAreaView className="bg-white border-t border-[#f2f2f7]">
      <View className="px-4 py-3">
        <View className="flex-row items-center mb-2">
          <Text className="text-[15px] font-medium text-[#1d1d1f] flex-1">Add Comment</Text>
        </View>

        <View className="flex-row items-end">
          <TextInput
            className="flex-1 bg-[#f5f5f7] rounded-2xl px-4 py-3 text-[#1d1d1f] text-[15px] min-h-[80px] max-h-[120px]"
            placeholder="Share your thoughts..."
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline
            maxLength={500}
            autoFocus
            placeholderTextColor="#86868b"
            style={{ textAlignVertical: "top" }}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={isSubmittingComment || !newCommentText.trim()}
            className={`ml-3 p-3 rounded-full ${
              isSubmittingComment || !newCommentText.trim() ? "bg-[#e5e5ea]" : "bg-[#007aff]"
            }`}
            activeOpacity={0.8}
          >
            <Send size={18} color={isSubmittingComment || !newCommentText.trim() ? "#86868b" : "white"} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CommentInput;