export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  _id: string;
  name: string;
  description: string;
  businessType: 'restaurant' | 'grocery' | 'cafe' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  phoneNumber: string;
  email?: string;
  website?: string;
  images: string[];
  totalLockers: number;
  availableLockers: number;
  pricePerHour: number;
  amenities: string[];
  operatingHours: any;
  ownerId: string;
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  _id: string;
  userId: string;
  businessId: string;
  business?: Business;
  lockerNumber: string;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
  paymentId?: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  accessCode?: string;
  specialInstructions?: string;
  cancellationReason?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateBookingRequest {
  businessId: string;
  startTime: string;
  durationHours: number;
  specialInstructions?: string;
}

export interface SearchBusinessesRequest {
  latitude?: number;
  longitude?: number;
  radius?: number;
  zipCode?: string;
  businessType?: string;
  name?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}
