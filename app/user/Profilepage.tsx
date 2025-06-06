import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UserData {
  name: string;
  email: string;
  mobileNo: string;
  address: string;
  profileImage?: string;
}

export default function ProfilePage() {
  const { userId } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId as string));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        setEditedData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedData || !userId) return;

    try {
      await updateDoc(doc(db, 'users', userId as string), {
        name: editedData.name,
        mobileNo: editedData.mobileNo,
        address: editedData.address
      });
      setUserData(editedData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        await uploadImage(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `profile_images/${userId}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'users', userId as string), {
        profileImage: downloadURL
      });
      
      setUserData(prev => prev ? { ...prev, profileImage: downloadURL } : null);
      setEditedData(prev => prev ? { ...prev, profileImage: downloadURL } : null);
      
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleViewOrders = () => {
    router.push({
      pathname: '/user/MyOrders',
      params: { userId }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={handleImagePick}
        >
          {userData.profileImage ? (
            <Image 
              source={{ uri: userData.profileImage }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
          )}
          <View style={styles.editImageButton}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{userData.name}</Text>
        <Text style={styles.email}>{userData.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.label}>Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedData?.name}
              onChangeText={(text) => setEditedData(prev => prev ? { ...prev, name: text } : null)}
            />
          ) : (
            <Text style={styles.value}>{userData.name}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userData.email}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>Mobile Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedData?.mobileNo}
              onChangeText={(text) => setEditedData(prev => prev ? { ...prev, mobileNo: text } : null)}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{userData.mobileNo}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>Address</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedData?.address}
              onChangeText={(text) => setEditedData(prev => prev ? { ...prev, address: text } : null)}
              multiline
            />
          ) : (
            <Text style={styles.value}>{userData.address}</Text>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setEditedData(userData);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.editButton]}
            onPress={handleEdit}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.ordersButton}
        onPress={handleViewOrders}
      >
        <Ionicons name="list" size={24} color="#4f46e5" />
        <Text style={styles.ordersButtonText}>My Orders</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4f46e5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#4f46e5',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  ordersButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
