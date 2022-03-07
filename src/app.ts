import './app.scss'
// import 'taro-ui/dist/style/index.scss' // 全局引入一次即可

const App = {
  onShow () {
  },
  render(h) {
    // this.$slots.default 是将要会渲染的页面
    return h('block', this.$slots.default)
  }
}

export default App
