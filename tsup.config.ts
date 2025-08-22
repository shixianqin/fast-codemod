import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  format: 'esm',
  treeshake: 'smallest',
  entry: [
    './src/index.ts',
    './src/babel.ts',
    './src/glob.ts',
    './src/helpers/index.ts',
  ],
});
