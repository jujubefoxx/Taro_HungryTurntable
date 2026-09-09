import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from './Button'
import { Food, FoodArt, FOOD_ARTS, makeFood, nameError, normalizeName, artForName, displayArt } from '../core/model'
import { Action, FoodImage, Sheet } from './ui'
import { FormInput } from './FormInput'
import { MACRO_FIELDS, nutritionDraft, nutritionDraftError, nutritionFromDraft } from '../core/nutrition-form'

export function FoodForm({ food, onClose, onSave }: { food?: Food; onClose: () => void; onSave: (food: Food) => string | undefined }) {
  const [name, setName] = useState(food?.name || '')
  const nameLength = [...name].length
  const legacyLongName = !!food && [...food.name].length > 20
  const [art, setArt] = useState<FoodArt | undefined>(food ? displayArt(food) : undefined)
  const [artLocked, setArtLocked] = useState(food?.artLocked === true)
  const initialNutrition = nutritionDraft(food?.nutrition)
  const [nutrition, setNutrition] = useState(initialNutrition)
  const [error, setError] = useState('')
  const save = () => {
    const normalized = normalizeName(name)
    const invalid = normalized === food?.name ? undefined : nameError(normalized)
    if (invalid) return setError(invalid)
    const nutritionError = nutritionDraftError(nutrition)
    if (nutritionError) return setError(nutritionError)
    const next: Food = { ...(food || makeFood(normalized)), name: normalized, art: art || artForName(normalized), artLocked }
    const changed = normalized !== food?.name || JSON.stringify(nutrition) !== JSON.stringify(initialNutrition)
    if (changed) { next.nutrition = nutritionFromDraft(nutrition, normalized === food?.name ? food?.nutrition : undefined); next.nutritionEdited = true }
    const err = onSave(next)
    if (err) return setError(err)
    onClose()
  }
  return <Sheet title={food ? '编辑这份食物' : '加一道好吃的'} onClose={onClose}>
    <View className='field-heading'><Text className='field-label'>食物名称</Text><Text className={`name-counter ${nameLength >= 20 ? 'at-limit' : ''}`}>{nameLength} / 20</Text></View><FormInput ariaLabel='食物名称' placeholder='例如：楼下阿姨家的炒粉' value={name} maxlength={legacyLongName ? -1 : 20} onInput={e => { setName(e.detail.value); if (food) setNutrition(nutritionDraft()) }} /><Text className={`fine-print ${nameLength >= 20 ? 'at-limit' : ''}`}>{legacyLongName && nameLength > 20 ? '旧名称可以原样保留；改名请缩短到 20 字内。' : nameLength >= 20 ? '已经 20 字了，缩短一点就能继续写。' : '最多 20 个字符，汉字、数字和字母都算一个。'}</Text>
    <Text className='field-label'>挑一个图案</Text>
    <View className='art-picker'>{FOOD_ARTS.map(item => <Button key={item.id} className={`art-choice ${(art || artForName(name)) === item.id ? 'selected' : ''}`} ariaLabel={`选择图案：${item.name}`} onClick={() => { setArt(item.id); setArtLocked(true) }}><FoodImage food={{ name: item.name, art: item.id, artLocked: true }} /><Text>{item.name}</Text></Button>)}</View>
    <View className='form-nutrition'>
      <Text className='section-title'>这份的营养信息</Text>
      <Text className='muted'>可以参考包装填写，不确定的项目就留空。</Text>
      {food?.nutrition?.kind === 'estimate' && normalizeName(name) === food.name && <Text className='fine-print'>已填入每份粗估值，不同做法会有差别。仅供参考。</Text>}
      <Text className='field-label'>对应份量</Text><FormInput ariaLabel='对应份量' placeholder='如 1 份（200 克）' value={nutrition.serving} maxlength={40} onInput={e => setNutrition({ ...nutrition, serving: e.detail.value })} />
      <View className='field-row'><View><Text className='field-label'>热量 / kcal</Text><FormInput ariaLabel='热量' type='digit' placeholder='如 250' maxlength={8} value={nutrition.kcal} onInput={e => setNutrition({ ...nutrition, kcal: e.detail.value })} /></View><View><Text className='field-label'>热量上限 / 选填</Text><FormInput ariaLabel='热量上限' type='digit' placeholder='单个数值就留空' maxlength={8} value={nutrition.kcalMax} onInput={e => setNutrition({ ...nutrition, kcalMax: e.detail.value })} /></View></View>
      <View className='macro-fields'>{MACRO_FIELDS.map(({ key, label }) => <View key={key}><Text className='field-label'>{label} / g</Text><FormInput ariaLabel={label} type='digit' placeholder='选填' maxlength={8} value={nutrition[key]} onInput={e => setNutrition({ ...nutrition, [key]: e.detail.value })} /></View>)}</View>
      <Text className='fine-print'>以上都对应同一份量。清空数值可移除；填写 0 表示确实为 0。改名后需重新填写，仅供参考。</Text>
    </View>
    {error && <Text className='error'>{error}</Text>}
    <View className='sheet-footer'><Action secondary onClick={onClose}>取消</Action><Action onClick={save}>保存食物</Action></View>
  </Sheet>
}
