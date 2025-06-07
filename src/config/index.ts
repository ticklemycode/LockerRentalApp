interface Config {
  API_BASE_URL: string;
  GOOGLE_MAPS_API_KEY: string;
  DEFAULT_LOCATION: {
    latitude: number;
    longitude: number;
  };
  APP_CONFIG: {
    MAX_RENTAL_HOURS: number;
    BOOKING_BUFFER_MINUTES: number;
    SEARCH_RADIUS_KM: number;
  };
}

const developmentConfig: Config = {
  API_BASE_URL: 'http://localhost:3002',
  GOOGLE_MAPS_API_KEY: 'your-google-maps-api-key-here',
  DEFAULT_LOCATION: {
    latitude: 33.7490, // Atlanta
    longitude: -84.3880,
  },
  APP_CONFIG: {
    MAX_RENTAL_HOURS: 10,
    BOOKING_BUFFER_MINUTES: 15,
    SEARCH_RADIUS_KM: 40, // 25 miles
  },
};

const productionConfig: Config = {
  API_BASE_URL: 'https://your-production-api.com',
  GOOGLE_MAPS_API_KEY: 'your-production-google-maps-api-key',
  DEFAULT_LOCATION: {
    latitude: 33.7490, // Atlanta
    longitude: -84.3880,
  },
  APP_CONFIG: {
    MAX_RENTAL_HOURS: 10,
    BOOKING_BUFFER_MINUTES: 15,
    SEARCH_RADIUS_KM: 40, // 25 miles
  },
};

const config = __DEV__ ? developmentConfig : productionConfig;

export default config;
