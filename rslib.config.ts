import { defineConfig } from '@rslib/core';
import packageJson from './package.json';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      source: {
        tsconfigPath: './tsconfig.build.json',
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
        filename: {
          js: '[name].mjs',
        },
      },
    },
  ],
});
