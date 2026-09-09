export const SCENES = [
  { id: 'all', name: '随便吃', subtitle: '今天这顿，交给转盘。', icon: 'tools-kitchen-2' },
  { id: 'drink', name: '喝点啥', subtitle: '喝点啥？转一下。', icon: 'cup' },
  { id: 'sweet', name: '吃点甜', subtitle: '给今天，加一点甜。', icon: 'cake' },
  { id: 'fit', name: '清爽吃', subtitle: '好好吃饭，轻松选择。', icon: 'leaf' },
  { id: 'friend', name: '朋友聚餐', subtitle: '人齐了，开饭吧。', icon: 'users' },
  { id: 'quick', name: '外卖快餐', subtitle: '忙归忙，也要吃饭。', icon: 'moped' },
  { id: 'self', name: '自己下厨', subtitle: '今天这顿，自己露一手。', icon: 'chef-hat' },
  { id: 'snacks', name: '夜宵时间', subtitle: '夜色正好，来口宵夜。', icon: 'moon' }
] as const
export type SceneId = typeof SCENES[number]['id']
export type FoodArt = 'hotpot' | 'sushi' | 'burger' | 'noodles' | 'pizza' | 'grill' | 'dumplings' | 'salad' | 'drink' | 'dessert' | 'rice' | 'fruit' | 'mascot' | 'coffee' | 'tea' | 'milk' | 'lemonade' | 'juice' | 'matcha' | 'fish' | 'pudding' | 'icecream' | 'bun' | 'sandwich' | 'shrimp' | 'chicken' | 'vegetables' | 'pastry' | 'tart'
export const FOOD_ARTS: { id: FoodArt; name: string }[] = [
  { id: 'hotpot', name: '火锅' }, { id: 'sushi', name: '寿司' }, { id: 'burger', name: '汉堡' },
  { id: 'noodles', name: '粉面' }, { id: 'pizza', name: '披萨' }, { id: 'grill', name: '烧烤' },
  { id: 'dumplings', name: '饺子' }, { id: 'salad', name: '沙拉' }, { id: 'drink', name: '奶茶' },
  { id: 'coffee', name: '咖啡' }, { id: 'tea', name: '清茶' }, { id: 'milk', name: '牛奶豆浆' },
  { id: 'lemonade', name: '柠檬水' }, { id: 'juice', name: '果汁' }, { id: 'matcha', name: '抹茶' },
  { id: 'dessert', name: '蛋糕' }, { id: 'pastry', name: '麻薯泡芙' }, { id: 'tart', name: '蛋挞' }, { id: 'pudding', name: '布丁' }, { id: 'icecream', name: '冰淇淋' },
  { id: 'fish', name: '鱼类' }, { id: 'shrimp', name: '虾类' }, { id: 'chicken', name: '鸡肉' },
  { id: 'bun', name: '包子馒头' }, { id: 'sandwich', name: '三明治' }, { id: 'vegetables', name: '蔬菜' },
  { id: 'rice', name: '饭粥' }, { id: 'fruit', name: '水果' }, { id: 'mascot', name: '小饭团' }
]
export interface Nutrition {
  kcal: number
  kcalMax?: number
  kind?: 'estimate'
  note?: string
  serving: string
  protein?: number
  carbs?: number
  fat?: number
  source: string
  sourceUrl?: string
  checkedAt: string
}
export interface Food { id: string; name: string; art: FoodArt; artLocked?: boolean; nutrition?: Nutrition; nutritionEdited?: boolean }
export const MAX_FOODS_PER_SCENE = 200
export function foodCapacityError(current: number, added: number) {
  return added > 0 && current + added > MAX_FOODS_PER_SCENE ? `每个分类最多 ${MAX_FOODS_PER_SCENE} 份食物，请先移除不需要的食物` : undefined
}
export interface SceneState { pool: Food[]; wheel: string[] }
export interface Settings { nutrition: boolean; sound: boolean; haptics: boolean; reducedMotion: boolean }
export interface MealRecord {
  id: string
  date: string
  food: Food
  scene?: SceneId
  candidates: string[]
  legacy?: boolean
}
export interface DecisionWheel { id: string; title: string; options: string[] }
export interface AppState {
  version: 2
  scene: SceneId
  scenes: Record<SceneId, SceneState>
  settings: Settings
  lastMeal?: { name: string; date: string }
  mealHistory: MealRecord[]
  decisionWheels: DecisionWheel[]
  activeDecision: string
}

