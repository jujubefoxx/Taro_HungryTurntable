import { displayArt, FoodArt, MealRecord } from './model'
import { mealTime } from './history'

export const RECEIPT_WIDTH = 720
export const RECEIPT_HEIGHT = 1020
export const RECEIPT_MESSAGES = [
  '今日决定：不纠结了。',
  '菜单翻篇，快乐开饭。',
  '这一顿，选自己喜欢的。',
  '肚子有着落，心情也不错。',
  '纠结到此为止，好好吃饭。'
] as const

export interface MealReceiptContent { foodName: string; time: string; message: string; art: FoodArt }

export function mealReceiptContent(record: MealRecord): MealReceiptContent {
  // 同一条记录的小票文案保持不变；不把其他记录、候选项或营养数据带进图片。
  let hash = 0
  for (const char of record.id) hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  return { foodName: record.food.name, time: mealTime(record.date), message: RECEIPT_MESSAGES[hash % RECEIPT_MESSAGES.length], art: displayArt(record.food) }
}

export function receiptTextLines(text: string, measure: (text: string) => number, maxWidth: number, maxLines: number): string[] {
  const chars = Array.from(text.replace(/\s+/g, ' ').trim())
  const lines: string[] = []
  let index = 0
  while (index < chars.length && lines.length < maxLines) {
    let line = chars[index++]
    while (index < chars.length && measure(line + chars[index]) <= maxWidth) line += chars[index++]
    if (lines.length === maxLines - 1 && index < chars.length) {
      const end = Array.from(line)
      while (end.length && measure(end.join('') + '…') > maxWidth) end.pop()
      line = end.join('') + '…'
    }
    lines.push(line)
  }
  return lines
}

export function drawMealReceipt(ctx: CanvasRenderingContext2D, content: MealReceiptContent, image?: CanvasImageSource) {
  const center = RECEIPT_WIDTH / 2
  const label = (text: string, y: number, size: number, color = '#382719', bold = false) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`
    ctx.fillStyle = color
    ctx.fillText(text, center, y)
  }
  const divider = (y: number) => {
    ctx.strokeStyle = '#d3c3a7'; ctx.lineWidth = 2; ctx.setLineDash([8, 8])
    ctx.beginPath(); ctx.moveTo(66, y); ctx.lineTo(654, y); ctx.stroke(); ctx.setLineDash([])
  }
  ctx.clearRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT)
  ctx.fillStyle = '#f1e8d5'; ctx.fillRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT)
  ctx.fillStyle = '#fffdf7'; ctx.beginPath(); ctx.moveTo(28, 28); ctx.lineTo(692, 28); ctx.lineTo(692, 970)
  for (let x = 680; x >= 32; x -= 24) { ctx.lineTo(x, 984); ctx.lineTo(x - 12, 970) }
  ctx.lineTo(28, 970); ctx.closePath(); ctx.fill()
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  label('今 天 吃 啥', 80, 26, '#876b50', true)
  label('开饭小票', 136, 52, '#382719', true)
  label('这顿，就这么定啦。', 184, 23, '#876b50')
  divider(220)
  label('本 次 选 择', 266, 23, '#876b50')
  if (image) ctx.drawImage(image, center - 104, 302, 208, 208)
  else {
    ctx.fillStyle = '#fff0c9'; ctx.beginPath(); ctx.arc(center, 404, 82, 0, Math.PI * 2); ctx.fill()
    label('开饭', 404, 42, '#be4929', true)
  }
  ctx.font = 'bold 44px sans-serif'
  const names = receiptTextLines(content.foodName, text => ctx.measureText(text).width, 572, 2)
  names.forEach((line, index) => label(line, (names.length > 1 ? 552 : 580) + index * 58, 44, '#382719', true))
  divider(650)
  label('记录时间', 696, 22, '#876b50')
  label(content.time, 734, 27)
  label(content.message, 814, 30, '#b44728', true)
  label('好好吃饭，下顿再见。', 882, 24, '#876b50')
  label('选择留念 · 非订单或消费凭证', 934, 19, '#876b50')
}
