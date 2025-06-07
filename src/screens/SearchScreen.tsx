import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppDispatch, RootState } from '../store';
import { fetchNearbyBusinesses, searchBusinesses, clearError, clearBusinesses } from '../store/businessSlice';
import LocationService from '../services/locationService';
import { BusinessMap } from '../components';
import { Business } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MainTabParamList } from '../navigation/MainTabNavigator';
import config from '../config';
import { getDebugCoordinates } from '../utils/debugHelper';

type SearchScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Search'>,
  StackNavigationProp<RootStackParamList>
>;

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'location' | 'search'>('location');
  const [isZipCodeSearch, setIsZipCodeSearch] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { businesses, nearbyBusinesses, isLoading, error } = useSelector((state: RootState) => state.business);
  
  // Unified businesses array - combine both regular search results and nearby businesses
  const displayBusinesses = useMemo(() => {
    // If we have specific search results, use those
    if (businesses.length > 0) {
      console.log(`SEARCH: Using ${businesses.length} specific search results`);
      return businesses;
    }
    // Otherwise use nearby businesses
    if (nearbyBusinesses.length > 0) {
      console.log(`SEARCH: Using ${nearbyBusinesses.length} nearby businesses`);
      return nearbyBusinesses;
    }
    // No businesses available
    console.log('SEARCH: No businesses available in either array');
    return [];
  }, [businesses, nearbyBusinesses]);

  // Load user location on initial render
  useEffect(() => {
    loadUserLocation();
  }, []);
  
  // Handle tab change - load location data when switching to "Near Me" tab
  useEffect(() => {
    if (searchType === 'location' && !location) {
      loadUserLocation();
    }
  }, [searchType]);

  // Automatically show map when businesses are found
  useEffect(() => {
    if (displayBusinesses.length > 0) {
      console.log('Businesses found, automatically showing map. Count:', displayBusinesses.length);
      console.log('First business:', JSON.stringify(displayBusinesses[0].name));
      setShowMap(true);
    } else {
      console.log('No businesses in state, businesses.length =', displayBusinesses.length);
    }
  }, [displayBusinesses]);

  // Debug effect to track location and businesses state
  useEffect(() => {
    console.log('=== SEARCH_DEBUG: State changed ===');
    console.log('Location details:', {
      hasLocation: !!location,
      locationData: location,
      locationType: typeof location,
      locationValidation: location ? {
        hasLatitude: 'latitude' in location,
        hasLongitude: 'longitude' in location,
        latitudeValue: location.latitude,
        longitudeValue: location.longitude,
        latitudeType: typeof location.latitude,
        longitudeType: typeof location.longitude
      } : null
    });
    console.log('Business details:', {
      businessesCount: displayBusinesses.length,
      firstBusiness: displayBusinesses.length > 0 ? {
        name: displayBusinesses[0].name,
        coordinates: displayBusinesses[0].location.coordinates
      } : null
    });
    console.log('Map display:', { showMap });
    console.log('Search type:', { searchType });
    console.log('Timestamp:', new Date().toISOString());
    console.log('=== END SEARCH_DEBUG ===');
  }, [location, displayBusinesses, showMap, searchType]);

  const loadUserLocation = async () => {
    try {
      console.log('LOCATION_DEBUG: Starting to load user location...');
      console.log('LOCATION_DEBUG: Current location state before loading:', location);
      setIsLoadingLocation(true);
      
      // First check if we have location permissions
      const hasPermission = await LocationService.requestLocationPermission();
      console.log('LOCATION_DEBUG: Location permission status:', hasPermission);
      
      if (!hasPermission) {
        console.log('LOCATION_DEBUG: No location permission granted');
        throw new Error('Location permission not granted');
      }
      
      const userLocation = await LocationService.getCurrentLocation();
      console.log('LOCATION_DEBUG: User location loaded successfully:', userLocation);
      console.log('LOCATION_DEBUG: Location coordinates:', `Lat: ${userLocation.latitude}, Lng: ${userLocation.longitude}`);
      console.log('LOCATION_DEBUG: Location accuracy:', userLocation.accuracy);
      
      setLocation(userLocation);
      console.log('LOCATION_DEBUG: Location state updated');
    } catch (error) {
      console.error('LOCATION_DEBUG: Failed to load user location:', error);
      console.error('LOCATION_DEBUG: Error details:', JSON.stringify(error));
      
      // For simulator testing, the fallback location should be handled in LocationService
      // No need to show an error alert - just log the issue
      if (__DEV__) {
        console.log('LOCATION_DEBUG: In development mode, location service should provide fallback');
      }
    } finally {
      setIsLoadingLocation(false);
      console.log('LOCATION_DEBUG: Location loading finished, isLoadingLocation set to false');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a search term');
      return;
    }

    // Clear existing results
    dispatch(clearBusinesses());
    dispatch(clearError());

    try {
      if (searchType === 'search') {
        // Check if search query is a valid ZIP code
        const zipRegex = /^\d{5}$/;
        const trimmedQuery = searchQuery.trim();
        
        if (isZipCodeSearch && zipRegex.test(trimmedQuery)) {
          // ZIP code search
          // Check if we have debug coordinates for this ZIP code
          const debugCoords = getDebugCoordinates(trimmedQuery);
          if (debugCoords) {
            console.log(`Using debug coordinates for ZIP ${trimmedQuery}: [${debugCoords.latitude}, ${debugCoords.longitude}]`);
            dispatch(fetchNearbyBusinesses({
              latitude: debugCoords.latitude,
              longitude: debugCoords.longitude,
              radius: config.APP_CONFIG.SEARCH_RADIUS_KM,
            }));
          } else {
            dispatch(searchBusinesses({ zipCode: trimmedQuery }));
          }
        } else if (isZipCodeSearch && !zipRegex.test(trimmedQuery)) {
          // Invalid ZIP code format
          Alert.alert('Invalid ZIP Code', 'Please enter a valid 5-digit ZIP code');
        } else {
          // Business name search
          dispatch(searchBusinesses({ name: trimmedQuery }));
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Unable to perform search. Please try again.');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    dispatch(clearBusinesses());
    dispatch(clearError());
    setShowMap(false);
  };

  const handleFindNearby = async () => {
    setIsLoadingLocation(true);
    try {
      console.log('SEARCH: Getting current location...');
      const userLocation = await LocationService.getCurrentLocation();
      console.log('SEARCH: Got location:', JSON.stringify(userLocation));
      console.log('SEARCH: Setting location state');
      setLocation(userLocation);
      
      // Enhanced logging for debugging
      console.log(`SEARCH: Fetching nearby businesses with radius ${config.APP_CONFIG.SEARCH_RADIUS_KM}km`);
      
      console.log('SEARCH: Dispatching fetchNearbyBusinesses');
      dispatch(fetchNearbyBusinesses({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: config.APP_CONFIG.SEARCH_RADIUS_KM,
      }));
      console.log('SEARCH: fetchNearbyBusinesses dispatched');
    } catch (error) {
      console.error('SEARCH: Location error:', error);
      Alert.alert('Location Error', 'Unable to get your location for nearby search');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const renderSearchHeader = () => (
    <View style={styles.searchHeader}>
      <View style={styles.searchTypeContainer}>
        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === 'location' && styles.searchTypeActive]}
          onPress={() => {
            setSearchType('location');
            // Clear the search query when switching to "Near Me" tab
            setSearchQuery('');
            // Clear any error state
            dispatch(clearError());
          }}
        >
          <Icon
            name="location-outline"
            size={20}
            color={searchType === 'location' ? '#2E86AB' : 'rgba(255, 255, 255, 0.8)'}
          />
          <Text style={[
            styles.searchTypeText,
            searchType === 'location' && styles.searchTypeTextActive
          ]}>
            Near Me
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.searchTypeButton, searchType === 'search' && styles.searchTypeActive]}
          onPress={() => {
            setSearchType('search');
            // Clear any location-based results
            dispatch(clearBusinesses());
            // Clear any error state
            dispatch(clearError());
          }}
        >
          <Icon
            name="search-outline"
            size={20}
            color={searchType === 'search' ? '#2E86AB' : 'rgba(255, 255, 255, 0.8)'}
          />
          <Text style={[
            styles.searchTypeText,
            searchType === 'search' && styles.searchTypeTextActive
          ]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {searchType === 'search' && (
        <>
          <View style={styles.searchTypeToggle}>
            <TouchableOpacity
              style={[styles.searchToggleButton, isZipCodeSearch && styles.searchToggleActive]}
              onPress={() => setIsZipCodeSearch(true)}
            >
              <Text style={[styles.searchToggleText, isZipCodeSearch && styles.searchToggleTextActive]}>
                ZIP Code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchToggleButton, !isZipCodeSearch && styles.searchToggleActive]}
              onPress={() => setIsZipCodeSearch(false)}
            >
              <Text style={[styles.searchToggleText, !isZipCodeSearch && styles.searchToggleTextActive]}>
                Business Name
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={isZipCodeSearch ? "Enter ZIP code (e.g., 30309)" : "Enter business name"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardType={isZipCodeSearch ? "numeric" : "default"}
              maxLength={isZipCodeSearch ? 5 : undefined}
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.inlineSearchButton, !searchQuery.trim() && styles.inlineSearchButtonDisabled]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {searchType === 'location' && (
        <>
          {/* Location Status Indicator for debugging */}
          <View style={styles.locationStatusContainer}>
            <Icon 
              name={location ? "checkmark-circle" : "alert-circle"} 
              size={16} 
              color={location ? "#28a745" : "#ffc107"} 
              style={{ marginRight: 4 }}
            />
            <Text style={styles.locationStatusText}>
              {location 
                ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : isLoadingLocation 
                  ? "Getting location..."
                  : "No location available"
              }
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.nearbyButton, isLoadingLocation && styles.nearbyButtonDisabled]}
            onPress={handleFindNearby}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <>
                <ActivityIndicator size="small" color="#2E86AB" style={{ marginRight: 8 }} />
                <Text style={styles.nearbyButtonText}>Finding Lockers...</Text>
              </>
            ) : (
              <>
                <Icon name="locate" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.nearbyButtonText}>Find Nearby Lockers</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={styles.mapToggleContainer}>
        <Text style={styles.mapToggleLabel}>Show Map</Text>
        <Switch
          value={showMap}
          onValueChange={setShowMap}
          trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#F39019' }}
          thumbColor={showMap ? '#fff' : 'rgba(255, 255, 255, 0.9)'}
          ios_backgroundColor="rgba(255, 255, 255, 0.3)"
        />
      </View>
    </View>
  );

  const renderBusinessCard = (business: Business) => (
    <TouchableOpacity
      key={business._id}
      style={styles.businessCard}
      onPress={() => navigation.navigate('BusinessDetails', { businessId: business._id })}
    >
      <View style={styles.businessHeader}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessAddress}>
            {business.address.street}, {business.address.city}, {business.address.state} {business.address.zipCode}
          </Text>
          <Text style={styles.businessCategory}>{business.businessType}</Text>
        </View>
      </View>

      <View style={styles.businessDetails}>
        <View style={styles.detailItem}>
          <Icon name="location-outline" size={14} color="#666" />
          <Text style={styles.detailText}>
            {business.address.street}, {business.address.city}, {business.address.state} {business.address.zipCode}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="time-outline" size={14} color="#666" />
          <Text style={styles.detailText}>
            Check hours
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="cube-outline" size={14} color="#666" />
          <Text style={styles.detailText}>
            {business.availableLockers}/{business.totalLockers} available
          </Text>
          <View style={[styles.availabilityDot, {
            backgroundColor: business.availableLockers > 0 ? '#27AE60' : '#E74C3C'
          }]} />
          <Text style={[styles.availabilityText, {
            color: business.availableLockers > 0 ? '#27AE60' : '#E74C3C'
          }]}>
            {business.availableLockers > 0 ? `${business.availableLockers} available` : 'Full'}
          </Text>
        </View>

        {business.phoneNumber && (
          <View style={styles.detailItem}>
            <Icon name="call-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{business.phoneNumber}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Searching for lockers...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorTitle}>Search Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              dispatch(clearError());
              if (searchType === 'search' && searchQuery.trim()) {
                handleSearch();
              } else if (searchType === 'location') {
                handleFindNearby();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (displayBusinesses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            {searchType === 'location' 
              ? 'No lockers found in your area. Try expanding your search radius or search by ZIP code.'
              : 'No lockers found for this ZIP code. Try a different area.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        {showMap && (
          <View style={styles.mapContainer}>
            <BusinessMap
              businesses={displayBusinesses}
              userLocation={location || undefined}
              onBusinessPress={(business) => navigation.navigate('BusinessDetails', { businessId: business._id })}
              height={250}
            />
            {/* Debug info */}
            {__DEV__ && (
              <View style={{ position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.7)', padding: 5, borderRadius: 3 }}>
                <Text style={{ color: 'white', fontSize: 10 }}>
                  Businesses: {displayBusinesses.length} | Location: {location ? 'Yes' : 'No'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <Text style={styles.resultsHeader}>
          {displayBusinesses.length} location{displayBusinesses.length !== 1 ? 's' : ''} found
        </Text>
        {displayBusinesses.map(renderBusinessCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSearchHeader()}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
  searchHeader: {
    backgroundColor: '#2E86AB',
    padding: 20,
    paddingBottom: 24,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  searchTypeActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchTypeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchTypeTextActive: {
    color: '#2E86AB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 12,
    paddingLeft: 16,
    paddingRight: 6,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  searchButtonText: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: '600',
  },
  inlineSearchButton: {
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    padding: 10,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSearchButtonDisabled: {
    backgroundColor: 'rgba(46, 134, 171, 0.6)',
  },
  searchTypeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    marginBottom: 12,
    padding: 2,
  },
  searchToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  searchToggleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  searchToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchToggleTextActive: {
    color: '#2E86AB',
    fontWeight: '600',
  },
  nearbyButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nearbyButtonDisabled: {
    opacity: 0.6,
  },
  nearbyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  mapToggleLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsContainer: {
    padding: 20,
  },
  mapContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  resultsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessHeader: {
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
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: 12,
    color: '#2E86AB',
    fontWeight: '600',
  },
  businessDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
    marginRight: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  locationStatusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
  },
});

export default SearchScreen;
