import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { cancelBooking, fetchUserBookings } from '../store/bookingSlice';
import { Booking } from '../types';

type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
import { formatDate, formatTime } from '../utils/helpers';

type RootStackParamList = {
  BookingDetails: { bookingId: string };
};

type BookingDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BookingDetails'
>;

type BookingDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'BookingDetails'
>;

interface Props {
  navigation: BookingDetailsScreenNavigationProp;
  route: BookingDetailsScreenRouteProp;
}

const BookingDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you'd have a separate API call for booking details
      // For now, we'll simulate fetching from the existing bookings
      const response = await fetch(`http://localhost:3000/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer user-token-here`,
        },
      });
      
      if (response.ok) {
        const bookingData = await response.json();
        setBooking(bookingData);
      } else {
        Alert.alert('Error', 'Failed to fetch booking details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Alert.alert('Error', 'Failed to fetch booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingDetails();
    setRefreshing(false);
  };

  const handleCancelBooking = () => {
    if (!booking) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        {
          text: 'Keep Booking',
          style: 'cancel',
        },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await dispatch(cancelBooking(booking._id)).unwrap();
              Alert.alert('Success', 'Booking cancelled successfully');
              dispatch(fetchUserBookings({}));
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'active':
        return '#2196F3';
      case 'completed':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      case 'expired':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const getRemainingTime = () => {
    if (!booking || booking.status !== 'active') return null;

    const now = new Date();
    const endTime = new Date(booking.endTime);
    const remaining = endTime.getTime() - now.getTime();

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canCancel = booking.status === 'confirmed' || booking.status === 'active';
  const remainingTime = getRemainingTime();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Booking Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      {remainingTime && booking.status === 'active' && (
        <View style={styles.remainingTimeContainer}>
          <Text style={styles.remainingTimeText}>{remainingTime}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{booking.business?.name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>
            {booking.business?.address 
              ? `${booking.business.address.street}, ${booking.business.address.city}, ${booking.business.address.state} ${booking.business.address.zipCode}`
              : 'Address not available'
            }
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{booking.business?.phoneNumber || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Locker Number:</Text>
          <Text style={styles.value}>#{booking.lockerNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Start Time:</Text>
          <Text style={styles.value}>
            {formatDate(booking.startTime)} at {formatTime(booking.startTime)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>End Time:</Text>
          <Text style={styles.value}>
            {formatDate(booking.endTime)} at {formatTime(booking.endTime)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Duration:</Text>
          <Text style={styles.value}>
            {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60))} hours
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Total Cost:</Text>
          <Text style={styles.value}>${booking.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {booking.specialInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.notesText}>{booking.specialInstructions}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Timeline</Text>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineDate}>
            {formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}
          </Text>
          <Text style={styles.timelineEvent}>Booking created</Text>
        </View>
        {booking.updatedAt !== booking.createdAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineDate}>
              {formatDate(booking.updatedAt)} at {formatTime(booking.updatedAt)}
            </Text>
            <Text style={styles.timelineEvent}>Booking updated</Text>
          </View>
        )}
      </View>

      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
          onPress={handleCancelBooking}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  remainingTimeContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  remainingTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  timelineItem: {
    marginBottom: 12,
  },
  timelineDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timelineEvent: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#FFCDD2',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default BookingDetailsScreen;