import React from 'react';
import { View, Text } from 'react-native';

export const EventSkeleton = () => (
  <View style={{ 
    height: 100, 
    width: 200, // For horizontal lists, width is important
    backgroundColor: '#e0e0e0', 
    padding: 10, 
    marginVertical: 8, 
    marginHorizontal: 4, // If used in a horizontal list
    borderRadius: 8 
  }}>
    <View style={{ height: 20, backgroundColor: '#c0c0c0', marginBottom: 10 }} />
    <View style={{ height: 15, backgroundColor: '#c0c0c0', marginBottom: 6 }} />
    <View style={{ height: 15, width: '70%', backgroundColor: '#c0c0c0' }} />
  </View>
);
