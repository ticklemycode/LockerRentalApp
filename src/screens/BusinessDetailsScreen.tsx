import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppDispatch, RootState } from '../store';
import { fetchBusinessById } from '../store/businessSlice';
import { createBooking } from '../store/bookingSlice';
import { Business } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MainTabParamList } from '../navigation/MainTabNavigator';

type BusinessDetailsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, 'BusinessDetails'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type BusinessDetailsScreenRouteProp = RouteProp<RootStackParamList, 'BusinessDetails'>;

interface RouteParams {
  businessId: string;
}

const BusinessDetailsScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours later
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<number | null>(null);
  const [availableLockers, setAvailableLockers] = useState<number[]>([]);

  const route = useRoute<BusinessDetailsScreenRouteProp>();
  const navigation = useNavigation<BusinessDetailsScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { businessId } = route.params;
  const { selectedBusiness, isLoading } = useSelector((state: RootState) => state.business);
  const { isLoading: bookingLoading } = useSelector((state: RootState) => state.booking);

  useEffect(() => {
    dispatch(fetchBusinessById(businessId));
  }, [dispatch, businessId]);

  useEffect(() => {
    // Set default times
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setMinutes(0, 0, 0); // Round to nearest hour
    defaultStart.setHours(defaultStart.getHours() + 1);
    
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultEnd.getHours() + 2);

    setStartTime(defaultStart);
    setEndTime(defaultEnd);
  }, []);

  const handleCallBusiness = () => {
    if (selectedBusiness?.phoneNumber) {
      Linking.openURL(`tel:${selectedBusiness.phoneNumber}`);
    }
  };

  const handleGetDirections = () => {
    if (selectedBusiness?.address) {
      const address = `${selectedBusiness.address.street}, ${selectedBusiness.address.city}, ${selectedBusiness.address.state} ${selectedBusiness.address.zipCode}`;
      const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
      Linking.openURL(url);
    }
  };

  const checkAvailability = async () => {
    if (!selectedBusiness) return;

    // Combine date with times
    const bookingStartTime = new Date(selectedDate);
    bookingStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    
    const bookingEndTime = new Date(selectedDate);
    bookingEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    // Validate times
    if (bookingEndTime <= bookingStartTime) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    const duration = (bookingEndTime.getTime() - bookingStartTime.getTime()) / (1000 * 60 * 60);
    if (duration > 10) {
      Alert.alert('Duration Limit', 'Maximum rental duration is 10 hours');
      return;
    }

    if (bookingStartTime < new Date()) {
      Alert.alert('Invalid Time', 'Start time cannot be in the past');
      return;
    }

    try {
      // For demo purposes, generate random available lockers
      const totalLockers = selectedBusiness.totalLockers || 20;
      const random = Math.floor(Math.random() * 5) + 1; // 1-5 unavailable lockers
      const available = Array.from({ length: totalLockers }, (_, i) => i + 1)
        .filter(() => Math.random() > 0.2); // 80% chance each locker is available
      
      setAvailableLockers(available);
      setSelectedLocker(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to check availability');
    }
  };

  const handleBookLocker = async () => {
    if (!selectedBusiness || !selectedLocker) {
      Alert.alert('Missing Information', 'Please select a locker');
      return;
    }

    const bookingStartTime = new Date(selectedDate);
    bookingStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    
    const bookingEndTime = new Date(selectedDate);
    bookingEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    const duration = (bookingEndTime.getTime() - bookingStartTime.getTime()) / (1000 * 60 * 60);

    try {
      const result = await dispatch(createBooking({
        businessId: selectedBusiness._id,
        startTime: bookingStartTime.toISOString(),
        durationHours: duration,
        specialInstructions: `Locker #${selectedLocker}`,
      }));

      if (createBooking.fulfilled.match(result)) {
        Alert.alert(
          'Booking Confirmed!',
          `Your locker #${selectedLocker} has been booked successfully.`,
          [
            {
              text: 'View Booking',
              onPress: () => {
                navigation.navigate('MainTabs', { screen: 'Bookings' } as any);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message || 'Please try again');
    }
  };

  const renderBusinessInfo = () => {
    if (!selectedBusiness) return null;

    return (
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{selectedBusiness.name}</Text>
        <Text style={styles.businessType}>{selectedBusiness.businessType}</Text>
        
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#F39019" />
          <Text style={styles.ratingText}>{selectedBusiness.rating?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.reviewsText}>• Based on reviews</Text>
        </View>

        <View style={styles.addressContainer}>
          <Icon name="location-outline" size={16} color="#666" />
          <Text style={styles.addressText}>
            {selectedBusiness.address.street}, {selectedBusiness.address.city}, {selectedBusiness.address.state} {selectedBusiness.address.zipCode}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCallBusiness}>
            <Icon name="call" size={16} color="#2E86AB" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
            <Icon name="navigate" size={16} color="#2E86AB" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDateTimeSelection = () => (
    <View style={styles.dateTimeContainer}>
      <Text style={styles.sectionTitle}>Select Date & Time</Text>
      
      <TouchableOpacity
        style={styles.dateTimeButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Icon name="calendar-outline" size={16} color="#666" />
        <Text style={styles.dateTimeText}>
          {selectedDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <View style={styles.timeRow}>
        <TouchableOpacity
          style={[styles.dateTimeButton, styles.timeButton]}
          onPress={() => setShowStartTimePicker(true)}
        >
          <Icon name="time-outline" size={16} color="#666" />
          <Text style={styles.dateTimeText}>
            Start: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateTimeButton, styles.timeButton]}
          onPress={() => setShowEndTimePicker(true)}
        >
          <Icon name="time-outline" size={16} color="#666" />
          <Text style={styles.dateTimeText}>
            End: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.checkAvailabilityButton} onPress={checkAvailability}>
        <Text style={styles.checkAvailabilityText}>Check Availability</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
          minimumDate={new Date()}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowStartTimePicker(false);
            if (time) setStartTime(time);
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowEndTimePicker(false);
            if (time) setEndTime(time);
          }}
        />
      )}
    </View>
  );

  const renderLockerSelection = () => {
    if (availableLockers.length === 0) return null;

    return (
      <View style={styles.lockerContainer}>
        <Text style={styles.sectionTitle}>Available Lockers</Text>
        <View style={styles.lockerGrid}>
          {availableLockers.map((lockerNumber) => (
            <TouchableOpacity
              key={lockerNumber}
              style={[
                styles.lockerButton,
                selectedLocker === lockerNumber && styles.lockerButtonSelected,
              ]}
              onPress={() => setSelectedLocker(lockerNumber)}
            >
              <Text
                style={[
                  styles.lockerButtonText,
                  selectedLocker === lockerNumber && styles.lockerButtonTextSelected,
                ]}
              >
                {lockerNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderBookingButton = () => {
    if (!selectedLocker) return null;

    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const hourlyRate = 5; // $5 per hour
    const totalAmount = duration * hourlyRate;

    return (
      <View style={styles.bookingContainer}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceText}>${totalAmount.toFixed(2)}</Text>
          <Text style={styles.priceDetails}>
            {duration.toFixed(1)} hours × ${hourlyRate}/hour
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.bookButton, bookingLoading && styles.buttonDisabled]}
          onPress={handleBookLocker}
          disabled={bookingLoading}
        >
          <Text style={styles.bookButtonText}>
            {bookingLoading ? 'Booking...' : 'Book Locker'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Loading business details...</Text>
      </View>
    );
  }

  if (!selectedBusiness) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Business not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderBusinessInfo()}
      {renderDateTimeSelection()}
      {renderLockerSelection()}
      {renderBookingButton()}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  businessInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessType: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '600',
  },
  dateTimeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeButton: {
    flex: 0.48,
  },
  checkAvailabilityButton: {
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  checkAvailabilityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  lockerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lockerButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockerButtonSelected: {
    borderColor: '#2E86AB',
    backgroundColor: '#2E86AB',
  },
  lockerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lockerButtonTextSelected: {
    color: '#fff',
  },
  bookingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  priceDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonDisabled: {
    backgroundColor: '#bbb',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BusinessDetailsScreen;
