import { Button as NativeButton } from '@tarojs/components'
import type { ComponentProps } from 'react'

// 所有业务按钮共用显式外观，避免微信默认尺寸、灰底和 disabled 配色渗入页面。
export function Button({ className = '', disabled, ...props }: ComponentProps<typeof NativeButton>) {
  return <NativeButton {...props} hoverClass='app-button-pressed' disabled={disabled || undefined} className={`app-button ${className} ${disabled ? 'is-disabled' : ''}`} />
}
