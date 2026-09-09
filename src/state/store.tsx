import { createContext, useContext, useState, useRef, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { AppState } from '../core/model'
import { loadState, STORAGE_KEY } from '../core/storage'

const port = { read: (key: string) => Taro.getStorageSync(key), write: (key: string, value: unknown) => Taro.setStorageSync(key, value) }
type Store = { state: AppState; update: (fn: (state: AppState) => AppState) => void; storageNotice?: string }
const Context = createContext<Store | null>(null)
export function AppProvider({ children }: PropsWithChildren) {
  const [loaded] = useState(() => loadState(port))
  const [state, setState] = useState(loaded.state)
  const [storageNotice, setNotice] = useState(loaded.notice)
  const current = useRef(state)
  function update(fn: (s: AppState) => AppState) {
    const next = fn(current.current)
    current.current = next; setState(next)
    try { port.write(STORAGE_KEY, next); setNotice(undefined) }
    catch { setNotice('本地保存失败，离开后可能丢失修改。请检查存储空间。') }
  }
  return <Context.Provider value={{ state, update, storageNotice }}>{children}</Context.Provider>
}
export function useApp() {
  const store = useContext(Context)
  if (!store) throw new Error('缺少应用状态容器')
  return store
}
