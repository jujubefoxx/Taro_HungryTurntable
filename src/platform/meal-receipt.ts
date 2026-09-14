import Taro from '@tarojs/taro'

export async function saveMealReceipt(path: string): Promise<'download-started' | 'saved'> {
  if (!path) throw new Error('小票还没有生成')
  if (process.env.TARO_ENV === 'h5') {
    const link = document.createElement('a')
    link.href = path; link.download = '开饭小票.png'; link.style.display = 'none'
    document.body.appendChild(link)
    try { link.click() } finally { link.remove() }
    return 'download-started'
  }
  await Taro.saveImageToPhotosAlbum({ filePath: path })
  return 'saved'
}

export function previewMealReceipt(path: string) {
  return Taro.previewImage({ current: path, urls: [path], showmenu: true })
}
