import { useEffect, useRef, useState } from 'react'
import { Image, Switch, Text, View } from '@tarojs/components'
import { Button } from '../../components/Button'
import Taro, { useDidHide, useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { chooseIndex, Food, sample, SCENES, SceneId, targetRotation } from '../../core/model'
import { useApp } from '../../state/store'
import { Action, FoodDetail, Icon, Page, SceneTabs, Sheet } from '../../components/ui'
import { Wheel } from '../../components/Wheel'
import { WheelEditor } from '../../components/WheelEditor'
import { asset, go, toast, vibrate } from '../../platform'
import { InlineAd, SupportEntry } from '../../components/Monetization'
import { recordMeal } from '../../core/history'
import { mealChoices } from '../../core/meal-insights'
import { createWheelShare } from '../../core/wheel-share'
import { ShareRound } from '../../components/ShareRound'

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

const DAILY_SCENE_PROMPT_KEY = 'hungry-turntable:daily-scene-prompt'
const DAILY_EXCLUSIONS_KEY = 'hungry-turntable:daily-exclusions'
let promptedThisSession = false

type DailyExclusions = {
  day: string
  scenes: Partial<Record<SceneId, string[]>>
}

function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function loadDailyExclusions(): DailyExclusions {
  const empty: DailyExclusions = { day: localDayKey(), scenes: {} }
  try {
    const value: unknown = Taro.getStorageSync(DAILY_EXCLUSIONS_KEY)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return empty
    const saved = value as { day?: unknown; scenes?: unknown }
    if (saved.day !== empty.day || !saved.scenes || typeof saved.scenes !== 'object' || Array.isArray(saved.scenes)) return empty
    const scenes: DailyExclusions['scenes'] = {}
    for (const scene of SCENES) {
      const ids = (saved.scenes as Record<string, unknown>)[scene.id]
      if (Array.isArray(ids)) scenes[scene.id] = [...new Set(ids.filter((id): id is string => typeof id === 'string'))].slice(0, 200)
    }
    return { day: empty.day, scenes }
  } catch {
    return empty
  }
}

function storeDailyExclusions(value: DailyExclusions) {
  try { Taro.setStorageSync(DAILY_EXCLUSIONS_KEY, value); return true }
  catch { return false }
}

function timeGreeting(hour = new Date().getHours()) {
  if (hour < 5) return '还没睡呀'
  if (hour < 11) return '早呀'
  if (hour < 14) return '饭点到啦'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深啦'
}

function recommendedSceneAt(hour = new Date().getHours()): typeof SCENES[number]['id'] {
  if (hour < 5) return 'snacks'
  if (hour < 10) return 'self'
  if (hour < 14) return 'quick'
  if (hour < 17) return 'sweet'
  if (hour < 21) return 'friend'
  return 'snacks'
}

export default function Home() {
  const { state, update } = useApp()
  const current = state.scenes[state.scene]
  const ticket = MEAL_TICKETS[state.scene]
  const scene = SCENES.find(item => item.id === state.scene)!
  const recommendedSceneId = recommendedSceneAt()
  const recommendedScene = SCENES.find(item => item.id === recommendedSceneId)!
  const dailySceneOptions = [recommendedScene, ...SCENES.filter(item => item.id !== recommendedSceneId)]
  const foods = current.wheel.map(id => current.pool.find(f => f.id === id)!)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const lock = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [result, setResult] = useState<Food>()
  const [detail, setDetail] = useState<Food>()
  const [editing, setEditing] = useState(false)
  const [dailyPrompt, setDailyPrompt] = useState(false)
  const [dailyExclusions, setDailyExclusions] = useState(loadDailyExclusions)
  const [undo, setUndo] = useState<string[]>()
  const accepted = useRef(false)
  const currentDailyExcludedIds = dailyExclusions.day === localDayKey() ? dailyExclusions.scenes[state.scene] || [] : []
  const currentDailyExcludedFoods = current.pool.filter(food => currentDailyExcludedIds.includes(food.id))
  const choices = mealChoices(foods, state.mealHistory, state.settings.avoidRecentOptIn, currentDailyExcludedIds)
  const share = createWheelShare(state.scene, foods.map(food => food.name))
  useShareAppMessage(() => ({
    title: share.ok ? `这顿吃啥？${foods.length} 个选项，你来转` : '今天吃啥？转一下，今天就吃这个',
    path: share.ok ? share.path : '/pages/index/index', imageUrl: asset('share-card.png')
  }))
  useShareTimeline(() => ({ title: '今天吃啥？转一下，今天就吃这个', imageUrl: asset('mascot.png') }))
  useDidShow(() => {
    // 微信原生字段名为 menus；Taro 4.2.1 的跨端类型仍标成 showShareItems，运行时需透传原生字段。
    const options = { menus: ['shareAppMessage', 'shareTimeline'] } as Parameters<typeof Taro.showShareMenu>[0]
    if (process.env.TARO_ENV === 'weapp') void Taro.showShareMenu(options).catch(() => {})
  })
  useEffect(() => { setRotation(0); setUndo(undefined); setResult(undefined) }, [state.scene])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (promptedThisSession) return
    const today = localDayKey()
    let lastPrompt = ''
    try { lastPrompt = Taro.getStorageSync(DAILY_SCENE_PROMPT_KEY) }
    catch { /* 存储不可用时，本次会话仍只展示一次。 */ }
    if (lastPrompt === today) return
    const promptTimer = setTimeout(() => {
      if (promptedThisSession) return
      promptedThisSession = true
      try { Taro.setStorageSync(DAILY_SCENE_PROMPT_KEY, today) }
      catch { /* 主功能不依赖每日提示的存储结果。 */ }
      setDailyPrompt(true)
    }, state.settings.reducedMotion ? 0 : 260)
    return () => clearTimeout(promptTimer)
  }, [state.settings.reducedMotion])
  useDidHide(() => { clearTimeout(timer.current); lock.current = false; setSpinning(false); setResult(undefined) })
  const chooseDailyScene = (sceneId: typeof state.scene) => {
    update(s => ({ ...s, scene: sceneId }))
    setDailyPrompt(false)
  }
  const spin = (exclude?: string) => {
    if (lock.current) return
    if (foods.length < 2) return toast('至少放入两份食物再开转吧')
    const activeDailyExclusions = dailyExclusions.day === localDayKey() ? dailyExclusions.scenes[state.scene] || [] : []
    const excludedIds = new Set(activeDailyExclusions)
    if (exclude) excludedIds.add(exclude)
    const eligible = mealChoices(foods, state.mealHistory, state.settings.avoidRecentOptIn, [...excludedIds])
    if (!eligible.indexes.length) return toast('今天想避开的有点多，先放回来一个吧')
    lock.current = true
    accepted.current = false
    const index = eligible.indexes[chooseIndex(eligible.indexes.length)]
    setResult(undefined); setSpinning(true)
    setRotation(targetRotation(rotation, index, foods.length))
    vibrate(state.settings.haptics)
    timer.current = setTimeout(() => {
      lock.current = false; setSpinning(false); setResult(foods[index]); vibrate(state.settings.haptics)
    }, state.settings.reducedMotion ? 150 : 4250)
  }
  const excludeFoodToday = (food: Food) => {
    const day = localDayKey()
    const base: DailyExclusions = dailyExclusions.day === day ? dailyExclusions : { day, scenes: {} }
    const existing = (base.scenes[state.scene] || []).filter(id => current.pool.some(item => item.id === id))
    const ids = [...new Set([...existing, food.id])]
    if (foods.every(item => ids.includes(item.id))) return toast('今天能选的都被避开啦，先放回来一个吧')
    const next: DailyExclusions = { day, scenes: { ...base.scenes, [state.scene]: ids } }
    setDailyExclusions(next)
    const saved = storeDailyExclusions(next)
    setResult(undefined)
    spin(food.id)
    toast(saved ? '好，今天先不选它' : '已临时避开，但没能保存到本机')
  }
  const clearDailyExclusions = () => {
    const day = localDayKey()
    const base: DailyExclusions = dailyExclusions.day === day ? dailyExclusions : { day, scenes: {} }
    const scenes = { ...base.scenes }
    delete scenes[state.scene]
    const next = { day, scenes }
    setDailyExclusions(next)
    const saved = storeDailyExclusions(next)
    toast(saved ? '好啦，当前分类的食物都回来了' : '已恢复，但没能保存到本机')
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
    {currentDailyExcludedFoods.length > 0 && <View className='daily-exclusions'><Text>今天先不吃：{currentDailyExcludedFoods.map(food => food.name).join('、')}</Text><Button className='text-button accent' disabled={spinning || undefined} onClick={clearDailyExclusions}>都放回来</Button></View>}
    <Action disabled={spinning || undefined} onClick={() => spin()} className='spin-cta'>{spinning ? '转着呢，马上好…' : '转一下，开饭！'}</Action>
    <View className='home-links'><Button className="link-button" disabled={spinning || undefined} onClick={() => setEditing(true)}><Icon name='pencil' /><Text>编辑转盘</Text></Button><Button className="link-button" disabled={spinning || undefined} onClick={() => go('library')}><Icon name='bowl-spoon' /><Text>我的食物库</Text></Button></View>
    <ShareRound share={share} disabled={spinning} />
    <Button className='cyber-banner' disabled={spinning || undefined} onClick={() => go('cyber')}><Icon name='sparkles' /><View><Text className='banner-title'>赛博食堂</Text><Text className='fine-print'>嘴馋了？先来这儿尝一口</Text></View><Icon name='chevron-right' size={18} /></Button>
    <View className='extra-entries'><Button className='extra-entry' disabled={spinning} onClick={() => go('history')}><Icon name='history' /><Text>开饭小本本</Text><Text className='fine-print'>{state.mealHistory.length ? `记下了 ${state.mealHistory.length} 次开饭` : '看看之前选了啥'}</Text></Button><Button className='extra-entry' disabled={spinning} onClick={() => go('decide')}><Icon name='dice-5' /><Text>万事转盘</Text><Text className='fine-print'>去哪玩？做什么？都能转</Text></Button></View>
    <View className='recent-choice-setting'><View className='setting-copy'><Text>最近吃过先跳过</Text><Text className='fine-print'>{!state.settings.avoidRecentOptIn ? '喜欢就常吃，想换换口味时再打开。' : choices.fallback ? '剩下的最近都选过，这轮先不避重。' : choices.skipped ? `本轮跳过 ${choices.skipped} 个最近选过的，还能选 ${choices.indexes.length} 个。` : '优先跳过最近 5 次确认选择，同名食物一起算。'}</Text></View><Switch ariaLabel='最近吃过先跳过' color='#f5663d' checked={state.settings.avoidRecentOptIn} disabled={spinning} onChange={e => update(s => ({ ...s, settings: { ...s.settings, avoidRecentOptIn: e.detail.value } }))} /></View>
    {state.lastMeal && <Text className='last-meal'>上次翻牌：{state.lastMeal.name}</Text>}
    <Text className='page-motto'>吃什么可以随便，吃饭可不能省略。</Text>
    <SupportEntry />
    <InlineAd />
    {dailyPrompt && <Sheet title='今天想吃点啥？' onClose={() => setDailyPrompt(false)}>
      <View className='daily-greeting'><Image src={asset('mascot.png')} mode='aspectFit' /><View><Text className='daily-greeting-title'>{timeGreeting()}，见到你啦</Text><Text className='fine-print'>这个时间，推荐你试试「{recommendedScene.name}」。</Text></View></View>
      <View className='scene-grid daily-scene-grid'>{dailySceneOptions.map(item => <Button className={`scene-option ${state.scene === item.id ? 'selected' : ''} ${recommendedSceneId === item.id ? 'recommended' : ''}`} key={item.id} onClick={() => chooseDailyScene(item.id)}><Icon name={item.icon} size={27} /><Text>{item.name}</Text>{recommendedSceneId === item.id && <Text className='daily-scene-badge'>此刻推荐</Text>}</Button>)}</View>
      <Button className='text-button centered daily-skip' onClick={() => setDailyPrompt(false)}>先看看再说</Button>
    </Sheet>}
    {editing && <WheelEditor onClose={() => { setEditing(false); setRotation(0); setUndo(undefined) }} />}
    {detail && <FoodDetail food={detail} onClose={() => setDetail(undefined)} />}
    {result && <FoodDetail food={result} title='就它了，怎么样？' onClose={() => setResult(undefined)}>
      <Text className='result-kicker'>先别划走，认真考虑一下。</Text>
      <Action onClick={() => { if (accepted.current) return; accepted.current = true; update(s => recordMeal(s, result, s.scene, foods.map(f => f.name))); setResult(undefined); toast('开饭盖章！已记进小本本') }}>就吃这个，开饭！</Action>
      <View className='sheet-footer'><Action secondary onClick={() => spin()}>再转一次</Action><Action secondary onClick={() => spin(result.id)}>换一个</Action></View>
      <Button className='text-button centered accent' onClick={() => excludeFoodToday(result)}>今天先不吃它，换一个</Button>
      <Button className='text-button centered' onClick={() => { const id = result.id; setResult(undefined); go('cyber', `?food=${encodeURIComponent(id)}&scene=${state.scene}`) }}>去赛博食堂尝一口<Icon name='chevron-right' size={16} /></Button>
    </FoodDetail>}
  </Page>
}
