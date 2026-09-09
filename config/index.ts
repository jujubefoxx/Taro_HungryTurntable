import { defineConfig } from '@tarojs/cli'
import path from 'node:path'

export default defineConfig<'vite'>({
  projectName: 'hungry-turntable',
  date: '2026-09-09',
  designWidth: 750,
  deviceRatio: { 750: 1 },
  sourceRoot: 'src',
  outputRoot: `dist/${process.env.TARO_ENV || 'weapp'}`,
  framework: 'react',
  compiler: 'vite',
  plugins: [],
  alias: {},
  copy: { patterns: [{ from: path.resolve(__dirname, '../src/assets'), to: `dist/${process.env.TARO_ENV || 'weapp'}/assets` }], options: {} },
  mini: {
    postcss: { pxtransform: { enable: true }, cssModules: { enable: false } }
  },
  h5: {
    publicPath: '/',
    router: { mode: 'hash' },
    devServer: { host: '127.0.0.1', port: 10088 },
    postcss: { pxtransform: { enable: true }, cssModules: { enable: false } }
  }
})
