import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Business, SearchBusinessesRequest } from '../types';
import ApiService from '../services/api';
import config from '../config';

interface BusinessState {
  businesses: Business[];
  selectedBusiness: Business | null;
  nearbyBusinesses: Business[];
  isLoading: boolean;
  error: string | null;
  searchParams: SearchBusinessesRequest | null;
}

const initialState: BusinessState = {
  businesses: [],
  selectedBusiness: null,
  nearbyBusinesses: [],
  isLoading: false,
  error: null,
  searchParams: null,
};

// Async thunks
export const searchBusinesses = createAsyncThunk(
  'business/searchBusinesses',
  async (params: SearchBusinessesRequest, { rejectWithValue }) => {
    try {
      console.log('Redux: Starting searchBusinesses with params:', params);
      const businesses = await ApiService.searchBusinesses(params);
      console.log('Redux: searchBusinesses completed, received businesses:', businesses.length);
      console.log('Redux: Businesses data:', businesses);
      console.log('Redux: About to return payload:', { businesses, params });
      return { businesses, params };
    } catch (error: any) {
      console.error('Redux: searchBusinesses failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        baseURL: error.config?.baseURL
      });
      
      // More specific error message
      let errorMessage = 'Search failed';
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network connection failed. Check if backend is running.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Check backend logs.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchNearbyBusinesses = createAsyncThunk(
  'business/fetchNearbyBusinesses',
  async ({ latitude, longitude, radius }: { latitude: number; longitude: number; radius?: number }, { rejectWithValue }) => {
    try {
      console.log(`BusinessSlice: Fetching nearby businesses at [${latitude}, ${longitude}] with radius ${radius}km`);
      
      // Log the API call parameters
      console.log('API call parameters:', {
        latitude,
        longitude,
        radius: radius || config.APP_CONFIG.SEARCH_RADIUS_KM
      });
      
      const businesses = await ApiService.getNearbyBusinesses(latitude, longitude, radius);
      
      console.log(`BusinessSlice: Found ${businesses.length} nearby businesses`);
      
      // Log some information about the businesses for debugging
      if (businesses.length > 0) {
        console.log('First business:', {
          name: businesses[0].name,
          coordinates: businesses[0].location.coordinates,
          zipCode: businesses[0].address.zipCode
        });
      } else {
        console.log('No businesses found in the API response');
      }
      
      return businesses;
    } catch (error: any) {
      console.error('BusinessSlice: Error fetching nearby businesses:', error);
      
      // Enhanced error logging
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        baseURL: error.config?.baseURL,
      });
      
      let errorMessage = 'Failed to fetch nearby businesses';
      
      if (!error.response) {
        errorMessage = 'Network connection failed. Check if backend is running.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Check backend logs.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchBusinessById = createAsyncThunk(
  'business/fetchBusinessById',
  async (id: string, { rejectWithValue }) => {
    try {
      const business = await ApiService.getBusinessById(id);
      return business;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch business');
    }
  }
);

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedBusiness: (state, action: PayloadAction<Business | null>) => {
      state.selectedBusiness = action.payload;
    },
    clearBusinesses: (state) => {
      state.businesses = [];
      state.nearbyBusinesses = [];
      state.selectedBusiness = null;
      state.searchParams = null;
    },
  },
  extraReducers: (builder) => {
    // Search businesses
    builder
      .addCase(searchBusinesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchBusinesses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.businesses = action.payload.businesses;
        state.searchParams = action.payload.params;
        state.error = null;
      })
      .addCase(searchBusinesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch nearby businesses
    builder
      .addCase(fetchNearbyBusinesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyBusinesses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyBusinesses = action.payload;
        state.error = null;
      })
      .addCase(fetchNearbyBusinesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch business by ID
    builder
      .addCase(fetchBusinessById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinessById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedBusiness = action.payload;
        state.error = null;
      })
      .addCase(fetchBusinessById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedBusiness, clearBusinesses } = businessSlice.actions;
export default businessSlice.reducer;
