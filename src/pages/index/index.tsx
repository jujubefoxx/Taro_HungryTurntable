import { useEffect, useRef, useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from '../../components/Button'
import { useDidHide, useShareAppMessage } from '@tarojs/taro'
import { chooseIndex, Food, sample, SCENES, targetRotation } from '../../core/model'
import { useApp } from '../../state/store'
import { Action, FoodDetail, Icon, Page, SceneTabs } from '../../components/ui'
import { Wheel } from '../../components/Wheel'
import { WheelEditor } from '../../components/WheelEditor'
import { go, toast, vibrate } from '../../platform'
import { InlineAd, SupportEntry } from '../../components/Monetization'
import { recordMeal } from '../../core/history'

const MEAL_TICKETS = {
  all: { title: '今天这顿，\n交给转盘。', stamp: '开饭签', wish: '准备开饭', footer: '看看今天轮到谁' },
  drink: { title: '喝点啥？\n转一下。', stamp: '干杯签', wish: '来杯喝的', footer: '先喝一口再说' },
  sweet: { title: '给今天，\n加一点甜。', stamp: '甜蜜签', wish: '甜一下嘛', footer: '甜的装另一个胃' },
  fit: { title: '好好吃饭，\n轻松选择。', stamp: '清爽签', wish: '清爽开饭', footer: '吃得舒服就好' },
  friend: { title: '人齐了，\n开饭吧。', stamp: '聚餐签', wish: '热闹上桌', footer: '多点几个一起尝' },
  quick: { title: '忙归忙，\n也要吃饭。', stamp: '补给签', wish: '饭点到了', footer: '肚子不等人啦' },
  self: { title: '今天这顿，\n自己露一手。', stamp: '掌勺签', wish: '大厨上线', footer: '今天露一小手' },
  snacks: { title: '夜色正好，\n来口宵夜。', stamp: '夜宵签', wish: '晚点也香', footer: '这么晚了吃点啥' }
}

export default function Home() {
  const { state, update } = useApp()
  const current = state.scenes[state.scene]
  const ticket = MEAL_TICKETS[state.scene]
  const scene = SCENES.find(item => item.id === state.scene)!
  const foods = current.wheel.map(id => current.pool.find(f => f.id === id)!)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const lock = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [result, setResult] = useState<Food>()
  const [detail, setDetail] = useState<Food>()
  const [editing, setEditing] = useState(false)
  const [undo, setUndo] = useState<string[]>()
  const accepted = useRef(false)
  useShareAppMessage(() => ({ title: '今天吃啥？把纠结交给转盘。', path: '/pages/index/index' }))
  useEffect(() => { setRotation(0); setUndo(undefined); setResult(undefined) }, [state.scene])
  useEffect(() => () => clearTimeout(timer.current), [])
  useDidHide(() => { clearTimeout(timer.current); lock.current = false; setSpinning(false); setResult(undefined) })
  const spin = (exclude?: string) => {
    if (lock.current) return
    if (foods.length < 2) return toast('至少放入两份食物再开转吧')
    lock.current = true
    accepted.current = false
    const excluded = exclude ? foods.findIndex(f => f.id === exclude) : undefined
    const index = chooseIndex(foods.length, excluded)
    setResult(undefined); setSpinning(true)
    setRotation(targetRotation(rotation, index, foods.length))
    vibrate(state.settings.haptics)
    timer.current = setTimeout(() => {
      lock.current = false; setSpinning(false); setResult(foods[index]); vibrate(state.settings.haptics)
    }, state.settings.reducedMotion ? 150 : 4250)
  }
  const shuffle = () => {
    if (lock.current) return
    if (current.pool.length < foods.length) return toast(`还差 ${foods.length - current.pool.length} 份候选食物`)
    let next = sample(current.pool, foods.length).map(f => f.id)
    if (next.every((id, i) => id === current.wheel[i])) next = [...next.slice(1), next[0]]
    setUndo([...current.wheel]); setRotation(0)
    update(s => ({ ...s, scenes: { ...s.scenes, [s.scene]: { ...s.scenes[s.scene], wheel: next } } }))
  }
  const undoShuffle = () => {
    if (!undo || lock.current) return
    const valid = undo.every(id => current.pool.some(f => f.id === id))
    if (!valid) { setUndo(undefined); return toast('食物库已修改，无法撤销这一组') }
    update(s => ({ ...s, scenes: { ...s.scenes, [s.scene]: { ...s.scenes[s.scene], wheel: undo } } }))
    setUndo(undefined); setRotation(0)
  }
  return <Page home>
    <View className='hero'><View className='hero-copy'><Text className='hero-title'>{ticket.title}</Text><Text className='hero-subtitle'>好好吃饭，不用纠结。</Text></View><View className={`meal-ticket meal-ticket-${state.scene}`}><Text className='meal-ticket-stamp'>{ticket.stamp}</Text><View className='meal-ticket-icon'><Icon name={scene.icon} size={30} /></View><Text className='meal-ticket-wish'>{ticket.wish}</Text><Text className='meal-ticket-footer'>{ticket.footer}</Text></View></View>
    <SceneTabs disabled={spinning || undefined} />
    <Wheel foods={foods} rotation={rotation} spinning={spinning} reducedMotion={state.settings.reducedMotion} onSpin={() => spin()} onFood={setDetail} />
    <View className='round-summary'><Text>这一轮 · {foods.length} 个选项</Text><View className='inline-actions'>{undo && <Button className='text-button' disabled={spinning || undefined} onClick={undoShuffle}>撤销</Button>}<Button className='text-button accent' disabled={spinning || undefined} onClick={shuffle}>换一组<Icon name='refresh' size={19} /></Button></View></View>
    <Action disabled={spinning || undefined} onClick={() => spin()} className='spin-cta'>{spinning ? '转着呢，马上好…' : '转一下，开饭！'}</Action>
    <View className='home-links'><Button className="link-button" disabled={spinning || undefined} onClick={() => setEditing(true)}><Icon name='pencil' /><Text>编辑转盘</Text></Button><Button className="link-button" disabled={spinning || undefined} onClick={() => go('library')}><Icon name='bowl-spoon' /><Text>我的食物库</Text></Button></View>
    <Button className='cyber-banner' disabled={spinning || undefined} onClick={() => go('cyber')}><Icon name='sparkles' /><View><Text className='banner-title'>赛博食堂</Text><Text className='fine-print'>嘴馋了？先来这儿尝一口</Text></View><Icon name='chevron-right' size={18} /></Button>
    <View className='extra-entries'><Button className='extra-entry' disabled={spinning} onClick={() => go('history')}><Icon name='history' /><Text>开饭小本本</Text><Text className='fine-print'>{state.mealHistory.length ? `记下了 ${state.mealHistory.length} 次开饭` : '看看之前选了啥'}</Text></Button><Button className='extra-entry' disabled={spinning} onClick={() => go('decide')}><Icon name='dice-5' /><Text>万事转盘</Text><Text className='fine-print'>去哪玩？做什么？都能转</Text></Button></View>
    {state.lastMeal && <Text className='last-meal'>上次翻牌：{state.lastMeal.name}</Text>}
    <Text className='page-motto'>吃什么可以随便，吃饭可不能省略。</Text>
    <SupportEntry />
    <InlineAd />
    {editing && <WheelEditor onClose={() => { setEditing(false); setRotation(0); setUndo(undefined) }} />}
    {detail && <FoodDetail food={detail} onClose={() => setDetail(undefined)} />}
    {result && <FoodDetail food={result} title='就它了，怎么样？' onClose={() => setResult(undefined)}>
      <Text className='result-kicker'>先别划走，认真考虑一下。</Text>
      <Action onClick={() => { if (accepted.current) return; accepted.current = true; update(s => recordMeal(s, result, s.scene, foods.map(f => f.name))); setResult(undefined); toast('开饭盖章！已记进小本本') }}>就吃这个，开饭！</Action>
      <View className='sheet-footer'><Action secondary onClick={() => spin()}>再转一次</Action><Action secondary onClick={() => spin(result.id)}>换一个</Action></View>
      <Button className='text-button centered' onClick={() => { const id = result.id; setResult(undefined); go('cyber', `?food=${encodeURIComponent(id)}&scene=${state.scene}`) }}>去赛博食堂尝一口<Icon name='chevron-right' size={16} /></Button>
    </FoodDetail>}
  </Page>
}
