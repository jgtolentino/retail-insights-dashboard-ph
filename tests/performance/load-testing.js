/**
 * Load Testing Script for Retail Insights Dashboard
 * Tests performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const dashboardLoadTime = new Trend('dashboard_load_time');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    // Ramp-up
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete within 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],
    response_time: ['p(95)<2000'],
    dashboard_load_time: ['p(95)<3000'],
    api_response_time: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.TEST_URL || 'http://localhost:4173';
const API_BASE = __ENV.API_URL || `${BASE_URL}/api`;

// Test data and scenarios
const testScenarios = [
  { name: 'main_dashboard', weight: 40 },
  { name: 'consumer_insights', weight: 25 },
  { name: 'api_calls', weight: 20 },
  { name: 'filters_and_search', weight: 15 },
];

export default function () {
  const scenario = selectScenario();
  
  switch (scenario) {
    case 'main_dashboard':
      testMainDashboard();
      break;
    case 'consumer_insights':
      testConsumerInsights();
      break;
    case 'api_calls':
      testApiEndpoints();
      break;
    case 'filters_and_search':
      testFiltersAndSearch();
      break;
  }
  
  sleep(Math.random() * 3 + 1); // Random think time 1-4 seconds
}

function selectScenario() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const scenario of testScenarios) {
    cumulative += scenario.weight;
    if (rand <= cumulative) {
      return scenario.name;
    }
  }
  
  return testScenarios[0].name;
}

function testMainDashboard() {
  const startTime = new Date().getTime();
  
  // Load main dashboard
  const response = http.get(BASE_URL, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'k6-load-test/1.0',
    },
    tags: { test_type: 'main_dashboard' },
  });
  
  const success = check(response, {
    'main dashboard loads successfully': (r) => r.status === 200,
    'main dashboard contains dashboard content': (r) => r.body.includes('dashboard'),
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  dashboardLoadTime.add(new Date().getTime() - startTime);
  
  // Load dashboard data
  testDashboardAPI();
}

function testConsumerInsights() {
  const startTime = new Date().getTime();
  
  // Load consumer insights page
  const response = http.get(`${BASE_URL}/consumer-insights`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'k6-load-test/1.0',
    },
    tags: { test_type: 'consumer_insights' },
  });
  
  const success = check(response, {
    'consumer insights loads successfully': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  dashboardLoadTime.add(new Date().getTime() - startTime);
  
  // Test age distribution API
  testAgeDistributionAPI();
  sleep(1);
  
  // Test gender distribution API
  testGenderDistributionAPI();
}

function testApiEndpoints() {
  const endpoints = [
    '/api/dashboard',
    '/api/time-series',
    '/api/brands',
    '/api/health',
  ];
  
  for (const endpoint of endpoints) {
    const startTime = new Date().getTime();
    
    const response = http.get(`${API_BASE}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      tags: { test_type: 'api_call', endpoint },
    });
    
    const success = check(response, {
      [`${endpoint} responds successfully`]: (r) => r.status === 200,
      [`${endpoint} response time < 1s`]: (r) => r.timings.duration < 1000,
      [`${endpoint} returns JSON`]: (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!success);
    apiResponseTime.add(response.timings.duration);
    
    sleep(0.5);
  }
}

function testFiltersAndSearch() {
  // Test with various filter combinations
  const filterCombinations = [
    '?timeRange=7d',
    '?timeRange=30d',
    '?startDate=2025-05-01&endDate=2025-05-31',
    '?brands=Brand1,Brand2',
    '?categories=Electronics,Clothing',
  ];
  
  for (const filters of filterCombinations) {
    const response = http.get(`${BASE_URL}${filters}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      tags: { test_type: 'filtered_dashboard' },
    });
    
    const success = check(response, {
      'filtered dashboard loads': (r) => r.status === 200,
      'filter response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
    
    sleep(1);
  }
}

function testDashboardAPI() {
  const response = http.get(`${API_BASE}/dashboard?timeRange=7d`, {
    headers: { 'Accept': 'application/json' },
    tags: { test_type: 'dashboard_api' },
  });
  
  const success = check(response, {
    'dashboard API responds': (r) => r.status === 200,
    'dashboard API has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.totalRevenue !== undefined && data.totalTransactions !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  apiResponseTime.add(response.timings.duration);
}

function testAgeDistributionAPI() {
  const response = http.post(`${API_BASE}/rpc/get_age_distribution`, 
    JSON.stringify({
      start_date: '2025-05-01T00:00:00Z',
      end_date: '2025-05-31T23:59:59Z',
      bucket_size: 10
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      tags: { test_type: 'age_distribution_api' },
    }
  );
  
  const success = check(response, {
    'age distribution API responds': (r) => r.status === 200,
    'age distribution has data structure': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  apiResponseTime.add(response.timings.duration);
}

function testGenderDistributionAPI() {
  const response = http.post(`${API_BASE}/rpc/get_gender_distribution`, 
    JSON.stringify({
      start_date: '2025-05-01T00:00:00Z',
      end_date: '2025-05-31T23:59:59Z'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      tags: { test_type: 'gender_distribution_api' },
    }
  );
  
  const success = check(response, {
    'gender distribution API responds': (r) => r.status === 200,
  });
  
  errorRate.add(!success);
  apiResponseTime.add(response.timings.duration);
}

// Stress test scenario
export function stressTest() {
  // High load scenario
  const responses = http.batch([
    ['GET', BASE_URL, null, { tags: { test_type: 'stress_main' } }],
    ['GET', `${BASE_URL}/consumer-insights`, null, { tags: { test_type: 'stress_insights' } }],
    ['GET', `${API_BASE}/dashboard`, null, { tags: { test_type: 'stress_api' } }],
    ['GET', `${API_BASE}/time-series`, null, { tags: { test_type: 'stress_timeseries' } }],
  ]);
  
  for (const response of responses) {
    const success = check(response, {
      'stress test request succeeds': (r) => r.status === 200,
      'stress test response time acceptable': (r) => r.timings.duration < 5000,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  }
}

// Spike test scenario  
export function spikeTest() {
  // Sudden high load
  for (let i = 0; i < 10; i++) {
    const response = http.get(BASE_URL, {
      tags: { test_type: 'spike_test' },
    });
    
    check(response, {
      'spike test handles load': (r) => r.status === 200,
    });
  }
}