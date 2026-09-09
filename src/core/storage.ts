import { AppState, SCENES, SceneId, Food, FOOD_ARTS, uniqueNames, artForName, validateWheel, Settings } from './model'
import { initialState, presetFood } from './seeds'
import { decisionError } from './decisions'

export interface StoragePort { read(key: string): unknown; write(key: string, value: unknown): void }
export const STORAGE_KEY = 'hungry-turntable:v2'
export function isObject(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function readFood(value: unknown): Food | undefined {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !value.name.trim()) return
  const food: Food = { id: value.id, name: value.name.trim(), art: FOOD_ARTS.find(a => a.id === value.art)?.id || artForName(value.name) }
  if (value.artLocked === true) food.artLocked = true
  if (value.nutritionEdited === true) food.nutritionEdited = true
  const n = value.nutrition
  if (isObject(n) && typeof n.kcal === 'number' && Number.isFinite(n.kcal) && n.kcal >= 0 && typeof n.serving === 'string' && n.serving.trim() && typeof n.source === 'string' && typeof n.checkedAt === 'string') {
    food.nutrition = { kcal: n.kcal, serving: n.serving, source: n.source, checkedAt: n.checkedAt }
    if (typeof n.kcalMax === 'number' && Number.isFinite(n.kcalMax) && n.kcalMax >= n.kcal) food.nutrition.kcalMax = n.kcalMax
    if (n.kind === 'estimate') food.nutrition.kind = 'estimate'
    if (typeof n.note === 'string') food.nutrition.note = n.note
    for (const key of ['protein', 'carbs', 'fat'] as const) if (typeof n[key] === 'number' && Number.isFinite(n[key]) && n[key] >= 0) food.nutrition[key] = n[key]
    if (typeof n.sourceUrl === 'string' && n.sourceUrl.startsWith('https://')) food.nutrition.sourceUrl = n.sourceUrl
  }
  return food
}
function refreshPresetNutrition(food: Food): Food {
  if (food.id !== `preset:${food.name}` || food.nutritionEdited) return food
  const current = food.nutrition
  const preset = presetFood(food.name).nutrition
  if (!preset) return food
  if (!current) return { ...food, nutrition: preset }
  // 只补旧版、未编辑过的内置估值；不按菜名覆盖用户包装数据，也不修改开饭历史快照。
  if (current.kind === 'estimate' && current.source === '内置份量假设的粗略估算，非实测或特定品牌数据' && current.kcal === preset.kcal && current.kcalMax === preset.kcalMax && current.serving === preset.serving) {
    return { ...food, nutrition: { ...preset, ...Object.fromEntries((['protein', 'carbs', 'fat'] as const).filter(key => current[key] !== undefined).map(key => [key, current[key]])) } }
  }
  return food
}
export function hydrate(value: unknown): AppState | undefined {
  if (!isObject(value) || value.version !== 2 || !isObject(value.scenes)) return
  const state = initialState()
  for (const scene of SCENES) {
    const raw = value.scenes[scene.id]
    if (!isObject(raw) || !Array.isArray(raw.pool)) continue
    const seenIds = new Set<string>(); const seenNames = new Set<string>()
    const pool = raw.pool.map(readFood).filter((f): f is Food => {
      if (!f || seenIds.has(f.id) || seenNames.has(f.name.toLocaleLowerCase())) return false
      seenIds.add(f.id); seenNames.add(f.name.toLocaleLowerCase()); return true
    })
    // 原始缓存不会删除；损坏的转盘修复为有效候选项。
    if (pool.length < 2) continue
    const wheel = Array.isArray(raw.wheel) ? raw.wheel.filter((id): id is string => typeof id === 'string') : []
    state.scenes[scene.id] = { pool: pool.map(refreshPresetNutrition), wheel: validateWheel(wheel, pool) ? pool.slice(0, 8).map(f => f.id) : wheel }
  }
  if (SCENES.some(s => s.id === value.scene)) state.scene = value.scene as SceneId
  if (isObject(value.settings)) {
    for (const key of Object.keys(state.settings) as (keyof Settings)[]) if (typeof value.settings[key] === 'boolean') state.settings[key] = value.settings[key]
  }
  if (isObject(value.lastMeal) && typeof value.lastMeal.name === 'string' && typeof value.lastMeal.date === 'string') state.lastMeal = { name: value.lastMeal.name, date: value.lastMeal.date }
  if (Array.isArray(value.mealHistory)) {
    const ids = new Set<string>()
    state.mealHistory = value.mealHistory.flatMap(raw => {
      if (!isObject(raw) || typeof raw.id !== 'string' || ids.has(raw.id) || typeof raw.date !== 'string' || !Number.isFinite(Date.parse(raw.date))) return []
      const food = readFood(raw.food)
      if (!food) return []
      ids.add(raw.id)
      return [{ id: raw.id, date: raw.date, food, scene: SCENES.some(s => s.id === raw.scene) ? raw.scene as SceneId : undefined, candidates: Array.isArray(raw.candidates) ? raw.candidates.filter((n): n is string => typeof n === 'string').slice(0, 10) : [], legacy: raw.legacy === true }]
    }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 30)
  } else if (state.lastMeal && Number.isFinite(Date.parse(state.lastMeal.date))) {
    const { name, date } = state.lastMeal
    state.mealHistory = [{ id: 'legacy-last-meal', date, food: { id: 'legacy-last-meal', name, art: artForName(name) }, candidates: [], legacy: true }]
  }
  if (Array.isArray(value.decisionWheels)) {
    const ids = new Set<string>()
    const wheels = value.decisionWheels.flatMap(raw => {
      if (!isObject(raw) || typeof raw.id !== 'string' || !raw.id || ids.has(raw.id) || typeof raw.title !== 'string' || !Array.isArray(raw.options) || !raw.options.every((n): n is string => typeof n === 'string') || decisionError(raw.title, raw.options)) return []
      ids.add(raw.id)
      return [{ id: raw.id, title: raw.title, options: raw.options }]
    }).slice(0, 20)
    if (wheels.length) state.decisionWheels = wheels
  }
  state.activeDecision = state.decisionWheels.some(w => w.id === value.activeDecision) ? String(value.activeDecision) : state.decisionWheels[0].id
  return state
}
export function loadState(port: StoragePort): { state: AppState; notice?: string } {
  try {
    const saved = port.read(STORAGE_KEY)
    if (saved) {
      const state = hydrate(saved)
      if (state) return { state }
      // 先备份无法识别的数据，避免用户下次保存时丢失。
      port.write(`${STORAGE_KEY}:unreadable:${Date.now()}`, saved)
    }
    const state = initialState()
    const oldPools = port.read('typeRandomList')
    let migrated = false
    for (const scene of SCENES) {
      const oldWheel = port.read(scene.id)
      const wheelNames = Array.isArray(oldWheel) ? uniqueNames(oldWheel) : []
      const rawPool = isObject(oldPools) ? oldPools[scene.id] : undefined
      const poolNames = Array.isArray(rawPool) ? uniqueNames(rawPool) : []
      if (!wheelNames.length && !poolNames.length) continue
      const names = uniqueNames([...poolNames, ...wheelNames])
      const pool = names.map(name => ({ id: `legacy:${name}`, name, art: artForName(name) }))
      if (pool.length < 2) pool.push(...state.scenes[scene.id].pool.filter(f => !names.includes(f.name)))
      const wheel = wheelNames.length >= 2 ? wheelNames.slice(0, 10).map(n => `legacy:${n}`) : pool.slice(0, 8).map(f => f.id)
      state.scenes[scene.id] = { pool, wheel }; migrated = true
    }
    return { state, notice: migrated ? '已导入旧版食物库，原始数据也保留着' : saved ? '已保留异常缓存，并恢复可用的默认食物库' : undefined }
  } catch {
    return { state: initialState(), notice: '暂时无法读取本地数据，当前修改可能无法保存' }
  }
}
