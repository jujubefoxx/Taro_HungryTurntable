import { useEffect, useRef, useState } from 'react'
import { Canvas, Image, Text, View } from '@tarojs/components'
import { Button } from './Button'
import Taro from '@tarojs/taro'
import { Food } from '../core/model'
import { FoodImage, Icon } from './ui'
import { canvasSnapshot, canvasSurface } from '../platform/canvas'
import { wheelLayout, wheelTextLines } from '../core/wheel-layout'

export function Wheel({ foods, rotation, spinning, reducedMotion, onSpin, onFood, generic = false }: { foods: Food[]; rotation: number; spinning: boolean; reducedMotion: boolean; onSpin: () => void; onFood: (food: Food) => void; generic?: boolean }) {
  const motion = spinning ? `transform ${reducedMotion ? '0.12s' : '4.2s'} cubic-bezier(.12,.72,.12,1)` : 'none'
  const arrangementKey = foods.map(food => `${food.id}:${food.name}`).join('|')
  const [ready, setReady] = useState(false)
  const [backdrop, setBackdrop] = useState('')
  const retries = useRef(0)
  const canvasId = useRef(`wheel-${Math.random().toString(36).slice(2, 10)}`).current
  useEffect(() => {
    let disposed = false
    retries.current = 0
    let timer: ReturnType<typeof setTimeout>
    const draw = async () => {
      try {
        const { node, context: ctx, size: width } = await canvasSurface(canvasId)
        if (disposed) return
        const radius = width / 2
        ctx.clearRect(0, 0, width, width)
        const colors = ['#ffe8a0', '#e1eacb', '#fff3d4']
        foods.forEach((_, i) => {
          const start = (i - 0.5) * 2 * Math.PI / foods.length - Math.PI / 2
          ctx.beginPath(); ctx.moveTo(radius, radius); ctx.arc(radius, radius, radius - 2, start, start + 2 * Math.PI / foods.length)
          ctx.closePath(); ctx.fillStyle = colors[i % 3]; ctx.fill()
          ctx.strokeStyle = '#807059'; ctx.lineWidth = 0.7; ctx.stroke()
        })
        const snapshot = await canvasSnapshot(node)
        if (disposed) return
        setBackdrop(snapshot)
        setReady(true)
      } catch { if (!disposed && retries.current++ < 20) timer = setTimeout(draw, 100) }
    }
    timer = setTimeout(draw, 30)
    Taro.onWindowResize(draw)
    return () => { disposed = true; clearTimeout(timer); Taro.offWindowResize(draw) }
  }, [foods.length, canvasId])
  return <View className={`wheel-stage ${spinning ? 'is-spinning' : ''}`}>
    <Canvas type='2d' id={canvasId} canvasId={canvasId} className='render-canvas' />
    <View className='wheel-pointer'><Icon name='chevron-down' size={32} /></View>
    <View className={`wheel-disc ${generic ? 'generic-wheel' : ''}`} style={{ transform: `rotate(${rotation}deg)`, transition: motion }}>
      {backdrop && <Image src={backdrop} className='wheel-canvas' mode='scaleToFill' />}
      {!ready && <Text className='wheel-loading'>正在摆盘…</Text>}
      {foods.map((food, index) => {
        const angle = index * 2 * Math.PI / foods.length
        const lines = wheelTextLines(food.name, foods.length)
        const layout = wheelLayout(foods.length, lines.length)
        return <Button key={food.id} className={`wheel-food count-${foods.length}`} disabled={spinning || undefined} ariaLabel={`查看${generic ? '选项' : '食物'}：${food.name}`} style={{ left: `${50 + Math.sin(angle) * layout.orbit * 100}%`, top: `${50 - Math.cos(angle) * layout.orbit * 100}%`, width: `${layout.width * 100}%`, height: `${layout.height * 100}%`, transform: `translate(-50%, -50%) rotate(${-rotation}deg)`, transition: motion }} onClick={() => onFood(food)}>
          <View key={arrangementKey} className='wheel-food-upright wheel-option-enter' style={{ animationDelay: `${index * 18}ms` }}><View className='wheel-art-slot' style={{ width: Taro.pxTransform(layout.artSize), height: Taro.pxTransform(layout.artSize) }}>{generic ? <View className='idea-icon'><Icon name='bulb' /></View> : <FoodImage food={food} />}</View><View className='wheel-label' style={{ fontSize: Taro.pxTransform(layout.fontSize), height: Taro.pxTransform(layout.labelHeight) }}>{lines.map((line, i) => <Text key={i} className='wheel-label-line' style={{ lineHeight: Taro.pxTransform(layout.lineHeight) }}>{line}</Text>)}</View></View>
        </Button>
      })}
    </View>
    <Button className={`wheel-center ${generic ? 'wheel-center-idea' : ''} ${spinning && !reducedMotion ? 'is-cheering' : ''}`} onClick={onSpin} disabled={(spinning || !ready) || undefined} ariaLabel={!ready ? '正在准备转盘' : spinning ? '正在转动' : generic ? '开始转盘，帮我选一个' : '开始转盘，戳我开饭'}>
      <View className='wheel-center-art'>{generic ? <View className='wheel-dice-badge'><View className='wheel-lucky-dice'>{['top-left', 'top-right', 'middle', 'bottom-left', 'bottom-right'].map(position => <View key={position} className={`wheel-dice-pip ${position}`} />)}</View><View className='wheel-center-spark spark-left' /><View className='wheel-center-spark spark-right' /></View> : <View className='meal-bell'><View className='meal-bell-knob' /><View className='meal-bell-dome' /><View className='meal-bell-base' /><View className='wheel-center-spark spark-left' /><View className='wheel-center-spark spark-right' /></View>}</View>
      <Text className='wheel-center-caption'>{!ready ? '准备中' : spinning ? '转呀转' : generic ? '帮我选吧' : '戳我开饭'}</Text>
    </Button>
  </View>
}
