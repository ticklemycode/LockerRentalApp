import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppDispatch, RootState } from '../store';
import { fetchUserBookings, cancelBooking } from '../store/bookingSlice';
import { Booking, Business } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MainTabParamList } from '../navigation/MainTabNavigator';

type BookingScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Bookings'>,
  StackNavigationProp<RootStackParamList>
>;

type BookingStatus = 'all' | 'active' | 'confirmed' | 'completed' | 'cancelled';

const BookingsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>('all');

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<BookingScreenNavigationProp>();
  const { bookings, isLoading } = useSelector((state: RootState) => state.booking);

  useEffect(() => {
    dispatch(fetchUserBookings({}));
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUserBookings({}));
    setRefreshing(false);
  };

  const handleCancelBooking = (bookingId: string, businessName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${businessName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelBooking(bookingId)).unwrap();
              Alert.alert('Success', 'Booking cancelled successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const getFilteredBookings = (): Booking[] => {
    if (selectedStatus === 'all') {
      return bookings;
    }
    return bookings.filter((booking: Booking) => booking.status === selectedStatus);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#27AE60';
      case 'confirmed':
        return '#F39019';
      case 'completed':
        return '#3498DB';
      case 'cancelled':
        return '#E74C3C';
      default:
        return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'confirmed':
        return 'time';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const canCancelBooking = (booking: Booking): boolean => {
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return false;
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDifference = startTime.getTime() - now.getTime();
    const hoursUntilStart = timeDifference / (1000 * 60 * 60);

    return hoursUntilStart >= 1; // Can cancel if more than 1 hour before start
  };

  const renderStatusFilter = () => {
    const statusOptions: { key: BookingStatus; label: string; count: number }[] = [
      { key: 'all', label: 'All', count: bookings.length },
      { key: 'active', label: 'Active', count: bookings.filter((b: Booking) => b.status === 'active').length },
      { key: 'confirmed', label: 'Confirmed', count: bookings.filter((b: Booking) => b.status === 'confirmed').length },
      { key: 'completed', label: 'Completed', count: bookings.filter((b: Booking) => b.status === 'completed').length },
      { key: 'cancelled', label: 'Cancelled', count: bookings.filter((b: Booking) => b.status === 'cancelled').length },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              selectedStatus === option.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(option.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedStatus === option.key && styles.filterButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
            {option.count > 0 && (
              <View style={[
                styles.countBadge,
                selectedStatus === option.key && styles.countBadgeActive,
              ]}>
                <Text style={[
                  styles.countText,
                  selectedStatus === option.key && styles.countTextActive,
                ]}>
                  {option.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderBookingCard = (booking: Booking) => {
    const business = booking.business;
    const statusColor = getStatusColor(booking.status);
    const statusIcon = getStatusIcon(booking.status);

    return (
      <TouchableOpacity
        key={booking._id}
        style={styles.bookingCard}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: booking._id })}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business?.name || 'Unknown Business'}</Text>
            <Text style={styles.businessAddress}>
              {business?.address ? `${business.address.street}, ${business.address.city}` : 'Address not available'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Icon name={statusIcon} size={12} color="#fff" />
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(new Date(booking.startTime))}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="cube-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Locker #{booking.lockerNumber}</Text>
          </View>
        </View>

        <View style={styles.bookingActions}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>${booking.totalAmount?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.priceLabel}>Total</Text>
          </View>
          
          {canCancelBooking(booking) && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(booking._id, business?.name || 'Unknown Business')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading && bookings.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      );
    }

    const filteredBookings = getFilteredBookings();

    if (filteredBookings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {selectedStatus === 'all' ? 'No Bookings Yet' : `No ${selectedStatus} Bookings`}
          </Text>
          <Text style={styles.emptyText}>
            {selectedStatus === 'all' 
              ? 'Start by finding and booking a locker near you'
              : `You don't have any ${selectedStatus} bookings at the moment`
            }
          </Text>
          {selectedStatus === 'all' && (
            <TouchableOpacity
              style={styles.findLockersButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Text style={styles.findLockersButtonText}>Find Lockers</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.bookingsContainer}>
        <Text style={styles.resultsHeader}>
          {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
        </Text>
        {filteredBookings.map(renderBookingCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderStatusFilter()}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#2E86AB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  countTextActive: {
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  findLockersButton: {
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  findLockersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingsContainer: {
    padding: 20,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookingsScreen;
