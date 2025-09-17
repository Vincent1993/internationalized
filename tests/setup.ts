import '@testing-library/jest-dom';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/types/matchers';

// Mock Intl.NumberFormat if needed for specific tests
const originalNumberFormat = Intl.NumberFormat;

beforeEach(() => {
  // Reset Intl.NumberFormat to original implementation
  global.Intl.NumberFormat = originalNumberFormat;
});

// Extend expect with jest-dom matchers
declare global {
  namespace Vi {
    interface JestAssertion<T = any>
      extends jest.Matchers<void, T>,
        TestingLibraryMatchers<T, void> {}
  }
}
