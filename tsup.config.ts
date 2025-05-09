import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  format: ['esm', 'cjs'],
  treeshake: 'smallest',
  entry: [
    './src/index.ts',
    './src/helpers.ts',
    './src/babel/types.ts',
    './src/babel/traverse.ts',
    './src/recast/index.ts',
  ],
});
