/**
 * API Tests for Plans Endpoint
 * Tests the pricing plans API that returns available subscription tiers
 */

import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/plans/route';

// Mock the stripe config
vi.mock('@/lib/stripe-config', () => ({
  TIER_CONFIG: {
    '1hour': {
      id: '1hour',
      name: 'Hourly Checks (Free)',
      pricePerWeek: 0,
      interval: '1 hour',
      checksPerDay: 24,
    },
    '1hour-sms': {
      id: '1hour-sms',
      name: 'Hourly Checks + SMS',
      pricePerWeek: 500,
      interval: '1 hour',
      checksPerDay: 24,
    },
    '30min': {
      id: '30min',
      name: '30-Minute Checks',
      pricePerWeek: 1500,
      interval: '30 minutes',
      checksPerDay: 48,
    },
    '15min': {
      id: '15min',
      name: '15-Minute Checks (Premium)',
      pricePerWeek: 2000,
      interval: '15 minutes',
      checksPerDay: 96,
    },
  },
  formatPrice: (cents: number) => `$${(cents / 100).toFixed(2)}`,
}));

describe('Plans API - GET /api/plans', () => {
  it('should return all available plans', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.plans).toHaveLength(4);
    expect(response.body.totalCount).toBe(4);
  });

  it('should return plans with correct structure', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);

    const plan = response.body.plans[0];
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('pricePerWeek');
    expect(plan).toHaveProperty('priceFormatted');
    expect(plan).toHaveProperty('interval');
    expect(plan).toHaveProperty('checksPerDay');
    expect(plan).toHaveProperty('isFree');
  });

  it('should return free tier with price 0', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);

    const freePlan = response.body.plans.find((p: any) => p.id === '1hour');
    expect(freePlan).toBeDefined();
    expect(freePlan.pricePerWeek).toBe(0);
    expect(freePlan.priceFormatted).toBe('$0.00');
    expect(freePlan.isFree).toBe(true);
    expect(freePlan.name).toContain('Free');
  });

  it('should return paid tiers with correct prices', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);

    const thirtyMinPlan = response.body.plans.find((p: any) => p.id === '30min');
    expect(thirtyMinPlan).toBeDefined();
    expect(thirtyMinPlan.pricePerWeek).toBe(1500);
    expect(thirtyMinPlan.priceFormatted).toBe('$15.00');
    expect(thirtyMinPlan.isFree).toBe(false);

    const fifteenMinPlan = response.body.plans.find((p: any) => p.id === '15min');
    expect(fifteenMinPlan).toBeDefined();
    expect(fifteenMinPlan.pricePerWeek).toBe(2000);
    expect(fifteenMinPlan.priceFormatted).toBe('$20.00');
    expect(fifteenMinPlan.isFree).toBe(false);
  });

  it('should include SMS plan', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);

    const smsPlan = response.body.plans.find((p: any) => p.id === '1hour-sms');
    expect(smsPlan).toBeDefined();
    expect(smsPlan.name).toContain('SMS');
    expect(smsPlan.pricePerWeek).toBe(500);
    expect(smsPlan.priceFormatted).toBe('$5.00');
    expect(smsPlan.checksPerDay).toBe(24);
    expect(smsPlan.isFree).toBe(false);
  });

  it('should have correct check frequencies', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);

    const plans = response.body.plans;

    const hourlyPlan = plans.find((p: any) => p.id === '1hour');
    expect(hourlyPlan.interval).toBe('1 hour');
    expect(hourlyPlan.checksPerDay).toBe(24);

    const thirtyMinPlan = plans.find((p: any) => p.id === '30min');
    expect(thirtyMinPlan.interval).toBe('30 minutes');
    expect(thirtyMinPlan.checksPerDay).toBe(48);

    const fifteenMinPlan = plans.find((p: any) => p.id === '15min');
    expect(fifteenMinPlan.interval).toBe('15 minutes');
    expect(fifteenMinPlan.checksPerDay).toBe(96);
  });

  it('should mark only free tier as isFree', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);

    const plans = response.body.plans;
    const freePlans = plans.filter((p: any) => p.isFree);
    const paidPlans = plans.filter((p: any) => !p.isFree);

    expect(freePlans).toHaveLength(1);
    expect(freePlans[0].id).toBe('1hour');
    expect(paidPlans).toHaveLength(3);
  });

  it('should return plans in consistent order', async () => {
    const response1 = await mockApiCall('GET', '/api/plans');
    const response2 = await mockApiCall('GET', '/api/plans');

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    const ids1 = response1.body.plans.map((p: any) => p.id);
    const ids2 = response2.body.plans.map((p: any) => p.id);

    expect(ids1).toEqual(ids2);
  });

  it('should format all prices correctly', async () => {
    const response = await mockApiCall('GET', '/api/plans');

    expect(response.status).toBe(200);

    const plans = response.body.plans;

    plans.forEach((plan: any) => {
      expect(plan.priceFormatted).toMatch(/^\$\d+\.\d{2}$/);

      // Verify formatted price matches pricePerWeek
      const expectedFormatted = `$${(plan.pricePerWeek / 100).toFixed(2)}`;
      expect(plan.priceFormatted).toBe(expectedFormatted);
    });
  });
});

// Helper function to simulate API calls
async function mockApiCall(method: string, path: string) {
  const request = new Request(`http://localhost${path}`, {
    method,
  });

  let response;

  if (method === 'GET') {
    response = await GET();
  } else {
    throw new Error(`Unsupported method: ${method} ${path}`);
  }

  const data = await response.json();
  return {
    status: response.status,
    body: data,
  };
}
