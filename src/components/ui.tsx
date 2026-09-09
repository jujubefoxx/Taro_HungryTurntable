import { CSSProperties, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Image, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button } from './Button'
import { asset, back, go, navigationMetrics } from '../platform'
import { Food, SCENES, SceneId, displayArt } from '../core/model'
import { useApp } from '../state/store'
import { calorieText } from '../core/nutrition'
import { lockSheetBackground } from '../platform/scroll-lock'
import { availableMacros } from '../core/nutrition-display'

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return <Image className='icon' src={asset(`icons/${name}.png`)} style={{ width: `${size}px`, height: `${size}px` }} mode='aspectFit' />
}
export function Action({ children, onClick, disabled, secondary = false, className = '', label }: PropsWithChildren<{ onClick: () => void; disabled?: boolean; secondary?: boolean; className?: string; label?: string }>) {
  return <Button className={`${secondary ? 'btn-secondary' : 'btn-primary'} ${className}`} onClick={onClick} disabled={disabled || undefined} ariaLabel={label}>{children}</Button>
}
export function IconButton({ name, label, onClick, disabled }: { name: string; label: string; onClick: () => void; disabled?: boolean }) {
  return <Button className='icon-button' ariaLabel={label} onClick={onClick} disabled={disabled || undefined}><Icon name={name} /></Button>
}
export function FoodImage({ food, className = '', style }: { food: Pick<Food, 'art' | 'name' | 'artLocked'>; className?: string; style?: CSSProperties }) {
  const art = displayArt(food)
  return <Image className={`food-image food-art-${art} ${className}`} style={style} src={asset(`${art}.png`)} mode='aspectFit' ariaLabel={food.name} />
}
export function Page({ children, title, home = false }: PropsWithChildren<{ title?: string; home?: boolean }>) {
  const { storageNotice, state } = useApp()
  const [nav, setNav] = useState(navigationMetrics)
  useDidShow(() => setNav(navigationMetrics()))
  useEffect(() => {
    const resize = () => setNav(navigationMetrics())
    Taro.onWindowResize(resize)
    return () => Taro.offWindowResize(resize)
  }, [])
  return <View className={`page ${state.settings.reducedMotion ? 'reduce-motion' : ''}`}>
    <View className='navigation-shell' style={{ paddingTop: `${nav.top}px`, paddingBottom: `${nav.gap}px` }}><View className='appbar' style={{ height: `${nav.height}px`, minHeight: `${nav.height}px`, paddingRight: `${nav.right}px`, marginBottom: 0 }}>
      {home ? <View className='brand'><View className='brand-stamp'><Image className='brand-mark' src={asset('mascot.png')} mode='aspectFit' /></View><View className='brand-copy'><Text className='brand-title'>今天<Text className='brand-title-accent'>吃啥</Text></Text><Text className='brand-tagline'>专治“随便吃点”</Text></View></View> : <View className='bar-title'><IconButton name='chevron-left' label='返回' onClick={back} /><Text>{title}</Text></View>}
      {home && <IconButton name='settings' label='设置' onClick={() => go('settings')} />}
    </View></View>
    {storageNotice && <View className='notice'>{storageNotice}</View>}
    {children}
  </View>
}
export function Sheet({ children, title, onClose }: PropsWithChildren<{ title: string; onClose: () => void }>) {
  const contentId = useRef(`sheet-${Math.random().toString(36).slice(2, 10)}`).current
  const [contentHeight, setContentHeight] = useState<number>()
  const [entered, setEntered] = useState(false)
  useEffect(lockSheetBackground, [])
  useEffect(() => {
    let disposed = false
    const measure = () => Taro.createSelectorQuery().select(`#${contentId}`).boundingClientRect(rect => {
      const size = Array.isArray(rect) ? rect[0] : rect
      if (!disposed && size?.height) { setContentHeight(Math.ceil(size.height)); setEntered(true) }
    }).exec()
    const timer = setTimeout(measure, 30)
    // 首帧先测量再入场，避免从兜底高度突然跳成内容高度；测量失败也不能挡住操作。
    const fallback = setTimeout(() => { if (!disposed) setEntered(true) }, 220)
    Taro.onWindowResize(measure)
    return () => { disposed = true; clearTimeout(timer); clearTimeout(fallback); Taro.offWindowResize(measure) }
  }, [children, contentId])
  return <View className='overlay' catchMove onClick={onClose}>
    <View className={`sheet ${entered ? 'sheet-entered' : 'sheet-pending'}`} onClick={e => e.stopPropagation()}>
      <View className='sheet-heading'><Text>{title}</Text><IconButton name='x' label='关闭' onClick={onClose} /></View>
      <ScrollView scrollY className='sheet-scroll' style={{ height: contentHeight === undefined ? '65vh' : `${contentHeight}px` }}><View id={contentId} className='sheet-content'>{children}</View></ScrollView>
    </View>
  </View>
}
export function SceneTabs({ disabled = false }: { disabled?: boolean }) {
  const { state, update } = useApp()
  const [open, setOpen] = useState(false)
  const change = (scene: SceneId) => { update(s => ({ ...s, scene })); setOpen(false) }
  return <>
    <View className='scene-tabs'>
      {SCENES.slice(0, 3).map(s => <Button key={s.id} disabled={disabled || undefined} className={`scene-tab ${state.scene === s.id ? 'active' : ''}`} onClick={() => change(s.id)}>{s.name}</Button>)}
      <Button className={`scene-tab more ${!['all', 'drink', 'sweet'].includes(state.scene) ? 'active' : ''}`} disabled={disabled || undefined} onClick={() => setOpen(true)}>{SCENES.slice(3).find(s => s.id === state.scene)?.name || '全部'}<Icon name='chevron-down' size={15} /></Button>
    </View>
    {open && <Sheet title='这顿想怎么吃？' onClose={() => setOpen(false)}><View className='scene-grid'>
      {SCENES.map(s => <Button className={`scene-option ${state.scene === s.id ? 'selected' : ''}`} key={s.id} onClick={() => change(s.id)}><Icon name={s.icon} size={28} /><Text>{s.name}</Text></Button>)}
    </View></Sheet>}
  </>
}
export function NutritionLine({ food }: { food: Food }) {
  const { state } = useApp()
  if (!state.settings.nutrition) return null
  return <Text className='nutrition-line'>{food.nutrition ? `${food.nutrition.kind === 'estimate' ? '粗估' : '约'} ${calorieText(food.nutrition)} kcal / ${food.nutrition.serving} · 仅供参考` : '营养数据待补充 · 不代表 0 热量'}</Text>
}
export function FoodDetail({ food, onClose, children, title = '来，看看这个' }: PropsWithChildren<{ food: Food; onClose: () => void; title?: string }>) {
  const { state } = useApp()
  const n = food.nutrition
  const macros = availableMacros(n)
  return <Sheet title={title} onClose={onClose}>
    <View className='food-detail'><FoodImage food={food} /><Text className='food-detail-name'>{food.name}</Text></View>
    {state.settings.nutrition && <View className='nutrition-card'>
      <Text className='section-title'>营养参考</Text>
      {n ? <><Text className='calorie'>{calorieText(n)}<Text className='unit'> kcal / {n.serving}</Text></Text>{n.kind === 'estimate' && <Text className='muted'>{n.kcalMax === undefined ? '粗略估算' : '粗估区间'} · {n.note}{n.kcalMax !== undefined && ' 实际值也可能超出区间。'}</Text>}{macros.length > 0 && <View className='macros'>{macros.map(({ label, value }) => <View key={label}><Text>{label}</Text><Text>{n.kind === 'estimate' ? '约 ' : ''}{value} g</Text></View>)}</View>}<Text className='fine-print'>来源：{n.source}</Text></> : <Text className='muted'>这份食物还没有可靠的营养数据，不能按 0 热量计算。可以在食物库编辑时按包装标示补充。</Text>}
      <Text className='fine-print'>仅供参考。份量、食材和做法都会影响实际数值，不作为个体饮食建议。</Text>
    </View>}
    {!state.settings.nutrition && <View className='nutrition-hint'><Icon name='leaf' size={22} /><View><Text className='section-title'>想看看热量？</Text><Text className='fine-print'>到「设置」打开“显示营养参考”，就能查看已有的热量和营养信息。仅供参考。</Text><Button className='text-button accent' onClick={() => { onClose(); go('settings') }}>去设置里打开<Icon name='chevron-right' size={16} /></Button></View></View>}
    {children}
  </Sheet>
}
