import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, TextInput, Modal, Dimensions } from 'react-native';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

interface WorkerData {
  name: string;
  email: string;
  mobileNumber: string;
  profession: string;
  experience: string;
  description: string;
  status: string;
  rating: number;
  totalJobs: number;
  createdAt: any;
  profileImage?: string;
  username: string;
}

interface Post {
  id?: string;
  imageUrl: string;
  caption: string;
  createdAt: any;
  likes?: number;
  comments?: number;
}

export default function ProfilePage() {
  const { workerId } = useLocalSearchParams();
  const [workerData, setWorkerData] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<WorkerData>>({});
  const [newPost, setNewPost] = useState<Partial<Post>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchWorkerData();
    fetchPosts();
  }, [workerId]);

  const fetchWorkerData = async () => {
    try {
      const workerDoc = await getDoc(doc(db, 'workers', workerId as string));
      if (workerDoc.exists()) {
        setWorkerData(workerDoc.data() as WorkerData);
        setEditedData(workerDoc.data() as WorkerData);
      }
    } catch (error) {
      console.error('Error fetching worker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'workers', workerId as string, 'posts'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(postsQuery);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profile_${workerId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile_images/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'workers', workerId as string), {
        profileImage: downloadURL
      });
      
      setWorkerData(prev => prev ? { ...prev, profileImage: downloadURL } : null);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'workers', workerId as string), editedData);
      setWorkerData(prev => prev ? { ...prev, ...editedData } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const pickPostImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPostImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!postImage || !newPost.caption) {
      alert('Please add both image and caption');
      return;
    }

    setIsUploading(true);
    try {
      // Upload image
      const response = await fetch(postImage);
      const blob = await response.blob();
      const filename = `post_${workerId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `post_images/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Create post in Firestore
      await addDoc(collection(db, 'workers', workerId as string, 'posts'), {
        imageUrl: downloadURL,
        caption: newPost.caption,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setPostImage(null);
      setNewPost({});
      setIsPostModalVisible(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!workerData) {
    return (
      <View style={styles.container}>
        <Text>Worker profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
          {workerData.profileImage ? (
            <Image source={{ uri: workerData.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="white" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.username}>{workerData.username || 'username'}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{workerData.rating || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{workerData.experience || 0}</Text>
            <Text style={styles.statLabel}>years</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={editedData.name}
              onChangeText={(text) => setEditedData({ ...editedData, name: text })}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={editedData.description}
              onChangeText={(text) => setEditedData({ ...editedData, description: text })}
              placeholder="Description"
              multiline
            />
            <TextInput
              style={styles.input}
              value={editedData.profession}
              onChangeText={(text) => setEditedData({ ...editedData, profession: text })}
              placeholder="Category"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{workerData.name}</Text>
            <Text style={styles.description}>{workerData.description}</Text>
            <Text style={styles.category}>{workerData.profession}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Posts Grid Section */}
      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>Posts</Text>
        <View style={styles.postsGrid}>
          {posts.map((post) => (
            <TouchableOpacity 
              key={post.id} 
              style={styles.gridItem}
              onPress={() => {/* Handle post press */}}
            >
              <Image 
                source={{ uri: post.imageUrl }} 
                style={styles.gridImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Post Button */}
      <TouchableOpacity 
        style={styles.addPostButton}
        onPress={() => setIsPostModalVisible(true)}
      >
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.addPostButtonText}>Add Post</Text>
      </TouchableOpacity>

      {/* Post Modal */}
      <Modal
        visible={isPostModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Post</Text>
              <TouchableOpacity 
                onPress={() => setIsPostModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.imageUploadContainer}
              onPress={pickPostImage}
            >
              {postImage ? (
                <Image source={{ uri: postImage }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image" size={40} color="#666" />
                  <Text style={styles.uploadText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              value={newPost.caption}
              onChangeText={(text) => setNewPost({ ...newPost, caption: text })}
              multiline
            />

            <TouchableOpacity 
              style={[styles.postButton, (!postImage || !newPost.caption) && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={!postImage || !newPost.caption || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.postButtonText}>Share Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  editButtonText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  editForm: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  postsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  gridItem: {
    width: (Dimensions.get('window').width - 44) / 3, // 44 = padding * 2 + margin * 2
    height: (Dimensions.get('window').width - 44) / 3,
    margin: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  addPostButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addPostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  captionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    fontSize: 16,
    marginBottom: 15,
  },
  postButton: {
    backgroundColor: '#4f46e5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
