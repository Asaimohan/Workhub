import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DetailsPage() {
  return (
    <View style={styles.container}>
      <Text>Details Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
