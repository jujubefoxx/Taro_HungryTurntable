import { Fragment, useMemo, useState } from 'react'
import { Image, Input, Switch, Text, Textarea, View } from '@tarojs/components'
import { Button } from '../../components/Button'
import { Food, foodCapacityError, MAX_FOODS_PER_SCENE, makeFood, nameKey, parseFoodText, sample } from '../../core/model'
import { defaultScene } from '../../core/seeds'
import { useApp } from '../../state/store'
import { Action, FoodDetail, FoodImage, Icon, IconButton, NutritionLine, Page, SceneTabs, Sheet } from '../../components/ui'
import { FoodForm } from '../../components/FoodForm'
import { asset, back, confirm, toast } from '../../platform'
import { InlineAd } from '../../components/Monetization'

export default function Library() {
  const { state, update } = useApp()
  const scene = state.scene
  const current = state.scenes[scene]
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<Food | 'new'>()
  const [menu, setMenu] = useState<Food>()
  const [detail, setDetail] = useState<Food>()
  const [bulk, setBulk] = useState(false)
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseFoodText(text), [text])
  const visible = current.pool.filter(f => nameKey(f.name).includes(nameKey(query)))
  const save = (food: Food) => {
    if (current.pool.some(f => f.id !== food.id && nameKey(f.name) === nameKey(food.name))) return '食物库里已经有这个名字啦'
    const capacity = foodCapacityError(current.pool.length, current.pool.some(f => f.id === food.id) ? 0 : 1)
    if (capacity) return capacity
    update(s => ({ ...s, scenes: { ...s.scenes, [scene]: { ...current, pool: current.pool.some(f => f.id === food.id) ? current.pool.map(f => f.id === food.id ? food : f) : [...current.pool, food] } } }))
    toast('食物已保存')
  }
  const addToWheel = (food: Food) => {
    if (current.wheel.includes(food.id)) return toast('这个已经在转盘里了')
    if (current.wheel.length >= 10) return toast('转盘最多 10 个选项，请先在编辑转盘中移除一个')
    update(s => ({ ...s, scenes: { ...s.scenes, [scene]: { ...current, wheel: [...current.wheel, food.id] } } }))
    setMenu(undefined); toast('已放到转盘')
  }
  const remove = async (food: Food) => {
    setMenu(undefined)
    if (current.wheel.includes(food.id) && current.wheel.length <= 2) return toast('转盘至少保留两个选项，请先添加其他食物')
    if (!await confirm('移除食物？', `将从当前分类及当前转盘移除“${food.name}”，其他分类不受影响。`)) return
    update(s => ({ ...s, scenes: { ...s.scenes, [scene]: { pool: current.pool.filter(f => f.id !== food.id), wheel: current.wheel.filter(id => id !== food.id) } } }))
    toast('已从当前分类移除')
  }
  const importFoods = () => {
    if (!parsed.names.length) return toast('先填上想吃的食物名称')
    if (parsed.invalid.length) return toast('有名称超过 20 字，请修改后再导入')
    const fresh = parsed.names.filter(n => !current.pool.some(f => nameKey(f.name) === nameKey(n))).map(makeFood)
    if (!fresh.length) return toast('这些食物已经在库里啦')
    const capacity = foodCapacityError(current.pool.length, fresh.length)
    if (capacity) return toast(`${capacity}，本次未添加`)
    update(s => ({ ...s, scenes: { ...s.scenes, [scene]: { ...current, pool: [...current.pool, ...fresh] } } }))
    setText(''); setBulk(false); toast(`新增 ${fresh.length} 份食物，重复项已跳过`)
  }
  return <Page title='我的食物库'>
    <View className='library-hero'><View><Text className='page-title'>我的食物库</Text><Text className='hero-subtitle'>换一组时，从这里挑选食物。</Text></View><Image src={asset('mascot.png')} mode='aspectFit' /></View>
    <SceneTabs />
    <View className='search-row'><View className='search-input'><Icon name='search' size={22} /><Input ariaLabel='搜索食物' placeholder='找找想吃的' value={query} onInput={e => setQuery(e.detail.value)} />{query && <IconButton name='x' label='清空搜索' onClick={() => setQuery('')} />}</View><Button className='add-food' ariaLabel='添加食物' onClick={() => setForm('new')}><Icon name='plus' size={30} /></Button></View>
    <View className='nutrition-toggle'><View><Icon name='leaf' size={18} /><Text>显示营养参考</Text></View><Switch ariaLabel='显示营养参考' checked={state.settings.nutrition} color='#f5663d' onChange={e => update(s => ({ ...s, settings: { ...s.settings, nutrition: e.detail.value } }))} /></View>
    {state.settings.nutrition && <Text className='fine-print'>每项标明对应份量，仅供参考，不代替专业饮食建议。</Text>}
    <View className='list-heading'><Text>{query ? `找到 ${visible.length} 份` : `${current.pool.length} 种食物`}</Text><Button className='text-button accent' onClick={() => setBulk(true)}>批量添加</Button></View>
    <Text className='capacity-note'>当前分类：{current.pool.length} / {MAX_FOODS_PER_SCENE} 份 · 新名称最多 20 字</Text>
    <View key={scene} className='food-list content-enter'>{visible.map((food, index) => <Fragment key={food.id}><View className='food-row'><Button className='food-open' onClick={() => setDetail(food)}><FoodImage food={food} /><View className='food-row-copy'><Text className='food-name'>{food.name}</Text><NutritionLine food={food} />{current.wheel.includes(food.id) && <Text className='in-wheel'>已在转盘</Text>}</View></Button><IconButton name='dots-vertical' label={`管理${food.name}`} onClick={() => setMenu(food)} /></View>{!query && index === 11 && <InlineAd />}</Fragment>)}</View>
    {!visible.length && <View className='empty-state'><Icon name='search' size={36} /><Text>还没找到这道菜</Text><Text className='muted'>换个关键词，或把它加入食物库。</Text><Action secondary onClick={() => setForm('new')}>添加食物</Action></View>}
    <View className='library-bottom'><Button className='text-button' onClick={async () => { if (await confirm('恢复当前分类？', '当前分类的自定义食物和转盘会被默认内容替换，其他分类与设置不变。')) update(s => ({ ...s, scenes: { ...s.scenes, [scene]: defaultScene(scene) } })) }}>恢复默认</Button><Action onClick={() => { const count = current.wheel.length; if (current.pool.length < count) return toast('候选食物不足，请先添加'); update(s => ({ ...s, scenes: { ...s.scenes, [scene]: { ...current, wheel: sample(current.pool, count).map(f => f.id) } } })); back() }}>随机放 {current.wheel.length} 个到转盘</Action></View>
    {form && <FoodForm food={form === 'new' ? undefined : form} onClose={() => setForm(undefined)} onSave={save} />}
    {menu && <Sheet title={menu.name} onClose={() => setMenu(undefined)}><View className='menu-actions'><Action secondary onClick={() => addToWheel(menu)}>{current.wheel.includes(menu.id) ? '已经在转盘里' : '放到转盘'}</Action><Action secondary onClick={() => { setForm(menu); setMenu(undefined) }}>编辑名称与营养</Action><Action secondary onClick={() => remove(menu)}>从当前分类移除</Action></View></Sheet>}
    {detail && <FoodDetail food={detail} onClose={() => setDetail(undefined)}><Action onClick={() => { addToWheel(detail); setDetail(undefined) }}>放到转盘</Action></FoodDetail>}
    {bulk && <Sheet title='想吃的，一起加上' onClose={() => setBulk(false)}><Text className='muted'>空格、换行、逗号、分号都可以分隔；每个名称最多 20 字。</Text><Textarea className='bulk-input' ariaLabel='批量食物名称' placeholder={'火锅 寿司\n楼下阿姨家的炒粉\n黑糖珍珠牛奶'} value={text} maxlength={6000} onInput={e => setText(e.detail.value)} /><Text className='fine-print'>识别 {parsed.names.length} 个名称 · 输入中重复 {parsed.duplicates} 个</Text>{parsed.invalid.length > 0 && <Text className='error'>名称过长：{parsed.invalid.join('、')}</Text>}<Action onClick={importFoods}>添加到当前食物库</Action></Sheet>}
  </Page>
}
