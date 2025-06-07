import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import BusinessDetailsScreen from '../screens/BusinessDetailsScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  BookingDetails: { bookingId: string };
  BusinessDetails: { businessId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E86AB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Authenticated routes
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="BookingDetails" 
              component={BookingDetailsScreen}
              options={{ title: 'Booking Details' }}
            />
            <Stack.Screen 
              name="BusinessDetails" 
              component={BusinessDetailsScreen}
              options={{ title: 'Business Details' }}
            />
          </>
        ) : (
          // Unauthenticated routes
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ title: 'Create Account' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
