import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from '../../components/Button'
import { FoodDetail, FoodImage, Icon, Page, Action } from '../../components/ui'
import { MealRecord, SCENES } from '../../core/model'
import { mealTime } from '../../core/history'
import { useApp } from '../../state/store'
import { back } from '../../platform'

export default function History() {
  const { state } = useApp()
  const [selected, setSelected] = useState<MealRecord>()
  return <Page title='开饭小本本'>
    <View className='section-hero'><Icon name='history' size={34} /><Text className='page-title'>之前都选了啥来吃？</Text><Text className='muted'>点过“就吃这个，开饭！”的都记在这里，保留最近 30 条。</Text></View>
    {!state.mealHistory.length ? <View className='empty-state history-empty'><FoodImage food={{ art: 'mascot', name: '等你开饭的小饭团' }} /><Text className='section-title'>还没开张，先选一顿？</Text><Text className='muted'>选好了就点「就吃这个，开饭！」<Text>这顿吃什么，帮你记着。</Text></Text><Action onClick={back}>先返回</Action></View> : <View className='history-list'>{state.mealHistory.map((record, index) => <Button key={record.id} className='history-row' ariaLabel={`查看开饭记录：${record.food.name}`} onClick={() => setSelected(record)}><FoodImage food={record.food} /><View className='history-copy'><Text className='fine-print'>{index === 0 ? '最近一顿 · ' : ''}{mealTime(record.date)}</Text><Text className='food-name'>{record.food.name}</Text><Text className='in-wheel'>{record.legacy ? '旧版记录' : SCENES.find(s => s.id === record.scene)?.name || '开饭啦'}</Text></View><Icon name='chevron-right' size={18} /></Button>)}</View>}
    <Text className='page-motto'>这里记的是你选了什么，不代表实际吃了多少。</Text>
    {selected && <FoodDetail food={selected.food} title='这顿选了它' onClose={() => setSelected(undefined)}><View className='history-detail'><Text className='section-title'>记录时间</Text><Text>{mealTime(selected.date)}</Text><Text className='section-title'>当时的分类</Text><Text>{SCENES.find(s => s.id === selected.scene)?.name || '旧记录没有留下分类'}</Text><Text className='section-title'>当时还考虑了这些</Text>{selected.candidates.length ? <View className='history-candidates'>{selected.candidates.map((name, i) => <Text className={name === selected.food.name ? 'chosen' : ''} key={i}>{name}</Text>)}</View> : <Text className='muted'>这条旧版记录没有保存其他候选项。</Text>}<Text className='fine-print'>这里保留当时的食物信息。之后改名、删除食物或重置食物库，都不会影响这条记录。</Text></View></FoodDetail>}
  </Page>
}
