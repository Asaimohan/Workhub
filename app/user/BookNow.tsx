import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookNow() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState<string | null>(null);
  const [profession, setProfession] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Extract and validate parameters
    const { userId: paramUserId, workerId: paramWorkerId, workerName: paramWorkerName, profession: paramProfession } = params;
    
    if (!paramUserId) {
      console.error('No user ID provided');
      Alert.alert('Error', 'User ID not found. Please try logging in again.');
      router.back();
      return;
    }

    if (!paramWorkerId) {
      console.error('No worker ID provided');
      Alert.alert('Error', 'Worker information not found. Please try again.');
      router.back();
      return;
    }

    setUserId(paramUserId.toString());
    setWorkerId(paramWorkerId.toString());
    setWorkerName(paramWorkerName?.toString() || null);
    setProfession(paramProfession?.toString() || null);

    console.log('Parameters loaded:', {
      userId: paramUserId,
      workerId: paramWorkerId,
      workerName: paramWorkerName,
      profession: paramProfession
    });
  }, [params]);

  // Test Firestore connection
  useEffect(() => {
    const testFirestoreConnection = async () => {
      try {
        console.log('Testing Firestore connection...');
        if (!db) {
          console.error('Firestore db instance is not available');
          return;
        }
        
        const testRef = collection(db, 'test');
        const snapshot = await getDocs(testRef);
        console.log('Firestore connection successful!');
        setFirebaseReady(true);
      } catch (error) {
        console.error('Firestore connection error:', error);
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      }
    };

    testFirestoreConnection();
  }, []);

  const handleBooking = async () => {
    if (!firebaseReady) {
      Alert.alert('Error', 'Please wait while we establish connection to the server.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please try logging in again.');
      return;
    }

    if (!workerId) {
      Alert.alert('Error', 'Worker information not found. Please try again.');
      return;
    }

    console.log('Starting booking process...');
    console.log('User ID:', userId);
    console.log('Worker ID:', workerId);

    if (!description || !address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Format the date and time
      const bookingDate = date.toISOString().split('T')[0];
      const bookingTime = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      console.log('Formatted date:', bookingDate);
      console.log('Formatted time:', bookingTime);

      // Prepare the order data
      const orderData = {
        userId: userId,
        workerId: workerId,
        date: bookingDate,
        time: bookingTime,
        status: 'pending',
        address: {
          full: address.trim()
        },
        description: description.trim(),
        reviewed: false,
        workerName: workerName || '',
        profession: profession || '',
        createdAt: serverTimestamp()
      };

      console.log('Prepared order data:', JSON.stringify(orderData, null, 2));

      // Save to Firestore
      console.log('Attempting to save to Firestore...');
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, orderData);
      
      console.log('Order saved successfully with ID:', docRef.id);
      
      // Navigate to success page
      console.log('Navigating to success page...');
      router.push({
        pathname: '/user/OrderSuccessful',
        params: { 
          orderId: docRef.id, 
          userId: userId
        }
      });
    } catch (error: any) {
      console.error('Detailed error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to create order. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to create orders.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Server is unavailable. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <LinearGradient colors={["#9ECAE1", "#C6DBEF"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#08519C" />
          </TouchableOpacity>
          <Text style={styles.title}>Book Service</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.workerName}>{workerName}</Text>
          <Text style={styles.profession}>{profession}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Description of Work</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe what needs to be done"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Select Date and Time</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity 
              style={[styles.dateTimeButton, styles.dateButton]}
              onPress={() => {
                setShowTimePicker(false);
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateTimeButtonText}>
                {date.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dateTimeButton, styles.timeButton]}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.dateTimeButtonText}>
                {formatTime(date)}
              </Text>
              <Ionicons name="time-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          <TouchableOpacity 
            style={styles.bookButton}
            onPress={handleBooking}
            disabled={loading}
          >
            <LinearGradient
              colors={["#3182BD", "#08519C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.bookButtonText}>
                {loading ? 'Sending Request...' : 'Confirm Booking'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#08519C',
    flex: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#EFF3FF',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#3182BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    alignItems: 'center',
  },
  workerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#08519C',
    marginBottom: 5,
  },
  profession: {
    fontSize: 16,
    color: '#3182BD',
  },
  form: {
    backgroundColor: '#EFF3FF',
    margin: 15,
    padding: 18,
    borderRadius: 14,
    shadowColor: '#3182BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#08519C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#9ECAE1',
    color: '#08519C',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  dateButton: {
    marginRight: 8,
  },
  timeButton: {
    marginLeft: 8,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#08519C',
  },
  bookButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  gradientButton: {
    padding: 15,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
