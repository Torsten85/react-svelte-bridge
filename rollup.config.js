import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  external: id => !(id.startsWith('.') || id.startsWith('/')),
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
    },
  ],
  plugins: [typescript()],
}
