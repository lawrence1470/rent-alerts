import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import * as dotenv from 'dotenv';
import '@testing-library/jest-dom';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/alerts',
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'test-user-123' }),
  currentUser: () => Promise.resolve({ id: 'test-user-123' }),
  useUser: () => ({ user: { id: 'test-user-123' } }),
  useAuth: () => ({ userId: 'test-user-123' }),
  SignedIn: ({ children }: any) => children,
  SignedOut: ({ children }: any) => children,
  UserButton: () => null,
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

beforeAll(() => {
  // Setup test database connection if needed
  console.log('🧪 Test suite starting...');
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup test database
  console.log('✅ Test suite complete');
});
