import { useState } from 'react'
import { Input, Text, View } from '@tarojs/components'
import { FormInput } from './FormInput'
import { Button } from './Button'
import { Food, foodCapacityError, makeFood, nameError, nameKey, normalizeName, sample, validateWheel } from '../core/model'
import { useApp } from '../state/store'
import { Action, FoodImage, IconButton, Sheet } from './ui'
import { toast } from '../platform'
import { FoodForm } from './FoodForm'

export function WheelEditor({ onClose }: { onClose: () => void }) {
  const { state, update } = useApp()
  const scene = state.scene
  const original = state.scenes[scene]
  const [pool, setPool] = useState<Food[]>(original.pool.map(f => ({ ...f })))
  const [ids, setIds] = useState([...original.wheel])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [editingFood, setEditingFood] = useState<Food>()
  const add = () => {
    if (ids.length === 10) return setError('最多放 10 个，先移除一个再加吧')
    const invalid = nameError(newName)
    if (invalid) return setError(invalid)
    const existing = pool.find(f => nameKey(f.name) === nameKey(newName))
    if (existing && ids.includes(existing.id)) return setError('这个已经在转盘里了')
    if (!existing) { setEditingFood(makeFood(newName)); return }
    setIds([...ids, existing.id]); setNewName(''); setError('')
  }
  const replace = (id: string) => {
    const choices = pool.filter(f => !ids.includes(f.id))
    if (!choices.length) return toast('食物库里没有其他选项了，先添加一些吧')
    const food = sample(choices, 1)[0]
    setIds(ids.map(i => i === id ? food.id : i))
  }
  const move = (index: number, direction: number) => {
    const next = [...ids]
    ;[next[index], next[index + direction]] = [next[index + direction], next[index]]
    setIds(next)
  }
  const save = () => {
    const normalized = pool.map(f => ({ ...f, name: normalizeName(f.name) }))
    const err = validateWheel(ids, normalized)
    if (err) return setError(err)
    const seen = new Set<string>()
    for (const food of normalized) {
      if (seen.has(nameKey(food.name))) return setError('食物名称有重复，请修改后保存')
      seen.add(nameKey(food.name))
      if (food.name !== original.pool.find(f => f.id === food.id)?.name) {
        const invalid = nameError(food.name)
        if (invalid) return setError(invalid)
      }
    }
    update(s => ({ ...s, scenes: { ...s.scenes, [scene]: { pool: normalized, wheel: ids } } }))
    onClose(); toast('这一桌，安排好了')
  }
  if (editingFood) return <FoodForm food={editingFood} onClose={() => setEditingFood(undefined)} onSave={food => {
    if (pool.some(f => f.id !== food.id && nameKey(f.name) === nameKey(food.name))) return '食物库里已经有这个名字啦'
    const exists = pool.some(f => f.id === food.id)
    const capacity = foodCapacityError(pool.length, exists ? 0 : 1)
    if (capacity) return capacity
    setPool(exists ? pool.map(f => f.id === food.id ? food : f) : [...pool, food])
    if (!exists) { setIds([...ids, food.id]); setNewName('') }
    setError('')
  }} />
  return <Sheet title='编辑这一轮' onClose={onClose}>
    <Text className='muted'>2～10 个选项，机会均等。保存后才会更新转盘。</Text>
    <View className='editor-list'>{ids.map((id, index) => {
      const food = pool.find(f => f.id === id)!
      return <View className='editor-row' key={id}>
        <Button className='editor-food-trigger' ariaLabel={`编辑选项 ${index + 1} 的图案与热量`} onClick={() => setEditingFood(food)}><FoodImage food={food} /><Text>图案 / 热量</Text></Button>
        <View className='editor-fields'><Input className='food-input' ariaLabel={`选项 ${index + 1}`} value={food.name} maxlength={-1} onInput={e => setPool(pool.map(f => f.id === id ? { ...f, name: e.detail.value, nutrition: undefined, nutritionEdited: true } : f))} />
          <View className='editor-actions'><IconButton name='chevron-up' label={`上移选项 ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)} /><IconButton name='chevron-down' label={`下移选项 ${index + 1}`} disabled={index === ids.length - 1} onClick={() => move(index, 1)} /><IconButton name='refresh' label={`随机替换选项 ${index + 1}`} onClick={() => replace(id)} /><IconButton name='trash' label={`移除选项 ${index + 1}`} disabled={ids.length <= 2} onClick={() => setIds(ids.filter(i => i !== id))} /></View>
        </View>
      </View>
    })}</View>
    {ids.length < 10 && <View className='add-inline'><FormInput placeholder='再加一道，最多 20 字' ariaLabel='新增转盘食物' value={newName} maxlength={20} onInput={e => setNewName(e.detail.value)} onConfirm={add} /><IconButton name='plus' label='添加转盘食物' onClick={add} /></View>}
    {error && <Text className='error'>{error}</Text>}
    <View className='sheet-footer'><Action secondary onClick={onClose}>取消</Action><Action onClick={save}>保存 · {ids.length} 个选项</Action></View>
  </Sheet>
}
