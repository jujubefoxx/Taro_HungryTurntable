import { useEffect, useRef, useState } from 'react'
import { Ad, Text, View } from '@tarojs/components'
import { Button } from './Button'
import Taro from '@tarojs/taro'
import { ADS_ENABLED, REWARDED_ENABLED, WEAPP_ADS } from '../config/ads'
import { rewardController } from '../core/rewarded'
import { Action, FoodImage, Icon, Sheet } from './ui'
import { toast } from '../platform'

export function InlineAd({ video = false }: { video?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!ADS_ENABLED || !(video ? WEAPP_ADS.video : WEAPP_ADS.banner).trim() || failed) return null
  return <View className='inline-ad'><Text className='ad-label'>广告 · 谢谢支持</Text><Ad unitId={video ? WEAPP_ADS.video : WEAPP_ADS.banner} adType={video ? 'video' : 'banner'} adTheme='white' onError={() => setFailed(true)} /></View>
}

export type RewardPurpose = 'support' | 'source' | 'feedback'
const purposeCopy = {
  support: { title: '请作者吃口饭', desc: '自愿观看视频广告，不会扣费。不观看也不影响转盘和赛博食堂的使用。', action: '看广告，支持作者' },
  source: { title: '获取项目源码', desc: '完整观看一段视频广告后，解锁本次源码地址复制。提前关闭不会复制，也不会扣费。', action: '看广告，解锁源码地址' },
  feedback: { title: '有建议？跟我说说', desc: '完整观看一段视频广告后，打开本次反馈入口。提前关闭不会解锁，不会扣费。', action: '看广告，打开反馈入口' }
}
export function RewardSheet({ purpose, onClose }: { purpose: RewardPurpose; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const controller = useRef<ReturnType<typeof rewardController>>()
  const alive = useRef(true)
  const lock = useRef(false)
  useEffect(() => () => { alive.current = false; controller.current?.cancel() }, [])
  const copy = purposeCopy[purpose]
  const close = () => { controller.current?.cancel(); onClose() }
  const copyUrl = async (feedback = false) => {
    try { await Taro.setClipboardData({ data: `https://github.com/jujubefoxx/Taro_HungryTurntable${feedback ? '/issues' : ''}` }); toast('地址已复制，可粘贴到浏览器打开') }
    catch { toast('复制失败，请再点一次') }
  }
  const watch = async () => {
    if (lock.current) return
    if (!REWARDED_ENABLED || !Taro.createRewardedVideoAd) return toast(ADS_ENABLED ? '广告暂未配置好，稍后再来吧' : '这个入口暂时只在微信小程序开放')
    lock.current = true; setBusy(true)
    controller.current ||= rewardController(() => Taro.createRewardedVideoAd({ adUnitId: WEAPP_ADS.rewarded }))
    const result = await controller.current.watch()
    lock.current = false
    if (!alive.current) return
    setBusy(false)
    if (result === 'completed') setDone(true)
    else toast(result === 'cancelled' ? '还没完整看完，可以稍后再来' : '广告暂时没准备好，请稍后再试')
  }
  return <Sheet title={done ? '谢谢支持！' : copy.title} onClose={close}>
    <View className='reward-hero'><FoodImage food={{ art: 'mascot', name: '感谢支持的小饭团' }} /><Text className='muted'>{done ? purpose === 'support' ? '这顿记你账上，谢谢投喂！' : '谢谢支持，现在可以使用下面的入口了。' : copy.desc}</Text></View>
    {done ? <>{purpose === 'source' && <Action onClick={() => { void copyUrl() }}>复制 GitHub 源码地址</Action>}{purpose === 'feedback' && <View className='menu-actions'><Action onClick={() => { void copyUrl(true) }}>复制反馈页面地址</Action>{ADS_ENABLED && <Button className='btn-secondary' openType='contact'>联系小程序客服</Button>}</View>}<Action secondary onClick={onClose}>回去接着玩</Action></> : <><Action onClick={() => { void watch() }} disabled={busy}>{busy ? '正在准备广告…' : copy.action}</Action><Button className='text-button centered' onClick={close}>这次先不了</Button></>}
  </Sheet>
}

export function SupportEntry() {
  const [open, setOpen] = useState(false)
  if (!REWARDED_ENABLED || !Taro.createRewardedVideoAd) return null
  return <><Button className='support-entry' onClick={() => setOpen(true)}><Icon name='heart' size={20} /><View><Text>请作者吃口饭</Text><Text className='fine-print'>自愿看一段广告，给作者加个鸡腿</Text></View><Icon name='chevron-right' size={16} /></Button>{open && <RewardSheet purpose='support' onClose={() => setOpen(false)} />}</>
}
