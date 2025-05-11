import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useSocialStore } from '../store/socialStore';
import { supabase } from '@utils/superbase';
import { useUserStore } from '../store/userStore';
import { User } from '@supabase/supabase-js';

type Comment = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  avatar?: string;
};

type CommentContextType = {
  isCommentSheetVisible: boolean;
  activePostId: string | null;
  activePostComments: Comment[];
  openCommentSheet: (postId: string, comments: Comment[]) => void;
  closeCommentSheet: () => void;
  addComment: (text: string) => Promise<void>;
};

export const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider = ({ children }: { children: ReactNode }) => {
  const { addComment: addCommentToStore } = useSocialStore();
  const [isCommentSheetVisible, setIsCommentSheetVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activePostComments, setActivePostComments] = useState<Comment[]>([]);

  const openCommentSheet = (postId: string, comments: Comment[]) => {
    setActivePostId(postId);
    setActivePostComments(comments);
    setIsCommentSheetVisible(true);
  };

  const closeCommentSheet = () => {
    setIsCommentSheetVisible(false);
    setActivePostId(null);
    setActivePostComments([]);
  };

  const addComment = async (text: string) => {
    if (!activePostId) return;
    
    await addCommentToStore(activePostId, text);
    
    // Get current user data
    const { data: user } = await supabase.auth.getUser();
    const fetchUser = useUserStore.getState().fetchUser;
    const userData = user?.user?.id ? await fetchUser(user.user.id) : null;
    
    // Safely extract display name and avatar
    const displayName = (userData && 'user' in userData) 
      ? userData.user.user_metadata?.full_name || 'You'
      : 'You';
    
    const avatarUrl = (userData && 'user' in userData)
      ? userData.user.user_metadata?.avatar_url
      : undefined;

    // Optimistically update the UI
    const newComment: Comment = {
      id: Date.now().toString(),
      author: displayName,
      text: text,
      timestamp: new Date().toISOString(),
      avatar: avatarUrl
    };
    
    setActivePostComments((prevComments) => [...prevComments, newComment]);
  };

  return (
    <CommentContext.Provider
      value={{
        isCommentSheetVisible,
        activePostId,
        activePostComments,
        openCommentSheet,
        closeCommentSheet,
        addComment,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentProvider');
  }
  return context;
};