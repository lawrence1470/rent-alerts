# Testing Guide for Rent Notifications App

## Overview

We have a comprehensive testing setup that covers:
- **Unit Tests**: Individual component testing
- **Integration Tests**: API and service testing
- **E2E Tests**: Complete user workflow testing

## Test Structure

```
test/
├── components/          # React component tests
│   └── alert-wizard.test.tsx
├── api/                 # API endpoint tests
│   └── alerts.test.ts
├── services/           # Existing service tests
│   ├── alert-batching.test.ts
│   ├── listing-deduplication.test.ts
│   └── notification.test.ts
└── README.md

e2e/                    # End-to-end tests
└── alert-creation.spec.ts
```

## Running Tests

### Component & Unit Tests (Vitest)

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# UI mode (interactive test runner)
npm run test:ui

# Coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/alert-creation.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed
```

### Run Everything

```bash
npm run test:all
```

## What We Test

### Alert Creation Workflow Tests

1. **Component Tests** (`test/components/alert-wizard.test.tsx`)
   - ✅ Step One: Name input validation
   - ✅ Step Two: Neighborhood selection
   - ✅ Step Three: Filter configuration
   - ✅ Rent stabilization checkbox and disclaimer
   - ✅ Form validation
   - ✅ State persistence across steps

2. **API Tests** (`test/api/alerts.test.ts`)
   - ✅ POST /api/alerts - Create alert
   - ✅ GET /api/alerts - List alerts
   - ✅ PATCH /api/alerts/:id - Update alert
   - ✅ DELETE /api/alerts/:id - Delete alert
   - ✅ Validation logic (price ranges, required fields)
   - ✅ Rent stabilization filter handling

3. **E2E Tests** (`e2e/alert-creation.spec.ts`)
   - ✅ Complete workflow from start to finish
   - ✅ Modal interactions
   - ✅ Multi-step navigation
   - ✅ Form submission
   - ✅ Error handling
   - ✅ Mobile responsiveness
   - ✅ Accessibility (keyboard navigation, ARIA)

## Key Features Tested

### Rent Stabilization Feature
- Checkbox interaction
- Disclaimer display
- Data persistence
- API integration

### StatefulButton Component
- Loading states
- Success feedback
- Error handling
- Auto-reset behavior

### Animated Modal
- Open/close animations
- Outside click dismissal
- Keyboard interaction
- Focus management

## Mocking Strategy

### API Mocking
```typescript
// Example: Mock successful alert creation
await page.route('/api/alerts', route => {
  route.fulfill({
    status: 201,
    body: JSON.stringify({
      id: 'test-123',
      name: 'Test Alert',
      filterRentStabilized: true
    })
  });
});
```

### Database Mocking
```typescript
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockResolvedValue([{ id: 'test-123' }])
  }
}));
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Assertions**: Test one thing at a time
3. **Meaningful Names**: Describe what the test does
4. **Use Data Attributes**: Add `data-testid` for reliable element selection
5. **Mock External Dependencies**: Don't hit real APIs in tests

## Debugging Tests

### Vitest Debugging
```bash
# Run specific test file
npx vitest test/components/alert-wizard.test.tsx

# Run tests matching pattern
npx vitest -t "rent stabilization"
```

### Playwright Debugging
```bash
# Generate test code by recording actions
npx playwright codegen localhost:3000

# Take screenshots on failure
npx playwright test --screenshot=only-on-failure

# Record videos
npx playwright test --video=on
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
```

## Common Issues & Solutions

### Issue: Tests fail with "Cannot find module"
**Solution**: Ensure all imports use proper aliases (`@/components/...`)

### Issue: E2E tests timeout
**Solution**: Increase timeout in playwright.config.ts or use `page.waitForTimeout()`

### Issue: Modal animations cause flaky tests
**Solution**: Add explicit waits after modal interactions: `await page.waitForTimeout(500)`

## Test Coverage Goals

- **Unit Tests**: 80% coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: Main user workflows

Current coverage focuses on:
- ✅ Alert creation workflow
- ✅ Rent stabilization feature
- ✅ Form validation
- ✅ API endpoints
- ⏳ Alert management (editing, deleting)
- ⏳ Notification delivery
- ⏳ Listing display