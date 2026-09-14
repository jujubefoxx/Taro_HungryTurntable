import { useEffect, useRef, useState } from 'react'
import { Canvas, Image, Text, View } from '@tarojs/components'
import { Button } from '../../components/Button'
import Taro, { useDidHide, useReady, useRouter } from '@tarojs/taro'
import { Food, SceneId, displayArt } from '../../core/model'
import { drawMealFrame, foodPresentation } from '../../core/food-presentation'
import { useApp } from '../../state/store'
import { Action, FoodImage, Icon, Page, Sheet } from '../../components/ui'
import { asset, back, createBiteAudio, toast, vibrate } from '../../platform'
import { canvasImage, canvasSnapshot, canvasSurface, Surface } from '../../platform/canvas'
import { InlineAd, SupportEntry } from '../../components/Monetization'
import { pickSurpriseFood, SURPRISE_MAX_WAIT_MS, SURPRISE_REVEAL_MS } from '../../core/playful'

const TOTAL = 6
const SNAPSHOT_DISPLAY = process.env.TARO_ENV === 'weapp'
const pickerArtOffset: Partial<Record<Food['art'], number>> = {
  burger: 7, chicken: 7, coffee: 7, tart: 7,
  matcha: 5, pizza: 5, shrimp: 5, vegetables: 5,
  bun: 11, hotpot: 11, pastry: 12, sushi: 12,
  dumplings: 17, fish: 19, grill: 4, noodles: 4,
  rice: 6, salad: 8, sandwich: 3, tea: 13
}
export default function Cyber() {
  const { state, update } = useApp()
  const router = useRouter()
  let routeFoodId = router.params.food || ''
  try { routeFoodId = decodeURIComponent(routeFoodId) } catch { /* 非法外部链接按默认食物处理。 */ }
  const pool = state.scenes[(router.params.scene as SceneId) in state.scenes ? router.params.scene as SceneId : state.scene].pool
  const [food, setFood] = useState<Food>(() => pool.find(f => f.id === routeFoodId) || pool.find(f => f.art === 'pizza') || pool[0])
  const [bites, setBites] = useState(0)
  const [chewing, setChewing] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [surprise, setSurprise] = useState<'closed' | 'opening'>()
  const surpriseLock = useRef(false)
  const revealTimer = useRef<ReturnType<typeof setTimeout>>()
  const revealFallback = useRef<ReturnType<typeof setTimeout>>()
  const lastBite = useRef(0)
  const biteRef = useRef(0)
  const motionTimer = useRef<ReturnType<typeof setTimeout>>()
  const art = displayArt(food)
  const presentation = foodPresentation(art)
  const soundKind = presentation.sound
  const painter = useRef<{ surface: Surface; full: HTMLImageElement; empty?: HTMLImageElement; art: typeof art; revision: number; progress: number }>()
  const audio = useRef<ReturnType<typeof createBiteAudio>>()
  const audioWarned = useRef(false)
  const [drawingFailed, setDrawingFailed] = useState(false)
  const [drawingReady, setDrawingReady] = useState(false)
  const [renderKey, setRenderKey] = useState(0)
  const [pageReady, setPageReady] = useState(false)
  const [mealFrames, setMealFrames] = useState<string[]>([])
  const framePaths = useRef<string[]>([])
  const loadedFrames = useRef(new Set<string>())
  // 每个页面实例使用独立画布 ID，与转盘和开饭小票保持一致。
  const canvasId = useRef(`cyber-food-${Math.random().toString(36).slice(2, 10)}`).current
  useReady(() => setPageReady(true))
  const clearRevealTimers = () => { clearTimeout(revealTimer.current); clearTimeout(revealFallback.current) }
  const finishSurprise = () => { clearRevealTimers(); surpriseLock.current = false; setSurprise(undefined) }
  const frameLoaded = (path: string) => {
    if (!framePaths.current.includes(path)) return
    loadedFrames.current.add(path)
    if (loadedFrames.current.size === framePaths.current.length) setDrawingReady(true)
  }
  useEffect(() => {
    audio.current = createBiteAudio(soundKind, () => { if (!audioWarned.current) { toast('音效暂时无法播放，可以继续体验'); audioWarned.current = true } })
    return () => audio.current?.destroy()
  }, [soundKind])
  useEffect(() => { if (!state.settings.sound) audio.current?.stop() }, [state.settings.sound])
  useEffect(() => () => { clearTimeout(motionTimer.current); clearRevealTimers() }, [])
  useDidHide(() => { audio.current?.stop(); clearTimeout(motionTimer.current); setChewing(false); finishSurprise() })
  useEffect(() => {
    if (!surprise) return
    if (state.settings.reducedMotion) { finishSurprise(); return }
    if (surprise === 'closed' && (drawingReady || drawingFailed)) {
      setSurprise('opening')
      revealTimer.current = setTimeout(finishSurprise, SURPRISE_REVEAL_MS)
    }
  }, [surprise, drawingReady, drawingFailed, state.settings.reducedMotion])
  useEffect(() => {
    if (!pageReady) return
    let cancelled = false
    let request = 0
    const prepare = async () => {
      if (cancelled) return
      const currentRequest = ++request
      setDrawingReady(false)
      framePaths.current = []; loadedFrames.current.clear(); setMealFrames([])
      try {
        const surface = await canvasSurface(canvasId)
        const [full, empty] = await Promise.all([
          canvasImage(surface.node, asset(`${art}.png`)),
          presentation.emptyAsset ? canvasImage(surface.node, asset(presentation.emptyAsset)) : undefined
        ])
        if (cancelled || currentRequest !== request) return
        if (SNAPSHOT_DISPLAY) {
          // 微信原生 Canvas 的显示层会受来源页滚动位置影响；只离屏绘制，使用普通图片参与餐盘布局。
          // 预先生成并加载每一口，进食时只切换可见帧，不再导出图片或替换图片地址。
          const frames: string[] = []
          for (let bite = 0; bite <= TOTAL; bite++) {
            drawMealFrame(surface.context, full, empty, surface.size, bite / TOTAL, art)
            const path = await canvasSnapshot(surface.node, { width: 512, height: 512 })
            if (cancelled || currentRequest !== request) return
            if (!path) throw new Error('食物图片未生成')
            frames.push(path)
          }
          framePaths.current = frames
          setDrawingFailed(false); setMealFrames(frames)
          return
        }
        const progress = biteRef.current / TOTAL
        drawMealFrame(surface.context, full, empty, surface.size, progress, art)
        painter.current = { surface, full, empty, art, revision: renderKey, progress }
        setDrawingFailed(false); setDrawingReady(true)
      } catch { if (!cancelled && currentRequest === request) setDrawingFailed(true) }
    }
    // 等待本页原生节点就绪，再获取离屏画布或 H5 画布。
    Taro.nextTick(prepare)
    Taro.onWindowResize(prepare)
    return () => { cancelled = true; framePaths.current = []; Taro.offWindowResize(prepare) }
  }, [art, renderKey, canvasId, pageReady])
  useEffect(() => {
    if (SNAPSHOT_DISPLAY) return
    const paint = painter.current
    if (!drawingReady || !paint || paint.art !== art || paint.revision !== renderKey) return
    const start = paint.progress, target = bites / TOTAL
    const steps = state.settings.reducedMotion || !bites ? 1 : 5
    let step = 0
    let timer: ReturnType<typeof setTimeout>
    const draw = () => {
      try {
        const progress = start + (target - start) * ++step / steps
        // 清除和重绘在同一同步帧内完成；进食中不重建画布、不加载图片，也不替换 Image.src。
        drawMealFrame(paint.surface.context, paint.full, paint.empty, paint.surface.size, progress, art)
        paint.progress = progress
        if (step < steps) timer = setTimeout(draw, 35)
      } catch { setDrawingFailed(true) }
    }
    draw()
    return () => clearTimeout(timer)
  }, [art, bites, renderKey, drawingReady, state.settings.reducedMotion])
  const eat = () => {
    if (surpriseLock.current || (!drawingReady && !drawingFailed) || biteRef.current >= TOTAL || Date.now() - lastBite.current < 460) return
    lastBite.current = Date.now(); biteRef.current += 1; setBites(biteRef.current)
    if (state.settings.sound) audio.current?.play()
    vibrate(state.settings.haptics)
    if (!state.settings.reducedMotion) { setChewing(true); clearTimeout(motionTimer.current); motionTimer.current = setTimeout(() => setChewing(false), 220) }
  }
  const reset = (next: Food) => { finishSurprise(); clearTimeout(motionTimer.current); audio.current?.stop(); framePaths.current = []; loadedFrames.current.clear(); setMealFrames([]); setFood(next); biteRef.current = 0; painter.current = undefined; lastBite.current = 0; setDrawingReady(false); setRenderKey(key => key + 1); setBites(0); setChewing(false); setChoosing(false); setDrawingFailed(false) }
  const openSurprise = () => {
    if (surpriseLock.current) return
    const next = pickSurpriseFood(pool, food.id)
    if (!next) return toast('先放入一份食物，再来揭晓吧')
    reset(next)
    if (state.settings.reducedMotion) return
    surpriseLock.current = true
    setSurprise('closed')
    // 图片慢或加载失败时也不能一直盖住餐盘；返回页面、手动换餐都会取消计时。
    revealFallback.current = setTimeout(finishSurprise, SURPRISE_MAX_WAIT_MS)
  }
  useEffect(() => {
    const selected = pool.find(f => f.id === routeFoodId)
    if (selected) reset(selected)
  }, [routeFoodId])
  const finished = bites === TOTAL
  return <Page title='赛博食堂'>
    {SNAPSHOT_DISPLAY && <Canvas type='2d' id={canvasId} canvasId={canvasId} className='render-canvas' onError={() => setDrawingFailed(true)} />}
    <View className='cyber-heading'><Text className='page-title'>赛博食堂</Text><Button className='sound-pill' onClick={() => update(s => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }))}><Icon name={state.settings.sound ? 'volume' : 'volume-off'} size={19} /><Text>音效{state.settings.sound ? '开' : '关'}</Text></Button></View>
    <Text className='cyber-subtitle'>{surprise ? '端好啦，看看这次是什么。' : finished ? '尝完啦！要不要换个口味？' : presentation.drink ? '来，先喝一口。' : '点一下，云吃一口。'}</Text>
    <View className={`cyber-plate ${presentation.container ? 'has-container' : ''} ${chewing ? 'chewing' : ''}`}>
      <View className='cyber-canvas' onClick={eat} ariaLabel={surprise ? '正在揭晓这一份' : `${presentation.drink ? '喝' : '吃'}一口${food.name}`}>
        {SNAPSHOT_DISPLAY ? mealFrames.map((path, index) => <Image key={path} src={path} mode='scaleToFill' className={`cyber-frame ${drawingReady && !drawingFailed && index === bites ? 'is-current' : ''}`} onLoad={() => frameLoaded(path)} onError={() => { if (framePaths.current.includes(path)) setDrawingFailed(true) }} />) : <Canvas type='2d' id={canvasId} canvasId={canvasId} className='cyber-drawing' onError={() => setDrawingFailed(true)} />}
      </View>
      {(!drawingReady || drawingFailed) && (!finished || presentation.container) && <Button className='cyber-fallback' onClick={eat} disabled={!!surprise || (!drawingReady && !drawingFailed)}>{finished && presentation.emptyAsset ? <Image className='food-image' src={asset(presentation.emptyAsset)} mode='aspectFit' /> : <FoodImage food={food} />}<Text>{drawingFailed ? `已尝 ${bites} 口 · 动画加载失败` : '正在端上桌…'}</Text></Button>}
      {finished && !presentation.container && <View className='cyber-done'><FoodImage food={{ name: '开饭小饭团', art: 'mascot' }} /><Text>好家伙，一口没剩。</Text></View>}
      {chewing && <Text className='bite-word'>{soundKind === 'sip' ? '咕噜！' : soundKind === 'spoon' ? '吸溜～' : '咔嚓！'}</Text>}
      {surprise && <View className={`surprise-cover ${surprise === 'opening' ? 'surprise-opening' : ''}`} ariaLabel='食堂盲盒正在揭晓'><View className='surprise-cloche'><View className='surprise-knob' /><View className='surprise-dome'><Text>这次吃点啥？</Text><Text className='surprise-question'>?</Text></View></View><View className='surprise-tray' /></View>}
    </View>
    <Text className='cyber-food-name'>{surprise ? '一份小惊喜，马上揭晓' : food.name}</Text>
    {finished && <Text className='cyber-tip'>{presentation.drink ? '见底了，再来一杯？' : `这份「${food.name}」，云吃完了。`}</Text>}
    <View className='bite-progress'><Text>已{presentation.drink ? '喝' : '吃'} {bites} 口 · 还剩 {TOTAL - bites} 口</Text><View className='progress-dots'>{Array.from({ length: TOTAL }, (_, i) => <View key={i} className={`progress-dot ${i < bites ? 'filled' : ''}`} />)}</View></View>
    <Action onClick={finished ? () => reset(food) : eat} disabled={!!surprise || (!drawingReady && !drawingFailed)} className='spin-cta'>{surprise ? '揭盖中，马上好…' : finished ? '没过瘾，再来一份' : soundKind === 'sip' ? '咕噜，喝一口！' : '啊呜，吃一口！'}</Action>
    <View className='home-links'><Button className="link-button" disabled={!!surprise} onClick={() => setChoosing(true)}><Icon name='refresh' /><Text>{presentation.drink ? '换一杯' : '换一个'}</Text></Button><Button className="link-button" onClick={back}><Icon name='arrow-back-up' /><Text>返回</Text></Button></View>
    <View className='cyber-disclaimer'><Icon name='heart' size={18} /><Text>仅供娱乐，不能代替真实饮食。饿了就好好吃饭。</Text></View>
    {finished && <><SupportEntry /><InlineAd /></>}
    {choosing && <Sheet title='下一口，尝点什么？' onClose={() => setChoosing(false)}><View className='food-picker'>{pool.map(f => {
      const offset = pickerArtOffset[displayArt(f)] || 0
      return <Button key={f.id} onClick={() => reset(f)}><View className='food-picker-art'><FoodImage food={f} style={offset ? { transform: `translateY(${Taro.pxTransform(offset)})` } : undefined} /></View><Text className='food-picker-label'>{f.name}</Text></Button>
    })}</View><Action secondary onClick={openSurprise}>随便来一个，揭个盲盒</Action></Sheet>}
  </Page>
}
