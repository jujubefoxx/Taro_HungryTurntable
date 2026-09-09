import Taro from '@tarojs/taro'

export interface CanvasNode {
  width: number
  height: number
  getContext(type: '2d'): CanvasRenderingContext2D
  createImage?: () => HTMLImageElement
  toDataURL?: (type?: string) => string
}
export async function canvasSnapshot(node: CanvasNode): Promise<string> {
  if (process.env.TARO_ENV === 'h5' && node.toDataURL) return node.toDataURL('image/png')
  const result = await Taro.canvasToTempFilePath({ canvas: node as unknown as Taro.Canvas, fileType: 'png' })
  return result.tempFilePath
}
export interface Surface { node: CanvasNode; context: CanvasRenderingContext2D; size: number }
export function canvasSurface(id: string): Promise<Surface> {
  return new Promise((resolve, reject) => {
    const query = Taro.createSelectorQuery()
    query.select(`#${id}`).node()
    query.select(`#${id}`).boundingClientRect()
    query.exec(result => {
      const field = result[0] as { node?: CanvasNode } | undefined
      const rect = result[1] as { width?: number } | undefined
      if (!field?.node || !rect?.width) return reject(new Error('画布尚未准备好'))
      try {
        const node = field.node, size = rect.width
        const ratio = Taro.getWindowInfo?.().pixelRatio || Taro.getSystemInfoSync().pixelRatio || 1
        node.width = Math.round(size * ratio); node.height = Math.round(size * ratio)
        const context = node.getContext('2d')
        context.scale(ratio, ratio)
        resolve({ node, context, size })
      } catch (e) { reject(e) }
    })
  })
}
export function canvasImage(node: CanvasNode, src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = process.env.TARO_ENV === 'h5' ? new globalThis.Image() : node.createImage?.()
    if (!image) return reject(new Error('当前平台暂不支持画布图片'))
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('食物图片加载失败'))
    image.src = src
  })
}
