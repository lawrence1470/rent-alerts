import { beforeAll, afterAll, afterEach } from 'vitest';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

beforeAll(() => {
  // Setup test database connection if needed
  console.log('🧪 Test suite starting...');
});

afterEach(() => {
  // Clean up after each test
});

afterAll(() => {
  // Cleanup test database
  console.log('✅ Test suite complete');
});
