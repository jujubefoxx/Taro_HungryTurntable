import { Food, MealRecord, nameKey, normalizeName, SCENES, SceneId } from './model'

export const RECENT_MEAL_LIMIT = 5
export const MEAL_STATS_LIMIT = 30

export function confirmedMeals(history: readonly MealRecord[]) {
  const seen = new Set<string>()
  return [...history].filter(record => {
    if (record.legacy || !Number.isFinite(Date.parse(record.date)) || !nameKey(record.food.name) || seen.has(record.id)) return false
    seen.add(record.id)
    return true
  }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, MEAL_STATS_LIMIT)
}

// 手动排除优先；最近选过只作为软排除，不能让剩余选项变成零。
export function mealChoices(foods: readonly Food[], history: readonly MealRecord[], avoidRecent: boolean, excludedIds: readonly string[] = []) {
  const hardExcluded = new Set(excludedIds)
  const available = foods.flatMap((food, index) => hardExcluded.has(food.id) ? [] : [index])
  const recent = new Set(confirmedMeals(history).slice(0, RECENT_MEAL_LIMIT).map(record => nameKey(record.food.name)))
  const fresh = avoidRecent ? available.filter(index => !recent.has(nameKey(foods[index].name))) : available
  const fallback = avoidRecent && available.length > 0 && fresh.length === 0
  return { indexes: fallback ? available : fresh, skipped: fallback ? 0 : available.length - fresh.length, fallback }
}

export interface FoodFrequency { key: string; name: string; count: number }
export interface SceneFrequency { scene: SceneId; name: string; count: number }

export function mealInsights(history: readonly MealRecord[], pool: readonly Food[]) {
  const records = confirmedMeals(history)
  const frequencies = new Map<string, FoodFrequency>()
  const scenes = new Map<SceneId, SceneFrequency>()
  for (const record of records) {
    const key = nameKey(record.food.name)
    const frequency = frequencies.get(key)
    if (frequency) frequency.count++
    else frequencies.set(key, { key, name: normalizeName(record.food.name), count: 1 })
    const scene = SCENES.find(item => item.id === record.scene)
    if (scene) {
      const frequency = scenes.get(scene.id)
      if (frequency) frequency.count++
      else scenes.set(scene.id, { scene: scene.id, name: scene.name, count: 1 })
    }
  }
  const seen = new Set<string>()
  const notChosen = records.length ? pool.filter(food => {
    const key = nameKey(food.name)
    if (!key || seen.has(key) || frequencies.has(key)) return false
    seen.add(key)
    return true
  }) : []
  return {
    recordCount: records.length,
    frequent: [...frequencies.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    notChosen,
    scenes: [...scenes.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }
}
