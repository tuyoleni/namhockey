import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface InfoMessageProps {
  message: string;
  type?: 'loading' | 'error' | 'no-data';
  details?: string;
}

export const InfoMessage: React.FC<InfoMessageProps> = ({
  message,
  type = 'no-data',
  details,
}) => {
  let textClasses = '';
  let containerClasses = 'flex-1 justify-center items-center p-5';

  switch (type) {
    case 'loading':
      textClasses = 'mt-2.5 text-base text-gray-600';
      break;
    case 'error':
      textClasses = 'mt-2.5 text-base text-red-600 text-center';
      containerClasses = 'flex-1 justify-center items-center p-5 bg-gray-100';
      break;
    case 'no-data':
    default:
      textClasses = 'mt-2.5 text-base text-gray-700 text-center';
      break;
  }

  return (
    <View className={containerClasses}>
      {type === 'loading' && <ActivityIndicator />}
      {type === 'error' && <Text className="mt-2.5 text-lg font-bold text-red-600 text-center mb-2">Error loading data:</Text>}
      <Text className={textClasses}>{details && typeof details === 'string' ? details : message}</Text>
    </View>
  );
};