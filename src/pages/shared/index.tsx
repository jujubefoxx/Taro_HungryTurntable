import { useEffect, useMemo, useRef, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { useDidHide, useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { Action, FoodDetail, Icon, Page } from '../../components/ui'
import { Wheel } from '../../components/Wheel'
import { artForName, chooseIndex, Food, SCENES, targetRotation } from '../../core/model'
import { readWheelShare } from '../../core/wheel-share'
import { recordMeal } from '../../core/history'
import { asset, toast, vibrate } from '../../platform'
import { useApp } from '../../state/store'

export default function SharedRound() {
  const { state, update } = useApp()
  const token = useRouter().params.wheel
  const share = useMemo(() => readWheelShare(token), [token])
  const foods = useMemo<Food[]>(() => share.ok ? share.wheel.names.map((name, index) => ({ id: `shared-${index}`, name, art: artForName(name) })) : [], [share])
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Food>()
  const [detail, setDetail] = useState<Food>()
  const lock = useRef(false)
  const accepted = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const home = () => { void Taro.reLaunch({ url: '/pages/index/index' }) }
  const stop = () => { clearTimeout(timer.current); lock.current = false; setSpinning(false); setResult(undefined); setDetail(undefined) }
  useDidHide(stop)
  useEffect(() => {
    stop()
    setRotation(0)
    return () => clearTimeout(timer.current)
  }, [token])
  useShareAppMessage(() => ({
    title: '今天吃啥？点开转一转就知道啦 🍙',
    path: share.ok ? share.path : '/pages/index/index', imageUrl: asset('share-card.png')
  }))
  useShareTimeline(() => ({
    title: '这顿吃啥？这一轮你来转',
    query: share.ok ? `wheel=${share.token}` : '', imageUrl: asset('mascot.png')
  }))
  const spin = (exclude?: number) => {
    if (lock.current || !share.ok) return
    lock.current = true
    accepted.current = false
    const index = chooseIndex(foods.length, exclude)
    setResult(undefined); setSpinning(true)
    setRotation(targetRotation(rotation, index, foods.length))
    vibrate(state.settings.haptics)
    timer.current = setTimeout(() => {
      lock.current = false; setSpinning(false); setResult(foods[index]); vibrate(state.settings.haptics)
    }, state.settings.reducedMotion ? 150 : 4250)
  }
  if (!share.ok) return <Page title='朋友的转盘'><View className='empty-state shared-empty'><Icon name='info-circle' size={42} /><Text className='section-title'>这份转盘暂时打不开</Text><Text className='muted'>{share.error}</Text><Action onClick={home}>先转转自己的</Action></View></Page>
  const scene = SCENES.find(item => item.id === share.wheel.scene)!
  return <Page title='朋友的转盘'>
    <View className='section-hero shared-hero'><Icon name={scene.icon} size={34} /><Text className='page-title'>选项备好啦，<Text>这一轮你来转。</Text></Text><Text className='muted'>{scene.name} · {foods.length} 个选项</Text><Text className='fine-print'>独立的一轮，不改你的食物库，也不使用你的避重设置。</Text></View>
    <Wheel foods={foods} rotation={rotation} spinning={spinning} reducedMotion={state.settings.reducedMotion} onSpin={() => spin()} onFood={setDetail} />
    <View className='insight-chips shared-candidates'>{foods.map(food => <Text key={food.id}>{food.name}</Text>)}</View>
    <Action className='spin-cta' disabled={spinning} onClick={() => spin()}>{spinning ? '转着呢，马上好…' : '转一下，就在这轮选！'}</Action>
    <Action secondary className='shared-home' onClick={home} disabled={spinning}>回到我的转盘</Action>
    <Text className='page-motto'>确认开饭才记进你的小本本，结果不会自动发给朋友。</Text>
    {detail && <FoodDetail food={detail} onClose={() => setDetail(undefined)} />}
    {result && <FoodDetail food={result} title='这一轮就选它？' onClose={() => setResult(undefined)}>
      <Action onClick={() => {
        if (accepted.current) return
        accepted.current = true
        update(s => recordMeal(s, result, share.wheel.scene, share.wheel.names))
        setResult(undefined)
        toast('开饭盖章！已记进你的小本本')
      }}>就吃这个，开饭！</Action>
      <View className='sheet-footer'><Action secondary onClick={() => spin()}>再转一次</Action><Action secondary onClick={() => spin(foods.findIndex(food => food.id === result.id))}>换一个</Action></View>
    </FoodDetail>}
  </Page>
}
