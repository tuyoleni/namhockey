import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useSocialStore } from '../store/socialStore';

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
    
    // Optimistically update the UI
    const newComment: Comment = {
      id: Date.now().toString(), // This will be replaced by the actual ID from Supabase
      author: 'You', // This will be replaced by the actual user data
      text: text,
      timestamp: new Date().toISOString(),
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