import { AppState, Food, MealRecord, SceneId } from './model'

export function recordMeal(state: AppState, food: Food, scene: SceneId, candidates: string[], date = new Date().toISOString()): AppState {
  const record: MealRecord = {
    id: `meal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    date, scene, food: { ...food, nutrition: food.nutrition ? { ...food.nutrition } : undefined }, candidates: [...candidates]
  }
  return { ...state, lastMeal: { name: food.name, date }, mealHistory: [record, ...state.mealHistory].slice(0, 30) }
}

export function mealTime(date: string) {
  const d = new Date(date)
  if (!Number.isFinite(d.getTime())) return '时间没有记下来'
  const two = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`
}
