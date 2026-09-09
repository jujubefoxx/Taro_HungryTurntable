import { useEffect, useRef, useState } from 'react'
import { Text, View } from '@tarojs/components'
import { useDidHide } from '@tarojs/taro'
import { Button } from '../../components/Button'
import { FormInput } from '../../components/FormInput'
import { Action, Icon, IconButton, Page, Sheet } from '../../components/ui'
import { Wheel } from '../../components/Wheel'
import { chooseIndex, DecisionWheel, Food, normalizeName, targetRotation } from '../../core/model'
import { DECISION_TEMPLATES, decisionError, newDecision } from '../../core/decisions'
import { useApp } from '../../state/store'
import { confirm, toast, vibrate } from '../../platform'

export default function Decide() {
  const { state, update } = useApp()
  const current = state.decisionWheels.find(w => w.id === state.activeDecision) || state.decisionWheels[0]
  const foods: Food[] = current.options.map((name, i) => ({ id: String(i), name, art: 'mascot' }))
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Food>()
  const [detail, setDetail] = useState<Food>()
  const [manage, setManage] = useState(false)
  const [draft, setDraft] = useState<DecisionWheel>()
  const [error, setError] = useState('')
  const lock = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const stop = () => { clearTimeout(timer.current); lock.current = false; setSpinning(false); setResult(undefined) }
  useDidHide(stop)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { setRotation(0); setResult(undefined) }, [current.id, current.options.join('\n')])
  const spin = (exclude?: string) => {
    if (lock.current) return
    lock.current = true; setSpinning(true); setResult(undefined)
    const index = chooseIndex(foods.length, exclude === undefined ? undefined : Number(exclude))
    setRotation(targetRotation(rotation, index, foods.length))
    timer.current = setTimeout(() => { lock.current = false; setSpinning(false); setResult(foods[index]); vibrate(state.settings.haptics) }, state.settings.reducedMotion ? 150 : 4250)
  }
  const edit = (wheel: DecisionWheel) => { setError(''); setDraft({ ...wheel, options: [...wheel.options] }); setManage(false) }
  const save = () => {
    if (!draft) return
    const next = { ...draft, title: normalizeName(draft.title), options: draft.options.map(normalizeName) }
    const err = decisionError(next.title, next.options)
    if (err) return setError(err)
    const exists = state.decisionWheels.some(w => w.id === next.id)
    if (!exists && state.decisionWheels.length >= 20) return setError('最多保存 20 个转盘，请先删除不需要的转盘')
    update(s => ({ ...s, activeDecision: next.id, decisionWheels: exists ? s.decisionWheels.map(w => w.id === next.id ? next : w) : [...s.decisionWheels, next] }))
    setDraft(undefined); toast('好了，开转！')
  }
  const remove = async () => {
    if (state.decisionWheels.length <= 1) return toast('至少需要保留一个转盘')
    if (!await confirm('删除这个转盘？', `「${current.title}」和它的选项会从本机移除，不能撤销。`)) return
    update(s => { const wheels = s.decisionWheels.filter(w => w.id !== current.id); return { ...s, decisionWheels: wheels, activeDecision: wheels[0].id } }); setManage(false)
  }
  return <Page title='万事转盘'>
    <View className='section-hero'><Text className='page-title'>选不出来？我帮你蒙一个。</Text><Text className='muted'>去哪玩、明天做什么，都可以自己填。</Text></View>
    <Button className='decision-title' disabled={spinning} onClick={() => setManage(true)}><Icon name='dice-5' /><Text>{current.title}</Text><Icon name='chevron-down' size={18} /></Button>
    <Wheel generic foods={foods} rotation={rotation} spinning={spinning} reducedMotion={state.settings.reducedMotion} onSpin={() => spin()} onFood={setDetail} />
    <View className='round-summary'><Text>{foods.length} 个选项 · 机会一样大</Text></View>
    <Action className='spin-cta' disabled={spinning} onClick={() => spin()}>{spinning ? '转着呢，马上好…' : '帮我选一个'}</Action>
    <View className='home-links'><Button className='link-button' disabled={spinning} onClick={() => edit(current)}><Icon name='pencil' /><Text>编辑转盘</Text></Button><Button className='link-button' disabled={spinning} onClick={() => edit(newDecision())}><Icon name='plus' /><Text>新建转盘</Text></Button></View>
    <Text className='page-motto'>不喜欢这个答案？<Text>再转一次就好。</Text></Text>
    {result && <Sheet title='转到它了，你觉得呢？' onClose={() => setResult(undefined)}><View className='decision-result'><Icon name='sparkles' size={48} /><Text className='food-detail-name'>{result.name}</Text><Text className='muted'>来自「{current.title}」</Text></View><Action onClick={() => { setResult(undefined); toast('行，就这么定了！') }}>行，就这么定了</Action><View className='sheet-footer'><Action secondary onClick={() => spin()}>再转一次</Action><Action secondary onClick={() => spin(result.id)}>换一个</Action></View></Sheet>}
    {detail && <Sheet title='看看这个选项' onClose={() => setDetail(undefined)}><View className='decision-result'><View className='idea-icon'><Icon name='bulb' size={40} /></View><Text className='food-detail-name'>{detail.name}</Text><Text className='muted'>每个选项被选中的机会一样。</Text></View><Action secondary onClick={() => setDetail(undefined)}>返回转盘</Action></Sheet>}
    {manage && <Sheet title='我的转盘' onClose={() => setManage(false)}><View className='decision-list'>{state.decisionWheels.map(w => <Button className={`decision-select ${w.id === current.id ? 'selected' : ''}`} key={w.id} onClick={() => { update(s => ({ ...s, activeDecision: w.id })); setManage(false) }}><Text>{w.title}</Text><Text className='fine-print'>{w.options.length} 个选项 {w.id === current.id ? '· 当前使用' : ''}</Text></Button>)}</View><Text className='field-label'>懒得从头写？试试这些</Text><View className='template-list'>{DECISION_TEMPLATES.map(t => <Button className='template-chip' key={t.title} onClick={() => edit(newDecision(t.title, t.options))}>{t.title}</Button>)}</View><Action onClick={() => edit(newDecision())}>新建转盘</Action><Button className='text-button centered' onClick={() => { void remove() }}>删除当前转盘</Button><Text className='fine-print'>最多保存 20 个转盘，仅保存在本机。</Text></Sheet>}
    {draft && <Sheet title='编辑转盘' onClose={() => setDraft(undefined)}><Text className='field-label'>转盘名称</Text><FormInput ariaLabel='转盘名称' value={draft.title} maxlength={20} placeholder='如：下次去哪里旅行？' onInput={e => setDraft({ ...draft, title: e.detail.value })} /><Text className='field-label'>选项 · {draft.options.length} / 10</Text><Text className='fine-print'>每项最多 20 字；2～10 项，机会均等。保存后才生效。</Text><View className='decision-editor'>{draft.options.map((name, i) => <View className='decision-input-row' key={i}><Text className='option-index'>{i + 1}</Text><FormInput ariaLabel={`自定义选项 ${i + 1}`} value={name} maxlength={20} placeholder='输入一个选项' onInput={e => setDraft({ ...draft, options: draft.options.map((n, j) => j === i ? e.detail.value : n) })} /><IconButton name='trash' label={`移除选项 ${i + 1}`} disabled={draft.options.length <= 2} onClick={() => setDraft({ ...draft, options: draft.options.filter((_, j) => j !== i) })} /></View>)}</View>{draft.options.length < 10 && <Button className='text-button accent' onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })}><Icon name='plus' />再加一个</Button>}{error && <Text className='error'>{error}</Text>}<View className='sheet-footer'><Action secondary onClick={() => setDraft(undefined)}>先不改了</Action><Action onClick={save}>保存</Action></View></Sheet>}
  </Page>
}
