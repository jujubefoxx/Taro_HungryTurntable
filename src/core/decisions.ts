import { DecisionWheel, nameError, nameKey, normalizeName } from './model'

export const DECISION_TEMPLATES = [
  { title: '周末去哪撒欢？', options: ['公园晒太阳', '逛一家小书店', '看场电影', '在家躺平'] },
  { title: '下一站，去旅行！', options: ['成都', '大理', '杭州', '青岛', '长沙', '厦门'] },
  { title: '明天先做哪件事？', options: ['整理房间', '读二十页书', '散步半小时', '完成一个小目标'] }
]
export function decisionError(title: string, options: string[]) {
  if (nameError(title)) return '给转盘起个名字，1～20 字就好'
  if (options.length < 2 || options.length > 10) return '请放入 2～10 个选项'
  if (options.some(n => nameError(n))) return '每个选项都要填写，最多 20 字'
  if (new Set(options.map(nameKey)).size !== options.length) return '有重复的选项，改一下再保存吧'
}
export function newDecision(title = '', options = ['', '']): DecisionWheel {
  return { id: `decision-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, title: normalizeName(title), options: options.map(normalizeName) }
}
