import { defineConfig } from '@rslib/core';
import packageJson from './package.json';

export default defineConfig({
  lib: [
    // ESM Build Configuration
    {
      format: 'esm',
      source: {
        entry: {
          index: './src/index.ts',
          plugins: './src/plugins/index.ts',
          fp: './src/fp/index.ts',
          components: './src/components/index.ts',
          hooks: './src/hooks/index.ts',
          core: './src/core/index.ts',
        },
      },
      banner: {
        js: `/* ${packageJson.name} v${packageJson.version} */`,
      },
      dts: true,
      output: {
        minify: true,
        distPath: {
          root: './dist',
        },
        // Output ESM files with .mjs extension to match package.json exports
        filename: {
          js: '[name].mjs',
        },
      },
    },
    {
      format: 'cjs',
      syntax: 'es5',
      banner: {
        js: `/* ${packageJson.name} v${packageJson.version} */`,
      },
      dts: true,
      source: {
        entry: {
          index: './src/index.ts',
          plugins: './src/plugins/index.ts',
          fp: './src/fp/index.ts',
          components: './src/components/index.ts',
          hooks: './src/hooks/index.ts',
          core: './src/core/index.ts',
        },
      },
      output: {
        minify: true,
        distPath: {
          root: './dist',
        },
      },
    },
  ],
});
