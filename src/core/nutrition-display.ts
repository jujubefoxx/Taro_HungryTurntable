import type { Nutrition } from './model'

export function availableMacros(nutrition?: Nutrition) {
  const fields = [
    { label: '蛋白质', value: nutrition?.protein },
    { label: '碳水', value: nutrition?.carbs },
    { label: '脂肪', value: nutrition?.fat }
  ]
  return fields.filter((item): item is { label: string; value: number } =>
    typeof item.value === 'number' && Number.isFinite(item.value) && item.value >= 0)
}
