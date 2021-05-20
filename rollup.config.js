import babel from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'
export default {
  input: './src/index.js', // 入口，以这个入口打包库
  output: {
    format: 'umd',
    name: 'Vue',
    file: 'dist/umd/vue.js',
    sourcemap: true
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    serve({
      open: true,
      port: 3000,
      contentBase: '',
      openPage:'index.html'
    })
  ]
}