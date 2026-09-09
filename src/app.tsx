import type { PropsWithChildren } from 'react'
import { AppProvider } from './state/store'
import './app.scss'

export default function App({ children }: PropsWithChildren) {
  return <AppProvider>{children}</AppProvider>
}
