import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { DEBUG_COORDINATES } from '../utils/debugHelper';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationError {
  code: number;
  message: string;
}

class LocationService {
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Locker Rental Location Permission',
            message: 'Locker Rental needs access to your location to find nearby businesses.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
    return true; // iOS permissions are handled in Info.plist
  }

  getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      // For development/simulator testing, provide a fallback location
      if (__DEV__) {
        console.log('LOCATION_SERVICE: Running in development mode');
        
        // Try to get real location first
        Geolocation.getCurrentPosition(
          (position) => {
            console.log('LOCATION_SERVICE: Real location obtained:', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            console.log('LOCATION_SERVICE: Real location failed, using fallback. Error:', error);
            
            // Provide a fallback location in Atlanta for testing
            const fallbackLocation = {
              latitude: 33.7490,  // Atlanta downtown
              longitude: -84.3880,
              accuracy: 100,
            };
            
            console.log('LOCATION_SERVICE: Using fallback location:', fallbackLocation);
            resolve(fallbackLocation);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,  // Reduced timeout for faster fallback
            maximumAge: 10000,
          }
        );
      } else {
        // Production mode - require real location
        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            reject({
              code: error.code,
              message: this.getLocationErrorMessage(error.code),
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      }
    });
  }

  watchLocation(
    onLocationUpdate: (location: Location) => void,
    onError: (error: LocationError) => void
  ): number {
    return Geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        onError({
          code: error.code,
          message: this.getLocationErrorMessage(error.code),
        });
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
      }
    );
  }

  clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
  }

  private getLocationErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied. Please enable location permissions in settings.';
      case 2:
        return 'Unable to determine location. Please check your GPS/network connection.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown location error occurred.';
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getLocationWithPermission(): Promise<Location> {
    const hasPermission = await this.requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return this.getCurrentLocation();
  }

  showLocationErrorAlert(error: LocationError): void {
    Alert.alert(
      'Location Error',
      error.message,
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Settings',
          style: 'default',
          onPress: () => {
            // In a real app, you might want to open device settings
            console.log('Open settings to enable location');
          },
        },
      ]
    );
  }
  
  // Use this method for testing specific ZIP code locations in dev mode
  getDebugLocation(zipCode: string): Location | null {
    if (__DEV__ && DEBUG_COORDINATES[zipCode]) {
      console.log(`LocationService: Using debug coordinates for ZIP code ${zipCode}`);
      return DEBUG_COORDINATES[zipCode];
    }
    return null;
  }
}

export default new LocationService();
