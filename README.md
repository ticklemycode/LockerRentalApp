# LockerRentalApp 🏠📱

A comprehensive React Native mobile application for renting lockers. Find, book, and manage locker rentals at various business locations with real-time availability, location-based search, and interactive maps.

## 🚀 Features

### 🔍 **Smart Search & Discovery**
- **Location-based search**: Find lockers near your current location
- **ZIP code search**: Search for lockers in specific areas
- **Business name search**: Find lockers at specific businesses
- **Interactive maps**: View locker locations on Google Maps with real-time availability

### 📅 **Booking Management**
- **Real-time booking**: Book lockers with date/time selection
- **Locker selection**: Choose from available lockers with visual grid
- **Booking history**: View all past and upcoming bookings
- **Status tracking**: Monitor booking status (confirmed, active, completed, cancelled)
- **Cancellation**: Cancel bookings (with time restrictions)

### 🗺️ **Location Services**
- **GPS integration**: Automatic location detection
- **Map integration**: Interactive Google Maps with business markers
- **Distance calculation**: Show distance to nearby locker locations
- **Address lookup**: Full address display for each location

### 👤 **User Experience**
- **Authentication**: Secure user registration and login
- **Profile management**: User profile and preferences
- **Real-time updates**: Live status updates and notifications
- **Responsive design**: Optimized for iOS and Android

## 📱 Screenshots & Demo

The app features a modern, intuitive interface with:
- Clean tab-based navigation (Home, Search, Bookings, Profile)
- Interactive search with location/ZIP code toggle
- Real-time map view with business markers
- Detailed booking management screens
- Professional booking confirmation flow

## 🛠️ Tech Stack

### **Frontend**
- **React Native 0.79.3** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation and routing
- **Redux Toolkit** - State management
- **React Native Maps** - Google Maps integration

### **Key Dependencies**
- `@react-navigation/native` & `@react-navigation/stack` - Navigation
- `@reduxjs/toolkit` & `react-redux` - State management
- `react-native-maps` - Map functionality
- `react-native-vector-icons` - Icons and UI elements
- `@react-native-community/geolocation` - Location services
- `axios` - HTTP client for API calls

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18)
- React Native CLI
- iOS: Xcode and CocoaPods
- Android: Android Studio and Android SDK

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ticklemycode/LockerRentalApp.git
   cd LockerRentalApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (iOS only)
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

### Running the App

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Start Metro (in a separate terminal)
```bash
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
API_BASE_URL=http://localhost:3000
API_TIMEOUT=10000

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Default Location (Atlanta)
DEFAULT_LATITUDE=33.7490
DEFAULT_LONGITUDE=-84.3880

# App Configuration
APP_ENV=development
DEBUG=true
```

### Google Maps Setup

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps SDK for iOS/Android
3. Add the key to your `.env` file

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BusinessMap.tsx  # Interactive map component
│   ├── ErrorBoundary.tsx
│   └── LoadingSpinner.tsx
├── navigation/          # Navigation configuration
├── screens/            # Main app screens
│   ├── HomeScreen.tsx
│   ├── SearchScreen.tsx
│   ├── BookingsScreen.tsx
│   └── BookingDetailsScreen.tsx
├── services/           # API and external services
│   ├── api.ts          # Main API service
│   └── locationService.ts
├── store/             # Redux store and slices
│   ├── authSlice.ts
│   ├── bookingSlice.ts
│   └── businessSlice.ts
├── types/             # TypeScript type definitions
└── utils/             # Helper functions and utilities
```

## 🔧 Development

### Available Scripts

- `npm start` - Start Metro bundler
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Key Features Implementation

#### Search Functionality
- **Dual search modes**: Location-based (GPS) and manual search (ZIP/business name)
- **Real-time results**: Instant search results with loading states
- **Map integration**: Automatic map display when results are found

#### Booking System
- **Date/time selection**: Custom date and time pickers
- **Locker availability**: Real-time availability checking
- **Pricing calculation**: Dynamic pricing based on duration
- **Confirmation flow**: Multi-step booking confirmation

#### State Management
- **Redux Toolkit**: Centralized state management
- **Async actions**: API calls with loading and error states
- **Persistent data**: User sessions and booking history

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build issues**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

### Debug Features

The app includes debug helpers for development:
- Location debugging in SearchScreen
- API response logging
- State debugging utilities

## 📄 License

This project is private. All rights reserved.

## 🤝 Contributing

This is a private project. Contact the maintainer for contribution guidelines.

---

**Built with ❤️ using React Native and TypeScript**
