import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  id: string;
  userId: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  address: {
    full: string;
  };
  description: string;
  profession: string;
}

interface UserDetails {
  name: string;
  mobileNo: string;
}

interface OrderWithUser extends Order {
  userDetails: UserDetails;
}

export default function OrdersPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workerId: string }>();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.workerId) {
      console.error('WorkerId is undefined');
      Alert.alert('Error', 'Worker ID not found', [
        { 
          text: 'Go Back', 
          onPress: () => router.back() 
        }
      ]);
      return;
    }
    fetchOrders();
  }, [params.workerId]);

  const fetchOrders = async () => {
    if (!params.workerId) return;
    
    try {
      setLoading(true);
      console.log('Fetching orders for workerId:', params.workerId); // Debug log
      
      const ordersQuery = query(
        collection(db, 'orders'),
        where('workerId', '==', params.workerId)
      );

      const querySnapshot = await getDocs(ordersQuery);
      const ordersData: OrderWithUser[] = [];

      for (const orderDoc of querySnapshot.docs) {
        const orderData = orderDoc.data() as Order;
        // Fetch user details for each order
        const userDoc = await getDoc(doc(db, 'users', orderData.userId));
        const userData = userDoc.data() as UserDetails;

        ordersData.push({
          ...orderData,
          id: orderDoc.id,
          userDetails: {
            name: userData?.name || 'Unknown User',
            mobileNo: userData?.mobileNo || 'No contact'
          }
        });
      }

      // Sort orders by date and status (pending first)
      ordersData.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'accepted' | 'declined') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );

      Alert.alert(
        'Success',
        `Order ${newStatus} successfully`
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
        return '#10b981';
      case 'declined':
        return '#ef4444';
      case 'completed':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>
      
      {orders.length === 0 ? (
        <View style={styles.content}>
          <Ionicons name="document-text-outline" size={50} color="#9ca3af" />
          <Text style={styles.placeholder}>No orders yet</Text>
        </View>
      ) : (
        <View style={styles.ordersList}>
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.userName}>{order.userDetails.name}</Text>
                  <Text style={styles.orderDate}>{order.date} at {order.time}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{order.userDetails.mobileNo}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{order.address.full}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{order.description}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="briefcase-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{order.profession}</Text>
                </View>
              </View>

              {order.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleStatusUpdate(order.id, 'accepted')}
                  >
                    <Ionicons name="checkmark-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleStatusUpdate(order.id, 'declined')}
                  >
                    <Ionicons name="close-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  ordersList: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    })
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});
