import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TeamsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teams Screen</Text>
      {/* Team listings will go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
});