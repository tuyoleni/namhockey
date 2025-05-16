// src/components/home/NewsPostItem.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { Tables } from 'types/database.types'; // Adjust import path
import { useInteractionStore } from 'store/interactionStore'; // Adjust import path
import { useUserStore } from 'store/userStore'; // Adjust import path
import { Heart, MessageCircle } from 'lucide-react-native'; // Icons for like and comment

// Define a type for a news article with potential author details
type NewsArticleWithAuthor = Tables<'news_articles'> & {
  profiles?: { username: string | null; avatar_url: string | null } | null;
};


interface NewsPostItemProps {
  post: NewsArticleWithAuthor;
}

const NewsPostItem: React.FC<NewsPostItemProps> = ({ post }) => {
  const { authUser } = useUserStore(); // Get the authenticated user
  const {
    likes,
    comments,
    fetchLikesForPost,
    likePost,
    unlikePost,
    isPostLikedByUser,
    fetchCommentsForPost,
    addCommentToPost, // You'll need a UI for adding comments
    deleteComment, // You'll need a UI for deleting comments
    loadingLikes, 
    loadingComments, 
    error: interactionError, 
  } = useInteractionStore();

  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Filter likes and comments relevant to this specific post
  const postLikes = likes.filter(like => like.post_id === post.id);
  const postComments = comments.filter(comment => comment.post_id === post.id);

  // Check if the current user has liked this post
  const userLiked = authUser ? isPostLikedByUser(post.id, authUser.id) : false;

  // Fetch likes and comments for this post when the component mounts
  useEffect(() => {
    fetchLikesForPost(post.id);
    fetchCommentsForPost(post.id);
    // Note: Subscriptions are handled at a higher level (InteractionStore)
    // or you could initiate a post-specific subscription here if desired:
    // const unsubscribeComments = subscribeToComments(post.id);
    // return () => unsubscribeComments();
  }, [post.id, fetchLikesForPost, fetchCommentsForPost]);


  const handleLikePress = async () => {
    if (!authUser) {
      // Prompt user to log in
      console.log('User not authenticated. Cannot like post.');
      return;
    }

    if (userLiked) {
      // Unlike the post
      await unlikePost(post.id, authUser.id);
    } else {
      // Like the post
      await likePost(post.id, authUser.id);
    }
    // The store's subscription will update the likes list
  };

  // Placeholder for handling comment press (e.g., navigate to a comment screen or open a comment modal)
  const handleCommentPress = () => {
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!authUser || !newCommentText.trim()) {
      // Optionally, show an alert or message to the user
      console.log('User not authenticated or comment is empty.');
      return;
    }
    setIsSubmittingComment(true);
    try {
      const commentData = {
        post_id: post.id,
        user_id: authUser.id,
        content: newCommentText.trim(),
        // created_at will be set by the backend/db
      };
      const added = await addCommentToPost(commentData);
      if (added) {
        setNewCommentText(''); // Clear input after successful submission
        // Comments list will update via subscription
      } else {
        // Handle case where comment wasn't added (e.g., show error)
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // Show error to user
    } finally {
      setIsSubmittingComment(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* Author Info (if available) */}
      {post.profiles && (
        <View style={styles.authorInfo}>
          {post.profiles.avatar_url && (
            <Image source={{ uri: post.profiles.avatar_url }} style={styles.avatar} />
          )}
          <Text style={styles.authorName}>{post.profiles.username || 'Unknown User'}</Text>
        </View>
      )}

      {/* Cover Image (if available) */}
      {post.cover_image_url && (
        <Image source={{ uri: post.cover_image_url }} style={styles.coverImage} />
      )}

      {/* Article Content */}
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.content}>{post.content}</Text>

      {/* Timestamps and Status */}
      <View style={styles.metaInfo}>
        <Text style={styles.timestamp}>Published: {post.published_at ? new Date(post.published_at).toLocaleString() : 'N/A'}</Text>
        <Text style={styles.status}>Status: {post.status}</Text>
        {post.created_at !== post.updated_at && (
           <Text style={styles.timestamp}>Updated: {post.updated_at ? new Date(post.updated_at).toLocaleString() : 'N/A'}</Text>
        )}
      </View>


      {/* Interaction Section (Likes and Comments) */}
      <View style={styles.interactionBar}>
        <TouchableOpacity onPress={handleLikePress} style={styles.interactionButton}>
          <Heart size={20} color={userLiked ? 'red' : '#555'} fill={userLiked ? 'red' : 'none'} />
          <Text style={styles.interactionText}>{postLikes.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCommentPress} style={styles.interactionButton}>
          <MessageCircle size={20} color="#555" />
          <Text style={styles.interactionText}>{postComments.length}</Text>
        </TouchableOpacity>
        {/* Add loading/error indicators for interactions if needed */}
        {(loadingLikes || loadingComments) && <ActivityIndicator size="small" color="#007bff" style={{ marginLeft: 10 }} />}
        {interactionError && <Text style={styles.errorText}>{interactionError}</Text>}
      </View>

       {/* Placeholder for Comments List/Modal */}
       {/* You would typically render a list of comments here or open a modal */}
       {/* <View>
           <Text style={styles.commentsHeading}>Comments:</Text>
           {postComments.map(comment => (
               <View key={comment.id} style={styles.commentItem}>
                   <Text>{comment.content}</Text>
               </View>
           ))}
       </View> */}

      {showComments && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeading}>Comments</Text>
          <FlatList
            data={postComments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Text style={styles.commentUser}>User ID: {item.user_id.substring(0, 8)}...</Text> 
                {/* TODO: Fetch and display username/avatar */}
                <Text style={styles.commentContent}>{item.content}</Text>
                <Text style={styles.commentTimestamp}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet.</Text>}
          />
          {authUser && (
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={newCommentText}
                onChangeText={setNewCommentText}
                multiline
              />
              <TouchableOpacity 
                style={[styles.submitCommentButton, isSubmittingComment && styles.submitCommentButtonDisabled]} 
                onPress={handleAddComment}
                disabled={isSubmittingComment || !newCommentText.trim()}
              >
                <Text style={styles.submitCommentButtonText}>
                  {isSubmittingComment ? 'Posting...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {!authUser && (
            <Text style={styles.loginToCommentText}>Please log in to comment.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  coverImage: {
    width: '100%',
    height: 200, // Adjust height as needed
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover', // or 'contain'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  content: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  metaInfo: {
      marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  status: {
      fontSize: 12,
      color: '#777',
      marginBottom: 2,
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  interactionText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
  },
  errorText: {
      color: 'red',
      fontSize: 12,
      marginLeft: 10,
  },
  commentsSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentsHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  commentItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
  },
  commentTimestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 10,
  },
  addCommentContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10,
    minHeight: 40,
    maxHeight: 100, // Optional: limit height for multiline
  },
  submitCommentButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  submitCommentButtonDisabled: {
    backgroundColor: '#a0cfff',
  },
  submitCommentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginToCommentText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 10,
    fontStyle: 'italic',
  }
});

export default NewsPostItem;
