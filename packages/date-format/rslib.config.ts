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
          components: './src/components/index.ts',
          hooks: './src/hooks/index.ts',
          core: './src/core/index.ts',
          'date-fns': './src/date-fns.ts'
        }
      },
      banner: {
        js: `/* ${packageJson.name} v${packageJson.version} */`
      },
      dts: true,
      output: {
        minify: true,
        distPath: {
          root: './dist'
        },
        filename: {
          js: '[name].mjs'
        }
      }
    }
  ]
});
