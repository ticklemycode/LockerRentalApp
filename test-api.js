// Test script to verify API endpoint changes
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testZipCodeSearch() {
  console.log('Starting API test...');
  
  try {
    console.log('Testing ZIP code search API...');
    
    const response = await axios.get(`${BASE_URL}/businesses/search`, {
      params: { zipCode: '30308' }
    });
    
    console.log('Response status:', response.status);
    console.log('Number of businesses found:', response.data.length);
    
    if (response.data.length > 0) {
      const firstBusiness = response.data[0];
      console.log('First business:', firstBusiness.name);
      console.log('Coordinates:', firstBusiness.location.coordinates);
      console.log('Address:', firstBusiness.address);
      
      // Check if coordinates are in Atlanta area
      const [lng, lat] = firstBusiness.location.coordinates;
      if (lat > 33.0 && lat < 34.0 && lng > -85.0 && lng < -84.0) {
        console.log('✅ Coordinates are in Atlanta area!');
      } else {
        console.log('❌ Coordinates are NOT in Atlanta area!');
      }
    }
    
  } catch (error) {
    console.error('API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

console.log('About to run test...');
testZipCodeSearch().then(() => {
  console.log('Test completed.');
}).catch((err) => {
  console.error('Test error:', err);
});
