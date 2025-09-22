import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: './packages/number-format/vitest.config.ts',
        name: 'number-format',
        root: './packages/number-format',
      },
      {
        extends: './packages/date-format/vitest.config.ts',
        name: 'date-format',
        root: './packages/date-format',
      },
    ],
  },
});
