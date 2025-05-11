import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Keyboard,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ChevronDown, Send } from 'lucide-react-native';
import { Database } from 'types/database.types';

type Tables = Database['public']['Tables']
type DatabaseComment = Tables['comments']['Row'] & {
  user: Tables['profiles']['Row']
}

type CommentSheetProps = {
  comments: DatabaseComment[];
  onClose: () => void;
  onAddComment: (text: string) => void;
  visible: boolean;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const SHEET_MIN_HEIGHT = 0;
const DRAG_THRESHOLD = 50;

export const CommentSheet = ({ 
  comments, 
  onClose, 
  onAddComment,
  visible 
}: CommentSheetProps) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;
  
  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    } else {
      // Slide down
      Animated.spring(translateY, {
        toValue: SHEET_MAX_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11
          }).start();
        }
      }
    })
  ).current;

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    onAddComment(newComment);
    setNewComment('');
    setIsSubmitting(false);
    Keyboard.dismiss();
  };

  const renderComment = ({ item }: { item: DatabaseComment }) => (
    <View className="py-3 border-b border-[#F5F5F7]">
      <View className="flex-row justify-between">
        <Text className="text-[14px] font-semibold text-[#1D1D1F] mb-0.5">
          {/* {item.user?.display_name || 'Anonymous'} */}
        </Text>
        <Text className="text-xs text-[#86868B]">
          {new Date(item.created_at || '').toLocaleDateString()}
        </Text>
      </View>
      <Text className="text-[15px] text-[#424245] leading-5 mt-1">
        {item.content}
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View className="absolute inset-0 bg-black/30 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View 
            style={{ 
              transform: [{ translateY }],
              maxHeight: SHEET_MAX_HEIGHT
            }}
            className="bg-white rounded-t-xl overflow-hidden"
          >
            {/* Drag Handle */}
            <View 
              {...panResponder.panHandlers}
              className="w-full items-center py-2 bg-white"
            >
              <View className="w-10 h-1 rounded-full bg-[#D1D1D6]" />
            </View>
            
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-[#F5F5F7]">
              <Text className="text-[17px] font-semibold text-[#1D1D1F]">
                Comments
              </Text>
              <TouchableOpacity 
                onPress={onClose} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1"
              >
                <ChevronDown size={20} color="#86868B" />
              </TouchableOpacity>
            </View>
            
            {/* Comments List */}
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingTop: 16, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View className="py-10 items-center">
                  <Text className="text-base text-[#86868B] text-center">
                    No comments yet.
                    {'\n'}
                    Be the first to share your thoughts!
                  </Text>
                </View>
              }
            />
            
            {/* Comment Input */}
            <View className="flex-row items-center px-4 py-3 border-t border-[#F5F5F7] bg-[#F5F5F7]">
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor="#86868B"
                multiline
                className="flex-1 text-[15px] text-[#1D1D1F] bg-white rounded-[18px] px-3 py-2 max-h-[80px] mr-2"
                onSubmitEditing={handleSubmitComment}
              />
              <TouchableOpacity 
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className={`w-9 h-9 rounded-full justify-center items-center ${newComment.trim() ? 'bg-[#007AFF]' : 'bg-[#E5E5EA]'}`}
              >
                <Send size={16} color={newComment.trim() ? 'white' : '#8E8E93'} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};