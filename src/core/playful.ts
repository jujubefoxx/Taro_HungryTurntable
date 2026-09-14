import { chooseIndex, Food } from './model'

export const MASCOT_REPLIES = [
  '我负责转，你负责好好吃饭。',
  '今天也要吃点喜欢的呀。',
  '随便吃点，也值得认真一点。',
  '别盯着我啦，转盘在下面。',
  '喜欢的可以常吃，开心就好。',
  '菜单你来定，纠结交给我。'
] as const

export function nextMascotReply(previous?: number, random = Math.random) {
  return chooseIndex(MASCOT_REPLIES.length, previous, random)
}

export function pickSurpriseFood(pool: readonly Food[], currentId: string, random = Math.random): Food | undefined {
  const alternatives = pool.filter(food => food.id !== currentId)
  const choices = alternatives.length ? alternatives : pool
  return choices.length ? choices[chooseIndex(choices.length, undefined, random)] : undefined
}

export const SURPRISE_REVEAL_MS = 520
export const SURPRISE_MAX_WAIT_MS = 1800
