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
  
    // Get current user data using userStore logic
    const { data: { user } } = await supabase.auth.getUser();
    const fetchProfile = useUserStore.getState().fetchProfile;
    await fetchProfile(); // This will fetch both auth user and profile data
    
    const profile = useUserStore.getState().profile; // Get the latest profile data
  
    // Build the user object for the comment
    const commentUser = profile
      ? {
          id: profile.id,
          bio: profile.username || null,
          profile_picture: profile.avatar_url || null
        }
      : null;
  
    // Optimistically update the UI
    const newComment: Comment = {
      id: Date.now().toString(),
      author: commentUser ? commentUser.id : 'You',
      text: text,
      timestamp: new Date().toISOString(),
      avatar: commentUser?.profile_picture || undefined
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