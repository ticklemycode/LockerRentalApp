import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Business } from '../types';

interface BusinessMapProps {
  businesses: Business[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  onBusinessPress?: (business: Business) => void;
  height?: number;
  centerOnNearestBusiness?: boolean; // When true, prioritize centering on nearest business over showing both user and business
  showUserAndNearestBusiness?: boolean; // When true, zoom out to show both user location and nearest business
}

const BusinessMap: React.FC<BusinessMapProps> = ({
  businesses,
  userLocation,
  onBusinessPress,
  height = 300,
  centerOnNearestBusiness = false,
  showUserAndNearestBusiness = false,
}) => {
  // Atlanta region coordinates - centered on downtown Atlanta
  const atlantaRegion: Region = {
    latitude: 33.7490, // Atlanta downtown latitude
    longitude: -84.3880, // Atlanta downtown longitude
    latitudeDelta: 0.0922, // Zoom level for metro area
    longitudeDelta: 0.0421,
  };

  const [region, setRegion] = useState<Region>(atlantaRegion);
  const mapRef = useRef<MapView>(null);

  // Calculate region that encompasses both user location and nearest business
  const calculateOptimalRegion = (
    userLoc: { latitude: number; longitude: number },
    nearestBusiness: Business
  ): Region => {
    const businessLat = nearestBusiness.location.coordinates[1]; // MongoDB stores as [longitude, latitude]
    const businessLng = nearestBusiness.location.coordinates[0];
    
    console.log('CALC_REGION: Input data:', {
      userLat: userLoc.latitude,
      userLng: userLoc.longitude,
      businessLat,
      businessLng,
      businessName: nearestBusiness.name
    });
    
    // Calculate the center point between user and nearest business
    const centerLat = (userLoc.latitude + businessLat) / 2;
    const centerLng = (userLoc.longitude + businessLng) / 2;
    
    // Calculate the distance between points to determine zoom level
    const latDiff = Math.abs(userLoc.latitude - businessLat);
    const lngDiff = Math.abs(userLoc.longitude - businessLng);
    
    console.log('CALC_REGION: Calculated differences:', {
      centerLat,
      centerLng,
      latDiff,
      lngDiff
    });
    
    // Add generous padding around the points to ensure both are clearly visible
    const paddingFactor = 2.5; // 150% extra space around the bounds for better visibility
    const minDelta = 0.05; // Larger minimum zoom level to ensure visibility of both points
    
    // If the points are very close together, use minimum delta
    // If they're far apart, use calculated delta with padding
    const latitudeDelta = Math.max(latDiff * paddingFactor, minDelta);
    const longitudeDelta = Math.max(lngDiff * paddingFactor, minDelta);
    
    const result = {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta,
      longitudeDelta,
    };
    
    console.log('CALC_REGION: Final result:', result);
    console.log('CALC_REGION: This should show both user location and business marker');
    return result;
  };

  useEffect(() => {
    console.log('=== BusinessMap useEffect triggered - v9 ===');
    console.log('Props received:', { 
      userLocation, 
      businessesCount: businesses.length,
      centerOnNearestBusiness,
      showUserAndNearestBusiness,
      firstBusinessCoords: businesses.length > 0 ? businesses[0].location.coordinates : null,
      firstBusinessName: businesses.length > 0 ? businesses[0].name : null,
      timestamp: new Date().toISOString()
    });
    
    console.log('Current region state before logic:', region);

    // DEFAULT BEHAVIOR: If we have both user location and businesses, 
    // ALWAYS zoom out to show both user location and nearest business
    if (userLocation && businesses.length > 0) {
      console.log('=== CONDITION MET: Both userLocation and businesses exist ===');
      const nearestBusiness = businesses[0]; // First business should be nearest (sorted by distance)
      const businessLat = nearestBusiness.location.coordinates[1];
      const businessLng = nearestBusiness.location.coordinates[0];
      
      console.log('=== DETAILED LOCATION DATA ===');
      console.log('User Location Details:', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        type: typeof userLocation.latitude,
        isValid: !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)
      });
      console.log('Business Location Details:', {
        name: nearestBusiness.name,
        latitude: businessLat,
        longitude: businessLng,
        rawCoordinates: nearestBusiness.location.coordinates,
        type: typeof businessLat,
        isValid: !isNaN(businessLat) && !isNaN(businessLng)
      });
      
      const optimalRegion = calculateOptimalRegion(userLocation, nearestBusiness);
      console.log('=== SETTING OPTIMAL REGION ===');
      console.log('Calculated optimal region:', JSON.stringify(optimalRegion, null, 2));
      console.log('About to call setRegion AND animateToRegion with optimal region');
      setRegion(optimalRegion);
      // Also animate the map to the new region for immediate visual feedback
      setTimeout(() => {
        if (mapRef.current) {
          console.log('Animating map to optimal region');
          mapRef.current.animateToRegion(optimalRegion, 1000);
        }
      }, 100);
      console.log('setRegion and animation setup completed');
      return;
    }

    // Priority 2: Use user location if available but no businesses
    if (userLocation) {
      console.log('=== CONDITION MET: User location only (no businesses) ===');
      console.log('Setting region to user location:', userLocation);
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      console.log('New region from user location:', newRegion);
      console.log('About to call setRegion with user location:', JSON.stringify(newRegion));
      setRegion(newRegion);
      console.log('setRegion called with user location successfully');
      return;
    }

    // Priority 3: If no user location but there are businesses (e.g. from ZIP code search),
    // center map on the first business
    if (businesses.length > 0) {
      console.log('=== CONDITION MET: Businesses only (no user location) ===');
      const firstBusiness = businesses[0];
      const businessLat = firstBusiness.location.coordinates[1]; // MongoDB stores as [longitude, latitude]
      const businessLng = firstBusiness.location.coordinates[0];
      
      console.log('Setting region to first business location:', { 
        businessLat, 
        businessLng, 
        businessName: firstBusiness.name,
        fullAddress: firstBusiness.address 
      });
      
      const newRegion = {
        latitude: businessLat,
        longitude: businessLng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      console.log('New region from first business:', newRegion);
      setRegion(newRegion);
      return;
    }

    // Priority 4: Default to Atlanta if no user location and no businesses
    console.log('=== DEFAULT CONDITION: Using Atlanta fallback ===');
    console.log('No user location and no businesses, using Atlanta region');
    console.log('Default region:', atlantaRegion);
    setRegion(atlantaRegion);
  }, [userLocation, businesses, centerOnNearestBusiness, showUserAndNearestBusiness]);

  const handleMarkerPress = (business: Business) => {
    if (onBusinessPress) {
      onBusinessPress(business);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={atlantaRegion}
        region={region}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={!!userLocation}
        followsUserLocation={false}
        showsCompass={true}
        showsScale={true}
        onRegionChange={(newRegion) => {
          console.log('MapView region changed to:', newRegion);
        }}
        onRegionChangeComplete={(newRegion) => {
          console.log('MapView region change complete:', newRegion);
        }}
      >
        {/* Render user location marker manually for better visibility */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="You are here"
            pinColor="blue"
            identifier="user-location"
          />
        )}
        
        {/* Render business markers */}
        {businesses.map((business) => {
          console.log('Rendering marker for business:', business.name, 'at coordinates:', {
            latitude: business.location.coordinates[1],
            longitude: business.location.coordinates[0],
          });
          return (
            <Marker
              key={business._id}
              coordinate={{
                latitude: business.location.coordinates[1],
                longitude: business.location.coordinates[0],
              }}
              title={business.name}
              description={`${business.availableLockers} lockers available`}
              onPress={() => handleMarkerPress(business)}
              pinColor="red"
            />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default BusinessMap;