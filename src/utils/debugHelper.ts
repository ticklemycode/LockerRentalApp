/**
 * Debug utility functions for development and testing
 */

// Fixed coordinates for testing specific ZIP codes
type DebugCoordinates = {
  [zipCode: string]: { latitude: number; longitude: number };
};

export const DEBUG_COORDINATES: DebugCoordinates = {
  '30068': { latitude: 33.9427, longitude: -84.4407 }, // Marietta, GA
  '30308': { latitude: 33.7729, longitude: -84.3627 }, // Atlanta, GA
  '30307': { latitude: 33.7632, longitude: -84.3330 }, // Atlanta, GA (Inman Park)
  '30339': { latitude: 33.8781, longitude: -84.4680 }, // Atlanta, GA (The Battery)
  '73000': { latitude: 35.2226, longitude: -97.4395 }, // Oklahoma (not real ZIP)
};

export const getDebugCoordinates = (zipCode: string) => {
  return DEBUG_COORDINATES[zipCode] || null;
};

export default {
  DEBUG_COORDINATES,
  getDebugCoordinates
};
