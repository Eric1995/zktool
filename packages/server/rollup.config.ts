import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

const env = process.env.NODE_ENV;
const options = defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'commonjs',
      sourcemap: false,
    },
  ],
  plugins: [
    typescript({
      declaration: false,
      target: 'es2019',
    }),
    nodeResolve(),
    commonjs(),
    json(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    terser(),
  ],
});

export default [options];
