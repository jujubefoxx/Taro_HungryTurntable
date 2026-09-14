import { useEffect, useRef, useState } from 'react'
import { Canvas, Image, Text, View } from '@tarojs/components'
import { Button } from './Button'
import { Action, Sheet } from './ui'
import { MealRecord } from '../core/model'
import { drawMealReceipt, mealReceiptContent, RECEIPT_HEIGHT, RECEIPT_WIDTH } from '../core/meal-receipt'
import { asset, toast } from '../platform'
import { canvasImage, canvasSnapshot, canvasSurface } from '../platform/canvas'
import { previewMealReceipt, saveMealReceipt } from '../platform/meal-receipt'

export function MealReceipt({ record, onClose }: { record: MealRecord; onClose: () => void }) {
  const canvasId = useRef(`receipt-${Math.random().toString(36).slice(2, 10)}`).current
  const [path, setPath] = useState('')
  const [failed, setFailed] = useState(false)
  const [plain, setPlain] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const operation = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    let cancelled = false
    let retry: ReturnType<typeof setTimeout>
    let imageTimer: ReturnType<typeof setTimeout>
    let count = 0
    setPath(''); setFailed(false); setPlain(false)
    const deadline = setTimeout(() => { cancelled = true; clearTimeout(retry); clearTimeout(imageTimer); setFailed(true) }, 6000)
    const prepare = async () => {
      try {
        const { node, context } = await canvasSurface(canvasId)
        if (cancelled) return
        // 固定导出尺寸，不受手机像素比、弹窗宽度或字体缩放影响。
        node.width = RECEIPT_WIDTH; node.height = RECEIPT_HEIGHT
        const content = mealReceiptContent(record)
        const image = await Promise.race([
          canvasImage(node, asset(`${content.art}.png`)).catch(() => undefined),
          new Promise<undefined>(resolve => { imageTimer = setTimeout(() => resolve(undefined), 1600) })
        ])
        clearTimeout(imageTimer)
        if (cancelled) return
        drawMealReceipt(context, content, image)
        const snapshot = await canvasSnapshot(node, { width: RECEIPT_WIDTH, height: RECEIPT_HEIGHT })
        if (cancelled) return
        if (!snapshot) throw new Error('小票图片没有生成')
        clearTimeout(deadline); setPlain(!image); setPath(snapshot)
      } catch {
        if (cancelled) return
        if (++count < 3) retry = setTimeout(prepare, 120)
        else { clearTimeout(deadline); setFailed(true) }
      }
    }
    retry = setTimeout(prepare, 80)
    return () => { cancelled = true; clearTimeout(retry); clearTimeout(imageTimer); clearTimeout(deadline) }
  }, [record, canvasId, attempt])
  const act = async (kind: 'save' | 'preview') => {
    if (!path || operation.current) return
    operation.current = true; setBusy(true)
    try {
      if (kind === 'preview') await previewMealReceipt(path)
      else {
        const result = await saveMealReceipt(path)
        if (mounted.current) toast(result === 'saved' ? '小票已保存，可以发给朋友啦' : '已发起图片下载；没有下载时可点预览')
      }
    } catch {
      if (mounted.current) toast(kind === 'save' ? '未能保存，请检查相册权限，或先预览图片' : '暂时打不开预览，可以试试保存图片')
    } finally { operation.current = false; if (mounted.current) setBusy(false) }
  }
  return <Sheet title='这顿的开饭小票' onClose={onClose}>
    <View className='receipt-stage'>
      <Canvas type='2d' id={canvasId} canvasId={canvasId} className='receipt-canvas' />
      {path && <Image src={path} mode='aspectFit' className='receipt-image' ariaLabel={`开饭小票：${record.food.name}`} onClick={() => { void act('preview') }} />}
      {!path && <View className='receipt-status'><Text>{failed ? '小票这次没印出来' : '正在印小票…'}</Text><Text className='fine-print'>{failed ? '记录还在，可以再试一次。' : '只在本机生成，不会自动保存或分享。'}</Text>{failed && <Action secondary onClick={() => setAttempt(value => value + 1)}>再试一次</Action>}</View>}
    </View>
    {plain && <Text className='fine-print'>插画暂时没加载出来，文字小票照样可以保存。</Text>}
    <View className='sheet-footer'><Action secondary disabled={!path || busy} onClick={() => { void act('preview') }}>预览图片</Action><Action disabled={!path || busy} onClick={() => { void act('save') }}>{busy ? '处理中…' : process.env.TARO_ENV === 'h5' ? '下载图片' : '保存到相册'}</Action></View>
    <Text className='fine-print receipt-note'>{process.env.TARO_ENV === 'weapp' ? '预览后长按图片可分享给朋友，也可以先保存。' : '保存图片后，可以自己发给朋友。'}只带这顿的名称、时间和一句话，不含其他记录或营养数据。</Text>
    <Button className='text-button centered' onClick={onClose}>返回这条记录</Button>
  </Sheet>
}