export const normalizeName = (name: string) => name.normalize('NFKC').replace(/\s+/g, ' ').trim()
export const nameKey = (name: string) => normalizeName(name).toLocaleLowerCase()
export function nameError(name: string): string | undefined {
  const n = normalizeName(name)
  if (!n) return '先给食物起个名字吧'
  if ([...n].length > 20) return '名字有点长，最多 20 字'
}
export function uniqueNames(names: unknown[]): string[] {
  const seen = new Set<string>()
  return names.filter((n): n is string => typeof n === 'string').map(normalizeName).filter(n => {
    if (!n || seen.has(nameKey(n))) return false
    seen.add(nameKey(n)); return true
  })
}
export function parseFoodText(text: string) {
  const raw = text.split(/[\s,，;；、]+/u).filter(Boolean)
  const names = uniqueNames(raw)
  return { names: names.filter(n => !nameError(n)), invalid: names.filter(n => nameError(n)), duplicates: raw.length - names.length }
}
export function sample<T>(items: readonly T[], count: number, random = Math.random): T[] {
  if (count > items.length || count < 0) throw new Error('候选食物不足')
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}
export function chooseIndex(length: number, excluded?: number, random = Math.random) {
  const choices = Array.from({ length }, (_, i) => i).filter(i => i !== excluded)
  if (!choices.length) throw new Error('至少需要一个可选食物')
  return choices[Math.floor(random() * choices.length)]
}
export function targetRotation(current: number, index: number, count: number) {
  const target = (360 - index * 360 / count) % 360
  return current + 360 * 5 + ((target - current % 360 + 360) % 360)
}
export function validateWheel(ids: string[], pool: Food[]) {
  if (ids.length < 2 || ids.length > 10) return '转盘需要 2～10 个选项'
  if (new Set(ids).size !== ids.length) return '同一转盘不能重复添加食物'
  if (ids.some(id => !pool.some(f => f.id === id))) return '有食物已被移除，请重新选择'
}
export function legacyArtForName(name: string): FoodArt {
  if (/火锅|麻辣烫|冒菜|砂锅|酸菜鱼/.test(name)) return 'hotpot'
  if (/汉堡|鸡腿堡/.test(name)) return 'burger'
  if (/披萨|比萨/.test(name)) return 'pizza'
  if (/寿司|刺身/.test(name)) return 'sushi'
  if (/面|米粉|河粉|炒粉|粉丝/.test(name)) return 'noodles'
  if (/饺|馄饨|包子|小笼包|云吞/.test(name)) return 'dumplings'
  if (/烤|烧肉|牛排|鸡翅/.test(name)) return 'grill'
  if (/奶|茶|咖啡|果汁|豆浆|水$/.test(name)) return 'drink'
  if (/蛋糕|甜|布丁|挞|冰淇淋|麻薯|泡芙/.test(name)) return 'dessert'
  if (/苹果|香蕉|草莓|橙子|水果|西瓜|葡萄/.test(name)) return 'fruit'
  if (/沙拉|西兰花|青菜|蔬菜|玉米/.test(name)) return 'salad'
  if (/饭|粥/.test(name)) return 'rice'
  return 'mascot'
}
function previousDrinkArtForName(name: string): FoodArt {
  if (/蛋糕|布丁|冰淇淋|泡芙|提拉米苏|麻薯|蛋挞/.test(name)) return 'dessert'
  if (/沙拉/.test(name)) return 'salad'
  if (/抹茶/.test(name)) return 'matcha'
  if (/珍珠|奶茶|黑糖/.test(name)) return 'drink'
  if (/咖啡|拿铁|美式|可可/.test(name)) return 'coffee'
  if (/柠檬水|苏打水|气泡水/.test(name)) return 'lemonade'
  if (/果汁|西瓜汁|橙汁|水果茶/.test(name)) return 'juice'
  if (/茉莉|乌龙|红茶|绿茶|花茶|清茶/.test(name)) return 'tea'
  if (/牛奶|豆浆/.test(name)) return 'milk'
  return legacyArtForName(name)
}
export function artForName(name: string): FoodArt {
  if (/布丁/.test(name)) return 'pudding'
  if (/冰淇淋|冰激凌|雪糕/.test(name)) return 'icecream'
  if (/蛋糕|提拉米苏/.test(name)) return 'dessert'
  if (/蛋挞|蛋撻/.test(name)) return 'tart'
  if (/泡芙|麻薯/.test(name)) return 'pastry'
  if (/沙拉/.test(name)) return 'salad'
  if (/奶茶/.test(name)) return 'drink'
  if (/牛奶|豆浆|奶昔|酸奶/.test(name)) return 'milk'
  if (/茶/.test(name)) return 'tea'
  if (/咖啡|拿铁|美式|可可/.test(name)) return 'coffee'
  if (/柠檬水|苏打水|气泡水|矿泉水|白开水/.test(name)) return 'lemonade'
  if (/果汁|西瓜汁|橙汁|椰汁/.test(name)) return 'juice'
  if (/汉堡|鸡腿堡/.test(name)) return 'burger'
  if (/三明治|吐司/.test(name)) return 'sandwich'
  if (/包子|小笼包|馒头|生煎包|叉烧包/.test(name)) return 'bun'
  if (/面|米粉|河粉|炒粉|粉丝|肠粉/.test(name)) return 'noodles'
  if (/饭|粥/.test(name)) return 'rice'
  if (/鱼/.test(name) && !/鱼香/.test(name)) return 'fish'
  if (/虾/.test(name)) return 'shrimp'
  if (/鸡肉|鸡翅|鸡腿|炸鸡|鸡排|猪肚鸡/.test(name)) return 'chicken'
  if (/西兰花|青菜|蔬菜|玉米|包菜|黄瓜/.test(name)) return 'vegetables'
  return legacyArtForName(name)
}
// 不改写旧缓存；只细化原本按名称自动匹配的图案。手选图案锁定后不再跟随名称。
export function displayArt(food: Pick<Food, 'name' | 'art' | 'artLocked'>): FoodArt {
  return !food.artLocked && [legacyArtForName(food.name), previousDrinkArtForName(food.name)].includes(food.art) ? artForName(food.name) : food.art
}
export function makeFood(name: string): Food {
  return { id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, name: normalizeName(name), art: artForName(name) }
}
