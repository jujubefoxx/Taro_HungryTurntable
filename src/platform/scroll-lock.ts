let lockCount = 0
let restore: (() => void) | undefined

// 原生端由 catchMove + ScrollView 隔离手势；H5 还要阻止鼠标滚轮及页面滚动。
export function lockSheetBackground() {
  if (process.env.TARO_ENV !== 'h5' || typeof document === 'undefined') return () => {}
  if (lockCount++ === 0) {
    const elements = [document.documentElement, document.body, ...Array.from(document.querySelectorAll<HTMLElement>('.taro_page'))]
    const originals = elements.map(element => ({ element, overflow: element.style.overflow, overscroll: element.style.overscrollBehavior }))
    elements.forEach(element => { element.style.overflow = 'hidden'; element.style.overscrollBehavior = 'none' })
    restore = () => originals.forEach(({ element, overflow, overscroll }) => { element.style.overflow = overflow; element.style.overscrollBehavior = overscroll })
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--lockCount === 0) { restore?.(); restore = undefined }
  }
}
