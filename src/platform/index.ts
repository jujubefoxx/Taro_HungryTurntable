import Taro from '@tarojs/taro'

export const asset = (name: string) => `/assets/${name}`
export const toast = (title: string) => { void Taro.showToast({ title, icon: 'none', duration: 2400 }) }
export const go = (page: 'index' | 'library' | 'cyber' | 'settings' | 'history' | 'decide', query = '') => {
  void Taro.navigateTo({ url: `/pages/${page}/index${query}` })
}
export function back() {
  if (Taro.getCurrentPages().length > 1) void Taro.navigateBack()
  else void Taro.reLaunch({ url: '/pages/index/index' })
}
export function navigationMetrics() {
  if (process.env.TARO_ENV === 'h5') return { top: 8, height: 44, right: 0, gap: 12 }
  try {
    const info = Taro.getWindowInfo?.() || Taro.getSystemInfoSync()
    const status = info.statusBarHeight || 20
    const width = info.windowWidth
    const rect = Taro.getMenuButtonBoundingClientRect?.()
    const valid = rect && rect.height > 0 && rect.top >= status && rect.left > width / 2 && rect.right <= width
    const top = valid ? rect.top : status + 6
    // 使用真实 px；不与设计稿的 rpx 高度混算。导航内容中心与胶囊中心一致。
    return { top, height: valid ? rect.height : 32, right: valid ? Math.max(0, width - rect.left + 8 - width * 34 / 750) : 96, gap: Math.max(8, top - status) + 12 }
  } catch { return { top: 26, height: 32, right: 96, gap: 18 } }
}
export async function confirm(title: string, content: string) {
  const result = await Taro.showModal({ title, content, confirmText: '确定', cancelText: '取消', confirmColor: '#f5663d' })
  return result.confirm
}
export function vibrate(enabled: boolean) {
  if (enabled && process.env.TARO_ENV !== 'h5') void Taro.vibrateShort({ type: 'light' }).catch(() => {})
}
export function createBiteAudio(kind: 'crunch' | 'sip' | 'spoon', onError: () => void) {
  let audio: ReturnType<typeof Taro.createInnerAudioContext> | undefined
  let playCount = 0
  return {
    play() {
      try {
        if (!audio) {
          audio = Taro.createInnerAudioContext()
          audio.volume = 0.7
          if (process.env.TARO_ENV !== 'h5') audio.obeyMuteSwitch = true
          audio.onError(onError)
        }
        audio.stop()
        audio.src = asset(`${kind === 'crunch' && playCount++ % 2 ? 'crunch-alt' : kind}.wav`)
        // H5 返回播放 Promise，小程序端返回 void；主动切换音效的中断不算播放失败。
        const playback = audio.play() as unknown as Promise<void> | undefined
        void playback?.catch(error => { if (error?.name !== 'AbortError') onError() })
      } catch { onError() }
    },
    stop() { audio?.stop() },
    destroy() { audio?.destroy(); audio = undefined }
  }
}
