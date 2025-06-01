const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.K0h_g0gySdBJp6rxGeI6FOi8uLfBtF5kl7ND0Yxs-zI';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const options = {
    hostname: 'lcoxtanyckjzyxxcsjzz.supabase.co',
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', reject);
    req.end();
  });
}

testConnection()
  .then(success => {
    if (success) {
      console.log('✅ Connection successful!');
      console.log('\nTo apply migrations:');
      console.log('1. Go to: https://app.supabase.com/project/lcoxtanyckjzyxxcsjzz/editor');
      console.log('2. Paste the content from sprint4_combined.sql');
      console.log('3. Click Run');
    }
  })
  .catch(err => console.error('❌ Connection failed:', err));
