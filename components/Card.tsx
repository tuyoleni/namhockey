import React from 'react';
import { View, StyleSheet, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface CardProps extends TouchableOpacityProps { // Or ViewProps if not touchable
  children: React.ReactNode;
}

export const Card = ({ children, style, ...props }: CardProps) => {
  return (
    <TouchableOpacity style={[styles.card, style]} {...props}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});

export default Card;