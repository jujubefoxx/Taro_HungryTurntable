import { useEffect, useRef, useState } from 'react'
import { Image, Text, View } from '@tarojs/components'
import { useDidHide } from '@tarojs/taro'
import { Button } from './Button'
import { MASCOT_REPLIES, nextMascotReply } from '../core/playful'
import { asset } from '../platform'

export function MascotGreeting({ reducedMotion }: { reducedMotion: boolean }) {
  const [reply, setReply] = useState<number>()
  const [waving, setWaving] = useState(false)
  const previous = useRef<number>()
  const lastTap = useRef(0)
  const speechTimer = useRef<ReturnType<typeof setTimeout>>()
  const motionTimer = useRef<ReturnType<typeof setTimeout>>()
  const clearTimers = () => { clearTimeout(speechTimer.current); clearTimeout(motionTimer.current) }
  useEffect(() => clearTimers, [])
  useDidHide(() => { clearTimers(); setReply(undefined); setWaving(false); lastTap.current = 0 })
  useEffect(() => { if (reducedMotion) { clearTimeout(motionTimer.current); setWaving(false) } }, [reducedMotion])
  const greet = () => {
    if (Date.now() - lastTap.current < 450) return
    lastTap.current = Date.now()
    clearTimers()
    const next = nextMascotReply(previous.current)
    previous.current = next
    setReply(next)
    setWaving(!reducedMotion)
    if (!reducedMotion) motionTimer.current = setTimeout(() => setWaving(false), 420)
    speechTimer.current = setTimeout(() => setReply(undefined), 2800)
  }
  return <View className='mascot-greeting'>
    <Button className={`brand-stamp mascot-button ${waving ? 'mascot-waving' : ''}`} ariaLabel='戳戳小饭团' onClick={greet}><Image className='brand-mark' src={asset('mascot.png')} mode='aspectFit' /></Button>
    {reply !== undefined && <Text className='mascot-speech' aria-live='polite'>{MASCOT_REPLIES[reply]}</Text>}
  </View>
}
