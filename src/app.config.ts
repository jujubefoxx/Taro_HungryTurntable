export default defineAppConfig({
  pages: ['pages/index/index', 'pages/library/index', 'pages/cyber/index', 'pages/settings/index', 'pages/history/index', 'pages/decide/index'],
  window: { navigationStyle: 'custom', navigationBarTextStyle: 'black', backgroundColor: '#fffaf0', backgroundTextStyle: 'dark' },
  lazyCodeLoading: 'requiredComponents'
})
