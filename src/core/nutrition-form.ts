import { Nutrition } from './model'

export const MACRO_FIELDS = [{ key: 'protein', label: '蛋白质' }, { key: 'carbs', label: '碳水' }, { key: 'fat', label: '脂肪' }] as const
export interface NutritionDraft { kcal: string; kcalMax: string; serving: string; protein: string; carbs: string; fat: string }
export function nutritionDraft(n?: Nutrition): NutritionDraft {
  return { kcal: n ? String(n.kcal) : '', kcalMax: n?.kcalMax === undefined ? '' : String(n.kcalMax), serving: n?.serving || '', protein: n?.protein === undefined ? '' : String(n.protein), carbs: n?.carbs === undefined ? '' : String(n.carbs), fat: n?.fat === undefined ? '' : String(n.fat) }
}
export function nutritionDraftError(d: NutritionDraft): string | undefined {
  for (const [key, label, max] of [['kcal', '热量', 10000], ['kcalMax', '热量上限', 10000], ...MACRO_FIELDS.map(f => [f.key, f.label, 1000])] as [keyof NutritionDraft, string, number][]) {
    const value = d[key].trim()
    if (value && (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) > max)) return `${label}请输入 0～${max} 的有效数字`
  }
  if (!d.kcal.trim() && (d.kcalMax.trim() || MACRO_FIELDS.some(f => d[f.key].trim()))) return '还需要填写热量，可以参考包装上的数值'
  if (d.kcalMax.trim() && Number(d.kcalMax) < Number(d.kcal)) return '热量上限不能低于前面的热量'
  if (d.kcal.trim() && !d.serving.trim()) return '请填写这些数值对应的份量'
  if ([...d.serving.trim()].length > 40) return '份量说明有点长，最多 40 字'
}
export function nutritionFromDraft(d: NutritionDraft, previous?: Nutrition): Nutrition | undefined {
  if (!d.kcal.trim()) return undefined
  const range = !!d.kcalMax.trim()
  return {
    kcal: Number(d.kcal), ...(range ? { kcalMax: Number(d.kcalMax) } : {}), serving: d.serving.trim(),
    ...Object.fromEntries(MACRO_FIELDS.filter(f => d[f.key].trim()).map(f => [f.key, Number(d[f.key])])),
    // 改动部分粗估数据不能把其余预填数值变成“实测”。
    ...(range || previous?.kind === 'estimate' ? { kind: 'estimate' as const, note: '含自行填写或调整的参考值，请按实际份量和包装核对。' } : {}),
    source: '用户自行填写或调整，未经核验', checkedAt: new Date().toISOString().slice(0, 10)
  }
}
