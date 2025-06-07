import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
import {
  User,
  Business,
  Booking,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CreateBookingRequest,
  SearchBusinessesRequest,
} from '../types';

const BASE_URL = __DEV__ ? 'http://192.168.1.180:3002' : 'https://your-production-api.com';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, logout user
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          // You can dispatch a logout action here if using Redux
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/profile');
    return response.data;
  }

  // Business endpoints
  async searchBusinesses(params: SearchBusinessesRequest): Promise<Business[]> {
    try {
      console.log('API: Making search request with params:', params);
      console.log('API: Request URL will be:', `${BASE_URL}/businesses/search`);
      console.log('API: BASE_URL is:', BASE_URL);
      console.log('API: __DEV__ is:', __DEV__);
      
      const response: AxiosResponse<Business[]> = await this.api.get('/businesses/search', {
        params,
      });
      
      console.log('API: Search response received:', {
        status: response.status,
        dataLength: response.data.length,
        firstBusinessCoords: response.data.length > 0 ? response.data[0].location.coordinates : null,
        firstBusinessName: response.data.length > 0 ? response.data[0].name : null
      });
      
      return response.data;
    } catch (error: any) {
      console.error('API: Search businesses error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
        params: error.config?.params
      });
      console.error('API: Full error object:', error);
      throw error;
    }
  }

  async getBusinessById(id: string): Promise<Business> {
    const response: AxiosResponse<Business> = await this.api.get(`/businesses/${id}`);
    return response.data;
  }

  async getNearbyBusinesses(latitude: number, longitude: number, radius: number = config.APP_CONFIG.SEARCH_RADIUS_KM): Promise<Business[]> {
    console.log(`ApiService: Requesting nearby businesses at [${latitude}, ${longitude}] with radius ${radius}km`);
    try {
      const response: AxiosResponse<Business[]> = await this.api.get('/businesses/nearby', {
        params: { latitude, longitude, radius }
      });
      console.log(`ApiService: Received ${response.data.length} businesses from API`);
      return response.data;
    } catch (error: any) {
      console.error('ApiService: Error in getNearbyBusinesses:', error);
      console.error('ApiService: Request URL:', this.api.defaults.baseURL + '/businesses/nearby');
      console.error('ApiService: Request params:', { latitude, longitude, radius });
      throw error;
    }
  }

  // Booking endpoints
  async createBooking(bookingData: CreateBookingRequest): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.post('/bookings', bookingData);
    return response.data;
  }

  async getUserBookings(params: { status?: string; page?: number; limit?: number } = {}): Promise<Booking[]> {
    const response: AxiosResponse<Booking[]> = await this.api.get('/bookings/my-bookings', { params });
    return response.data;
  }

  async getBookingById(id: string): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.get(`/bookings/${id}`);
    return response.data;
  }

  async updateBookingStatus(id: string, status: string, cancellationReason?: string): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.patch(`/bookings/${id}/status`, {
      status,
      cancellationReason,
    });
    return response.data;
  }

  async cancelBooking(id: string, cancellationReason?: string): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.delete(`/bookings/${id}/cancel`, {
      data: { cancellationReason }
    });
    return response.data;
  }

  async checkInToLocker(id: string, accessCode: string): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.post(`/bookings/${id}/checkin`, {
      accessCode,
    });
    return response.data;
  }

  async checkOutFromLocker(id: string): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.post(`/bookings/${id}/checkout`);
    return response.data;
  }

  // User endpoints
  async updateUserProfile(userData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }): Promise<User> {
    const response: AxiosResponse<User> = await this.api.patch('/users/profile', userData);
    return response.data;
  }
}

export default new ApiService();
