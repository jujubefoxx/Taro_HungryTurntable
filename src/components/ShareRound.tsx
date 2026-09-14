import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from './Button'
import { WheelShare } from '../core/wheel-share'
import { toast } from '../platform'
import { copyShareLink } from '../platform/share-clipboard'

export function ShareRound({ share, disabled = false, preview = true }: { share: WheelShare; disabled?: boolean; preview?: boolean }) {
  const h5 = process.env.TARO_ENV === 'h5'
  const shareClick = async () => {
    if (!share.ok) return toast(share.error)
    if (h5) {
      try {
        await copyShareLink(`${window.location.origin}${window.location.pathname}#${share.path}`)
        toast('链接复制好了，发给朋友就能转')
      } catch { toast('没有复制成功，请再试一次') }
    }
  }
  const previewShare = () => {
    if (!share.ok) return toast(share.error)
    void Taro.navigateTo({ url: share.path }).catch(() => toast('暂时没能打开，稍后再试吧'))
  }
  return <View className='round-share'>
    <View className='round-share-actions'>
      <Button className='text-button accent' disabled={disabled} openType={!h5 && share.ok ? 'share' : undefined} onClick={shareClick}>{h5 ? '复制这轮转盘链接' : '分享这轮转盘'}</Button>
      {preview && <Button className='text-button' disabled={disabled} onClick={previewShare}>预览</Button>}
    </View>
    <Text className='fine-print'>只分享候选名称和分类，不含记录或个人偏好。</Text>
  </View>
}
