import { FoodArt } from './model'

const DRINKS: FoodArt[] = ['drink', 'coffee', 'tea', 'milk', 'lemonade', 'juice', 'matcha']
const DISHES: FoodArt[] = ['salad', 'rice', 'noodles', 'hotpot', 'dumplings', 'grill']
// 可食部分的上下边界（相对于透明图案），不把留白、杯盖和碗底算作一口。
const CONTENT_RANGE: Partial<Record<FoodArt, [number, number]>> = {
  drink: [.4, .87], coffee: [.25, .55], tea: [.28, .77], milk: [.31, .86],
  lemonade: [.25, .82], juice: [.26, .82], matcha: [.23, .58],
  salad: [.18, .66], rice: [.17, .62], noodles: [.16, .67], hotpot: [.21, .68],
  dumplings: [.27, .72], grill: [.15, .78]
}
export function foodPresentation(art: FoodArt) {
  const drink = DRINKS.includes(art)
  const container = drink || DISHES.includes(art)
  return {
    drink, container,
    emptyAsset: container ? `${art}-empty.png` : undefined,
    sound: drink ? 'sip' as const : ['salad', 'rice', 'noodles', 'hotpot'].includes(art) ? 'spoon' as const : 'crunch' as const
  }
}

export function drawMealFrame(ctx: CanvasRenderingContext2D, full: HTMLImageElement, empty: HTMLImageElement | undefined, size: number, progress: number, art?: FoodArt) {
  const p = Math.max(0, Math.min(1, progress))
  const inset = size * .08, side = size - inset * 2
  ctx.clearRect(0, 0, size, size)
  if (empty) {
    // 两层使用相同坐标，逐步露出空容器；不再对杯子和餐具做透明擦除。
    const [top, bottom] = art && CONTENT_RANGE[art] || [0, 1]
    const level = p === 0 ? 0 : p === 1 ? size : inset + side * (top + (bottom - top) * p)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, size, level); ctx.clip()
    ctx.drawImage(empty, inset, inset, side, side); ctx.restore()
    ctx.save(); ctx.beginPath(); ctx.rect(0, level, size, size - level); ctx.clip()
    ctx.drawImage(full, inset, inset, side, side); ctx.restore()
    return
  }
  if (p === 1) return
  ctx.drawImage(full, inset, inset, side, side)
  const points = [[.88, .18], [.9, .55], [.7, .88], [.25, .88], [.12, .45], [.4, .25]]
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < Math.ceil(p * 6); i++) {
    const fraction = Math.min(1, p * 6 - i)
    ctx.beginPath(); ctx.arc(size * points[i][0], size * points[i][1], size * .32 * fraction, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}
