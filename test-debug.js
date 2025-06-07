const axios = require('axios');

// Debug coordinates for ZIP code 30068 (Marietta, GA)
const debugCoordinates = {
  latitude: 33.9427,
  longitude: -84.4407
};

// Base URL - update this to match your backend URL
const BASE_URL = 'http://192.168.1.180:3002';

async function testNearbySearch() {
  try {
    console.log(`Testing nearby businesses at coordinates [${debugCoordinates.latitude}, ${debugCoordinates.longitude}]...`);
    
    const response = await axios.get(`${BASE_URL}/businesses/nearby`, {
      params: {
        latitude: debugCoordinates.latitude,
        longitude: debugCoordinates.longitude,
        maxDistance: 40000 // 40km (25 miles) in meters
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Found ${response.data.length} businesses`);
    
    if (response.data.length > 0) {
      console.log('Businesses found:');
      response.data.forEach((business, index) => {
        console.log(`  ${index + 1}. ${business.name} (${business.address.zipCode})`);
        console.log(`     Coordinates: [${business.location.coordinates[1]}, ${business.location.coordinates[0]}]`);
        
        // Calculate distance (simplified version)
        const lat1 = debugCoordinates.latitude;
        const lon1 = debugCoordinates.longitude;
        const lat2 = business.location.coordinates[1];
        const lon2 = business.location.coordinates[0];
        
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        
        console.log(`     Distance: ${distance.toFixed(2)} km (${(distance/1.60934).toFixed(2)} miles)`);
      });
    } else {
      console.log('No businesses found within the radius');
    }
  } catch (error) {
    console.error('Error testing nearby businesses:');
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.message}`);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Run the test
testNearbySearch();
