import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from './Button'
import { mealInsights } from '../core/meal-insights'
import { SCENES } from '../core/model'
import { useApp } from '../state/store'

export function MealInsights() {
  const { state } = useApp()
  const [expanded, setExpanded] = useState(false)
  const insights = mealInsights(state.mealHistory, state.scenes[state.scene].pool)
  const scene = SCENES.find(item => item.id === state.scene)!
  if (!insights.recordCount) return <Text className='insights-note fine-print'>攒下确认开饭的记录后，这里会帮你整理常选食物和分类。旧版记录不参与统计。</Text>
  const notChosen = expanded ? insights.notChosen : insights.notChosen.slice(0, 6)
  return <View className='meal-insights'>
    <View className='insights-heading'><Text className='section-title'>吃饭小偏好</Text><Text className='fine-print'>根据本机最近 {insights.recordCount} 次确认选择，最多 30 条，不含旧版记录。</Text></View>
    <View className='insight-section'>
      <Text className='insight-title'>最近常吃</Text><Text className='fine-print'>其实是你最近常选的，次数相同时先看新记录。</Text>
      <View className='insight-ranks'>{insights.frequent.map(item => <View className='insight-rank' key={item.key}><Text>{item.name}</Text><Text>{item.count} 次</Text></View>)}</View>
    </View>
    <View className='insight-section'>
      <Text className='insight-title'>最近没吃</Text><Text className='fine-print'>「{scene.name}」食物库中，没有出现在上述记录里的选项，不代表实际没吃过。</Text>
      {notChosen.length ? <View className='insight-chips'>{notChosen.map(food => <Text key={food.id}>{food.name}</Text>)}</View> : <Text className='insights-note fine-print'>这个分类的食物最近都选过啦。</Text>}
      {insights.notChosen.length > 6 && <Button className='text-button accent' onClick={() => setExpanded(value => !value)}>{expanded ? '收起' : `看看全部 ${insights.notChosen.length} 个`}</Button>}
    </View>
    <View className='insight-section'>
      <Text className='insight-title'>常用分类</Text><Text className='fine-print'>按确认开饭次数统计，没有分类的记录不计入。</Text>
      {insights.scenes.length ? <View className='insight-ranks'>{insights.scenes.map(item => <View className='insight-rank' key={item.scene}><Text>{item.name}</Text><Text>{item.count} 次</Text></View>)}</View> : <Text className='insights-note fine-print'>还没有留下分类记录。</Text>}
    </View>
  </View>
}
