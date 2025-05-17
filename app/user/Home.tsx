import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Worker {
  id: string;
  name: string;
  profession: string;
  experience: string;
  rating: number;
  profileImage?: string;
}

export default function Home() {
  const { userId } = useLocalSearchParams();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [searchQuery, workers]);

  const fetchWorkers = async () => {
    try {
      const workersQuery = query(collection(db, 'workers'), orderBy('rating', 'desc'));
      const querySnapshot = await getDocs(workersQuery);
      const workersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Worker[];
      setWorkers(workersData);
      setFilteredWorkers(workersData);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWorkers = () => {
    if (!searchQuery.trim()) {
      setFilteredWorkers(workers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = workers.filter(worker => {
      return (
        worker.name.toLowerCase().includes(query) ||
        worker.profession.toLowerCase().includes(query) ||
        worker.experience.toString().toLowerCase().includes(query) ||
        worker.rating.toString().includes(query)
      );
    });
    setFilteredWorkers(filtered);
  };

  const renderWorkerCard = ({ item }: { item: Worker }) => (
    <TouchableOpacity 
      style={styles.workerCard}
      onPress={() => router.push({
        pathname: '/user/WorkerDetailsPage',
        params: { workerId: item.id, userId }
      })}
    >
      <View style={styles.workerImageContainer}>
        {item.profileImage ? (
          <Image 
            source={{ uri: item.profileImage }} 
            style={styles.workerImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="person" size={40} color="#666" />
          </View>
        )}
      </View>
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{item.name}</Text>
        <Text style={styles.workerProfession}>{item.profession}</Text>
        <View style={styles.workerStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.statText}>{item.rating || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="briefcase-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.experience} years</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={["#9ECAE1", "#C6DBEF"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182BD" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#9ECAE1", "#C6DBEF"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Workers</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push({
            pathname: '/user/UserDetails',
            params: { userId }
          })}
        >
          <Ionicons name="person-circle" size={30} color="#3182BD" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#3182BD" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workers by name, profession, experience..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#3182BD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredWorkers}
        renderItem={renderWorkerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workers found</Text>
          </View>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: '#C6DBEF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 10,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  searchContainer: {
    // padding: 15,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: '#C6DBEF',
    borderRadius: 14,
    marginHorizontal: 10,
    marginBottom: 10,
    width: '95%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: '#3182BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#08519C',
  },
  clearButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#08519C',
  },
  profileButton: {
    padding: 5,
  },
  listContainer: {
    padding: 15,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#3182BD',
  },
  workerCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF3FF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#3182BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    minHeight: 90,
    alignItems: 'center',
  },
  workerImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  workerInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#08519C',
    marginBottom: 4,
  },
  workerProfession: {
    fontSize: 16,
    color: '#3182BD',
    marginBottom: 8,
  },
  workerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    marginLeft: 4,
    color: '#3182BD',
    fontSize: 14,
  },
});
