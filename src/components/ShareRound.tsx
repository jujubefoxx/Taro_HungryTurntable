import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from './Button'
import { Icon } from './ui'
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
      <Button className='round-share-button' disabled={disabled} openType={!h5 && share.ok ? 'share' : undefined} onClick={shareClick}><Icon name='users' size={20} /><Text>{h5 ? '复制这轮转盘链接' : '分享这轮转盘'}</Text></Button>
      {preview && <Button className='round-share-preview' disabled={disabled} onClick={previewShare}>预览<Icon name='chevron-right' size={15} /></Button>}
    </View>
    <Text className='fine-print'>朋友点开就能转，记录和偏好只留在你这里。</Text>
  </View>
}
