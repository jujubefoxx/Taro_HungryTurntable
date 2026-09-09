import { ComponentProps } from 'react'
import { Input, View } from '@tarojs/components'

// 边框和留白交给普通 View；原生 input 只负责文字，避免各端盒模型差异裁掉右边。
export function FormInput({ className = '', ...props }: ComponentProps<typeof Input>) {
  return <View className={`input ${className}`}><Input {...props} className='input-control' /></View>
}
