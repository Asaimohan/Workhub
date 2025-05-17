import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OrderSuccessful() {
  const { orderId, userId } = useLocalSearchParams();

  const handleGoToHome = () => {
    router.push({
      pathname: '/user/Home',
      params: { userId: userId?.toString() }
    });
  };

  const handleViewProfile = () => {
    router.push({
      pathname: '/user/UserDetails',
      params: { userId: userId?.toString() }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.successCard}>
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>
        
        <Text style={styles.successTitle}>Booking Successful!</Text>
        <Text style={styles.successMessage}>
          Your booking has been confirmed. Order ID: {orderId}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGoToHome}
          >
            <Ionicons name="home" size={24} color="white" />
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.profileButton]}
            onPress={handleViewProfile}
          >
            <Ionicons name="person" size={24} color="white" />
            <Text style={styles.buttonText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    boxShadow: '0 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  checkmarkContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  profileButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 