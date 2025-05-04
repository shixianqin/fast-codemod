import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  format: ['esm'],
  treeshake: 'smallest',
  entry: [
    './src/index.ts',
    './src/babel/types.ts',
    './src/babel/traverse.ts',
    './src/recast/index.ts',
  ],
});
