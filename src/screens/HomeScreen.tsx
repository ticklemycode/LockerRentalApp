import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../config';
import { AppDispatch, RootState } from '../store';
import { fetchNearbyBusinesses } from '../store/businessSlice';
import { fetchUserBookings } from '../store/bookingSlice';
import LocationService from '../services/locationService';
import { Business, Booking } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MainTabParamList } from '../navigation/MainTabNavigator';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { businesses, isLoading: businessLoading } = useSelector((state: RootState) => state.business);
  const { bookings, isLoading: bookingLoading } = useSelector((state: RootState) => state.booking);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get user location
      const userLocation = await LocationService.getCurrentLocation();
      setLocation(userLocation);

      // Fetch nearby businesses and user bookings
      await Promise.all([
        dispatch(fetchNearbyBusinesses({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: config.APP_CONFIG.SEARCH_RADIUS_KM, // 25 miles
        })),
        dispatch(fetchUserBookings({})),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Location Error', 'Unable to get your location. Please enable location services.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const getActiveBookings = (): Booking[] => {
    return bookings.filter((booking: Booking) => booking.status === 'active' || booking.status === 'confirmed');
  };

  const getUpcomingBookings = (): Booking[] => {
    const now = new Date();
    return bookings.filter((booking: Booking) => 
      booking.status === 'confirmed' && 
      new Date(booking.startTime) > now
    ).slice(0, 3);
  };

  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeText}>Welcome back, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>Find secure storage for your belongings while exploring Atlanta</Text>
    </View>
  );

  const renderQuickStats = () => {
    const activeBookings = getActiveBookings();
    const totalBookings = bookings.length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="calendar" size={24} color="#2E86AB" />
          <Text style={styles.statNumber}>{activeBookings.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="time" size={24} color="#F39019" />
          <Text style={styles.statNumber}>{totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="location" size={24} color="#A23B72" />
          <Text style={styles.statNumber}>{businesses.length}</Text>
          <Text style={styles.statLabel}>Nearby Locations</Text>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.actionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Search')}
        >
          <Icon name="search" size={32} color="#2E86AB" />
          <Text style={styles.actionText}>Find Lockers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Bookings')}
        >
          <Icon name="calendar" size={32} color="#F39019" />
          <Text style={styles.actionText}>My Bookings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNearbyBusinesses = () => (
    <View style={styles.businessesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Locations</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {businesses.slice(0, 5).map((business: Business) => (
          <TouchableOpacity
            key={business._id}
            style={styles.businessCard}
            onPress={() => navigation.navigate('BusinessDetails', { businessId: business._id })}
          >
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{business.name}</Text>
              <Text style={styles.businessAddress} numberOfLines={2}>
                {business.address.street}, {business.address.city}
              </Text>
              <View style={styles.businessMeta}>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={12} color="#F39019" />
                  <Text style={styles.ratingText}>{business.rating?.toFixed(1) || 'N/A'}</Text>
                </View>
                <Text style={styles.distanceText}>
                  {location ? (business as any).distance?.toFixed(1) || '0.0' : '0.0'} km
                </Text>
              </View>
            </View>
            <View style={styles.availabilityIndicator}>
              <View style={[styles.availabilityDot, { backgroundColor: '#27AE60' }]} />
              <Text style={styles.availabilityText}>Available</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderUpcomingBookings = () => {
    const upcomingBookings = getUpcomingBookings();
    
    if (upcomingBookings.length === 0) {
      return null;
    }

    return (
      <View style={styles.bookingsContainer}>
        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        {upcomingBookings.map((booking: Booking) => (
          <TouchableOpacity
            key={booking._id}
            style={styles.bookingCard}
            onPress={() => navigation.navigate('BookingDetails', { bookingId: booking._id })}
          >
            <View style={styles.bookingInfo}>
              <Text style={styles.businessName}>{booking.business?.name || 'Unknown Business'}</Text>
              <Text style={styles.bookingTime}>
                {new Date(booking.startTime).toLocaleDateString()} at{' '}
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.lockerNumber}>Locker #{booking.lockerNumber}</Text>
            </View>
            <View style={styles.bookingStatus}>
              <View style={[styles.statusDot, { backgroundColor: '#F39019' }]} />
              <Text style={styles.statusText}>Confirmed</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderWelcomeSection()}
      {renderQuickStats()}
      {renderQuickActions()}
      {renderNearbyBusinesses()}
      {renderUpcomingBookings()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    backgroundColor: '#2E86AB',
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    paddingVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  businessesContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '600',
  },
  businessCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: width * 0.7,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    marginBottom: 8,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },
  bookingsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lockerNumber: {
    fontSize: 12,
    color: '#2E86AB',
    fontWeight: '600',
    marginTop: 4,
  },
  bookingStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
});

export default HomeScreen;
