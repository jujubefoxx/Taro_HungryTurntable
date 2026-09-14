import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'src/assets/mascot.png')
const destination = path.join(root, 'src/assets/share-card.png')

// 好友卡片为 5:4；完整缩放原图并留白，不裁切吉祥物和旗子上的文字。
// 朋友圈仍使用原来的 1:1 mascot.png，头像及页面内插画保持不变。
const mascot = await sharp(source).resize(360, 360, { fit: 'contain', background: '#fffaf0' }).toBuffer()
await sharp({ create: { width: 500, height: 400, channels: 4, background: '#fffaf0' } })
  .composite([{ input: mascot, left: 70, top: 20 }])
  .flatten({ background: '#fffaf0' })
  .png({ compressionLevel: 9, palette: true, colours: 256 })
  .toFile(destination)
console.log('已生成好友分享封面：src/assets/share-card.png（500 × 400，5:4）')
