export type RewardResult = 'completed' | 'cancelled' | 'failed' | 'busy'
export interface RewardAd {
  load(): Promise<unknown>
  show(): Promise<unknown>
  onClose(fn: (result: { isEnded: boolean }) => void): void
  offClose(fn: (result: { isEnded: boolean }) => void): void
  onError(fn: () => void): void
  offError(fn: () => void): void
  destroy(): void
}

// 一个控制器只属于一个页面；仅平台确认完整观看才发放结果。
export function rewardController(create: () => RewardAd, timeoutMs = 15000) {
  let pending: ((result: RewardResult) => void) | undefined
  return {
    watch(): Promise<RewardResult> {
      if (pending) return Promise.resolve('busy')
      return new Promise(resolve => {
        let ad: RewardAd | undefined, timer: ReturnType<typeof setTimeout> | undefined
        let settled = false
        const finish = (result: RewardResult) => {
          if (settled) return
          settled = true; clearTimeout(timer); pending = undefined
          try { ad?.offClose(close); ad?.offError(error); ad?.destroy() } catch { /* 页面退出后平台可能已销毁实例。 */ }
          resolve(result)
        }
        const close = (result?: { isEnded: boolean }) => finish(result?.isEnded === true ? 'completed' : 'cancelled')
        const error = () => finish('failed')
        pending = finish
        timer = setTimeout(error, timeoutMs)
        try {
          ad = create(); ad.onClose(close); ad.onError(error)
          // 先加载，避免把缓存未就绪的 show 失败当作成功观看。
          void ad.load().then(() => {
            if (settled) return
            return ad!.show().then(() => { clearTimeout(timer) })
          }).catch(error)
        } catch { error() }
      })
    },
    cancel() { pending?.('cancelled') }
  }
}
