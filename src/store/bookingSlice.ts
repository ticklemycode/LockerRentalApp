import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, CreateBookingRequest } from '../types';
import ApiService from '../services/api';

interface BookingState {
  bookings: Booking[];
  activeBookings: Booking[];
  selectedBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  activeBookings: [],
  selectedBooking: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData: CreateBookingRequest, { rejectWithValue }) => {
    try {
      const booking = await ApiService.createBooking(bookingData);
      return booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const fetchUserBookings = createAsyncThunk(
  'booking/fetchUserBookings',
  async (params: { status?: string; page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const bookings = await ApiService.getUserBookings(params);
      return bookings;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchActiveBookings = createAsyncThunk(
  'booking/fetchActiveBookings',
  async (_, { rejectWithValue }) => {
    try {
      const bookings = await ApiService.getUserBookings({ status: 'active' });
      return bookings;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active bookings');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'booking/updateBookingStatus',
  async ({ id, status, cancellationReason }: { id: string; status: string; cancellationReason?: string }, { rejectWithValue }) => {
    try {
      const booking = await ApiService.updateBookingStatus(id, status, cancellationReason);
      return booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const booking = await ApiService.cancelBooking(bookingId);
      return booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const checkInToLocker = createAsyncThunk(
  'booking/checkInToLocker',
  async ({ id, accessCode }: { id: string; accessCode: string }, { rejectWithValue }) => {
    try {
      const booking = await ApiService.checkInToLocker(id, accessCode);
      return booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check in');
    }
  }
);

export const checkOutFromLocker = createAsyncThunk(
  'booking/checkOutFromLocker',
  async (id: string, { rejectWithValue }) => {
    try {
      const booking = await ApiService.checkOutFromLocker(id);
      return booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check out');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => {
      state.selectedBooking = action.payload;
    },
    clearBookings: (state) => {
      state.bookings = [];
      state.activeBookings = [];
      state.selectedBooking = null;
    },
  },
  extraReducers: (builder) => {
    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings.unshift(action.payload);
        if (action.payload.status === 'active') {
          state.activeBookings.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user bookings
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch active bookings
    builder
      .addCase(fetchActiveBookings.fulfilled, (state, action) => {
        state.activeBookings = action.payload;
      });

    // Update booking status
    builder
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        const activeIndex = state.activeBookings.findIndex(b => b._id === action.payload._id);
        if (action.payload.status === 'active' && activeIndex === -1) {
          state.activeBookings.push(action.payload);
        } else if (action.payload.status !== 'active' && activeIndex !== -1) {
          state.activeBookings.splice(activeIndex, 1);
        } else if (activeIndex !== -1) {
          state.activeBookings[activeIndex] = action.payload;
        }

        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      });

    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        const activeIndex = state.activeBookings.findIndex(b => b._id === action.payload._id);
        if (activeIndex !== -1) {
          state.activeBookings.splice(activeIndex, 1);
        }

        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check in/out
    builder
      .addCase(checkInToLocker.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        const activeIndex = state.activeBookings.findIndex(b => b._id === action.payload._id);
        if (activeIndex !== -1) {
          state.activeBookings[activeIndex] = action.payload;
        }

        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      })
      .addCase(checkOutFromLocker.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        const activeIndex = state.activeBookings.findIndex(b => b._id === action.payload._id);
        if (activeIndex !== -1) {
          state.activeBookings.splice(activeIndex, 1);
        }

        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      });
  },
});

export const { clearError, setSelectedBooking, clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
