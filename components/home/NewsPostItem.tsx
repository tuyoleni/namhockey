// src/components/home/NewsPostItem.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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
    loadingLikes, // Loading state for likes specific to this post (conceptual)
    loadingComments, // Loading state for comments specific to this post (conceptual)
    error: interactionError, // Error for interaction actions
  } = useInteractionStore();

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
    console.log('Comment button pressed for post:', post.id);
    // Implement navigation or modal to view/add comments
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
   commentsHeading: {
       fontSize: 16,
       fontWeight: 'bold',
       marginTop: 10,
       marginBottom: 5,
   },
   commentItem: {
       backgroundColor: '#f9f9f9',
       padding: 8,
       borderRadius: 5,
       marginBottom: 5,
   }
});

export default NewsPostItem;
