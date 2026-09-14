import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from '../../components/Button'
import { FoodDetail, FoodImage, Icon, Page, Action } from '../../components/ui'
import { foodCapacityError, makeFood, MealRecord, nameKey, SCENES, uniqueNames } from '../../core/model'
import { mealTime } from '../../core/history'
import { useApp } from '../../state/store'
import { back, toast } from '../../platform'
import { MealInsights } from '../../components/MealInsights'
import { MealReceipt } from '../../components/MealReceipt'

export default function History() {
  const { state, update } = useApp()
  const [selected, setSelected] = useState<MealRecord>()
  const [receipt, setReceipt] = useState(false)
  const replay = (record: MealRecord) => {
    const candidates = uniqueNames(record.candidates).slice(0, 10)
    if (candidates.length < 2) return toast('这条记录没有留下完整候选项')
    const scene = record.scene || state.scene
    const current = state.scenes[scene]
    const missing = candidates.filter(name => !current.pool.some(food => nameKey(food.name) === nameKey(name)))
    const capacity = foodCapacityError(current.pool.length, missing.length)
    if (capacity) return toast(`${capacity}，暂时无法恢复这一轮`)
    update(s => {
      const sceneState = s.scenes[scene]
      const pool = [...sceneState.pool]
      const wheel = candidates.map(name => {
        const existing = pool.find(food => nameKey(food.name) === nameKey(name))
        if (existing) return existing.id
        const base = makeFood(name)
        const created = nameKey(record.food.name) === nameKey(name) ? { ...record.food, id: base.id, name } : base
        pool.push(created)
        return created.id
      })
      return { ...s, scene, scenes: { ...s.scenes, [scene]: { pool, wheel } } }
    })
    setSelected(undefined)
    toast('这一轮已经放回转盘啦')
    back()
  }
  return <Page title='开饭小本本'>
    <View className='section-hero'><Icon name='history' size={34} /><Text className='page-title'>之前都选了啥来吃？</Text><Text className='muted'>点过“就吃这个，开饭！”的都记在这里，保留最近 30 条。</Text></View>
    <MealInsights />
    {!state.mealHistory.length ? <View className='empty-state history-empty'><FoodImage food={{ art: 'mascot', name: '等你开饭的小饭团' }} /><Text className='section-title'>还没开张，先选一顿？</Text><Text className='muted'>选好了就点「就吃这个，开饭！」<Text>这顿吃什么，帮你记着。</Text></Text><Action onClick={back}>先返回</Action></View> : <View className='history-list'>{state.mealHistory.map((record, index) => <Button key={record.id} className='history-row' ariaLabel={`查看开饭记录：${record.food.name}`} onClick={() => setSelected(record)}><FoodImage food={record.food} /><View className='history-copy'><Text className='fine-print'>{index === 0 ? '最近一顿 · ' : ''}{mealTime(record.date)}</Text><Text className='food-name'>{record.food.name}</Text><Text className='in-wheel'>{record.legacy ? '旧版记录' : SCENES.find(s => s.id === record.scene)?.name || '开饭啦'}</Text></View><Icon name='chevron-right' size={18} /></Button>)}</View>}
    <Text className='page-motto'>这里记的是你选了什么，不代表实际吃了多少。</Text>
    {selected && !receipt && <FoodDetail food={selected.food} title='这顿选了它' onClose={() => setSelected(undefined)}><View className='history-detail'><Text className='section-title'>记录时间</Text><Text>{mealTime(selected.date)}</Text><Text className='section-title'>当时的分类</Text><Text>{SCENES.find(s => s.id === selected.scene)?.name || '旧记录没有留下分类'}</Text><Text className='section-title'>当时还考虑了这些</Text>{selected.candidates.length ? <View className='history-candidates'>{selected.candidates.map((name, i) => <Text className={name === selected.food.name ? 'chosen' : ''} key={i}>{name}</Text>)}</View> : <Text className='muted'>这条旧版记录没有保存其他候选项。</Text>}<Action secondary className='history-replay' onClick={() => setReceipt(true)}>生成开饭小票</Action>{selected.candidates.length >= 2 && <Action className='history-replay' onClick={() => replay(selected)}>按这一轮再转一次</Action>}<Text className='fine-print'>这里保留当时的食物信息。之后改名、删除食物或重置食物库，都不会影响这条记录。</Text></View></FoodDetail>}
    {selected && receipt && <MealReceipt record={selected} onClose={() => setReceipt(false)} />}
  </Page>
}
