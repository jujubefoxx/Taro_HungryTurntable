import { AppState, Food, Nutrition, SceneId, SCENES, artForName } from './model'
import { estimateNutrition } from './nutrition'

const menus: Record<SceneId, string[]> = {
  all: ['火锅', '寿司', '汉堡', '拉面', '披萨', '烤肉', '饺子', '沙拉', '麻辣烫', '蛋炒饭', '馄饨', '牛肉面', '番茄巴沙鱼', '照烧鸡腿饭', '楼下阿姨家的炒粉', '西兰花炒虾仁', '黑糖珍珠牛奶', '酸辣土豆丝盖饭', '周末限定超辣芝士鸡腿堡', '小笼包', '酸菜鱼', '烧烤', '煲仔饭', '咖喱鸡肉饭', '葱油拌面', '蒸饺', '虾仁滑蛋', '烤鸡翅', '番茄鸡蛋面', '鸡肉沙拉', '牛肉盖饭', '红烧肉饭', '清蒸鱼', '扬州炒饭', '蔬菜粥', '鸡蛋羹', '肠粉', '手撕包菜', '三明治', '小蛋糕', '绿豆沙', '豆浆', '苹果', '香蕉', '草莓', '橙子', '玉米', '包子'],
  drink: ['黑糖珍珠牛奶', '茉莉花茶', '拿铁', '冰美式', '纯牛奶', '柠檬水', '豆浆', '水果茶', '热可可', '抹茶牛奶', '乌龙茶', '西瓜汁'],
  sweet: ['草莓蛋糕', '蛋挞', '提拉米苏', '布丁', '冰淇淋', '麻薯', '泡芙', '芝士蛋糕', '红豆甜汤', '绿豆沙', '草莓', '香蕉'],
  fit: ['鸡肉沙拉', '西兰花炒虾仁', '清蒸鱼', '番茄鸡蛋汤', '玉米', '鸡蛋羹', '蔬菜粥', '凉拌黄瓜', '苹果', '香蕉', '草莓', '橙子'],
  friend: ['火锅', '烤肉', '寿司', '披萨', '酸菜鱼', '烧烤', '烤鱼', '猪肚鸡', '泰式咖喱', '铜锅涮肉', '饺子', '小龙虾'],
  quick: ['汉堡', '照烧鸡腿饭', '麻辣烫', '牛肉面', '肠粉', '蛋炒饭', '酸辣土豆丝盖饭', '咖喱鸡肉饭', '三明治', '煲仔饭', '馄饨', '蒸饺'],
  self: ['西兰花炒虾仁', '虾仁滑蛋', '番茄鸡蛋面', '手撕包菜', '蛋炒饭', '清蒸鱼', '葱油拌面', '鸡蛋羹', '咖喱鸡肉饭', '蔬菜粥', '烤鸡翅', '饺子'],
  snacks: ['烧烤', '小龙虾', '烤鸡翅', '馄饨', '蔬菜粥', '炒米粉', '饺子', '包子', '豆浆', '肠粉', '水果沙拉', '凉拌黄瓜']
}

export function presetFood(name: string): Food {
  const fruit: Record<string, { kcal: number; serving: string; carbs: number }> = {
    苹果: { kcal: 130, serving: '大号 1 个（可食部 242 克）', carbs: 34 },
    香蕉: { kcal: 110, serving: '中号 1 根（可食部 126 克）', carbs: 30 },
    草莓: { kcal: 50, serving: '中号 8 颗（可食部 147 克）', carbs: 11 },
    橙子: { kcal: 80, serving: '中号 1 个（可食部 154 克）', carbs: 19 }
  }
  const nutrition: Nutrition | undefined = fruit[name] ? { ...fruit[name], protein: 1, fat: 0, source: 'FDA 生鲜水果营养表（生食、可食部）', sourceUrl: 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/raw-fruits-poster-text-version-accessible-version', checkedAt: '2026-09-09' } : undefined
  return { id: `preset:${name}`, name, art: artForName(name), nutrition: nutrition || estimateNutrition(name) }
}
export function defaultScene(id: SceneId) {
  const pool = menus[id].map(presetFood)
  return { pool, wheel: pool.slice(0, 8).map(f => f.id) }
}
export function initialState(): AppState {
  return {
    version: 2, scene: 'all',
    scenes: Object.fromEntries(SCENES.map(s => [s.id, defaultScene(s.id)])) as AppState['scenes'],
    settings: { nutrition: false, sound: true, haptics: false, reducedMotion: false },
    mealHistory: [],
    decisionWheels: [{ id: 'weekend', title: '周末去哪撒欢？', options: ['公园晒太阳', '逛一家小书店', '看场电影', '在家快乐躺平'] }],
    activeDecision: 'weekend'
  }
}
