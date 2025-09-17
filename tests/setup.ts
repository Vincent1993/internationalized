import '@testing-library/jest-dom/vitest';

// Mock Intl.NumberFormat if needed for specific tests
const originalNumberFormat = Intl.NumberFormat;

beforeEach(() => {
  // Reset Intl.NumberFormat to original implementation
  global.Intl.NumberFormat = originalNumberFormat;
});

// Extend expect with jest-dom matchers
