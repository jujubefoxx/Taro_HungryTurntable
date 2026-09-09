import { Image, Switch, Text, View } from '@tarojs/components'
import { Button } from '../../components/Button'
import { useState } from 'react'
import { useApp } from '../../state/store'
import { Settings } from '../../core/model'
import { initialState } from '../../core/seeds'
import { Icon, Page } from '../../components/ui'
import { asset, confirm, go, toast } from '../../platform'
import { InlineAd, RewardPurpose, RewardSheet, SupportEntry } from '../../components/Monetization'

const preferences: { key: keyof Settings; title: string; desc: string; icon: string }[] = [
  { key: 'nutrition', title: '显示营养参考', desc: '展示热量、份量和已有营养信息，仅供参考', icon: 'leaf' },
  { key: 'sound', title: '进食音效', desc: '赛博食堂的咔嚓、吸溜与咕噜声', icon: 'volume' },
  { key: 'haptics', title: '轻轻震一下', desc: '转盘结果与进食触感，需设备支持', icon: 'sparkles' },
  { key: 'reducedMotion', title: '减少动态效果', desc: '缩短转盘动画，关闭弹窗、切换和进食动效', icon: 'player-play' }
]
export default function SettingsPage() {
  const { state, update } = useApp()
  const [reward, setReward] = useState<RewardPurpose>()
  return <Page title='设置'>
    <View className='about-hero'><Image src={asset('mascot.png')} mode='aspectFit' /><Text className='page-title'>吃饭这件事，可别忘了。</Text><Text className='muted'>今天吃啥 · 2.0.5</Text></View>
    <View className='settings-sections'>
      <View className='settings-list'>{preferences.map(item => <View key={item.key} className='setting-row'><Icon name={item.icon} /><View className='setting-copy'><Text>{item.title}</Text><Text className='fine-print'>{item.desc}</Text></View><Switch ariaLabel={item.title} color='#f5663d' checked={state.settings[item.key]} onChange={e => update(s => ({ ...s, settings: { ...s.settings, [item.key]: e.detail.value } }))} /></View>)}</View>
      <SupportEntry />
      <View className='settings-list'><Button className='setting-link' onClick={() => go('history')}><Icon name='history' /><Text>翻翻开饭小本本</Text><Icon name='chevron-right' size={18} /></Button><Button className='setting-link' onClick={() => go('decide')}><Icon name='dice-5' /><Text>万事转盘，选点别的</Text><Icon name='chevron-right' size={18} /></Button></View>
      <View className='settings-list'><Button className='setting-link' onClick={async () => { if (await confirm('重置全部食物库？', '所有分类的自定义食物及转盘会恢复默认，偏好设置保留。此操作不能撤销。')) { update(s => ({ ...s, scenes: initialState().scenes })); toast('食物库已恢复默认') } }}><Icon name='refresh' /><Text>重置全部食物库</Text><Icon name='chevron-right' size={18} /></Button></View>
      <View className='settings-secondary-links'>
        <Button className='settings-secondary-link' onClick={() => setReward('source')}><Icon name='info-circle' size={20} /><View><Text>项目源码</Text><Text>看广告后获取</Text></View></Button>
        <Button className='settings-secondary-link' onClick={() => setReward('feedback')}><Icon name='users' size={20} /><View><Text>反馈建议</Text><Text>看广告后反馈</Text></View></Button>
      </View>
    </View>
    <View className='privacy-note'><Text className='section-title'>数据都存在哪？</Text><Text>食物、最近 30 条开饭记录、万事转盘和偏好保存在当前设备，不需要注册或登录。更换设备、清除应用数据或卸载后可能丢失。</Text></View>
    <Text className='page-motto'>今天吃啥，不必想得那么复杂。</Text>
    <InlineAd video />
    {reward && <RewardSheet purpose={reward} onClose={() => setReward(undefined)} />}
  </Page>
}
