import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const assets = path.resolve('src/assets')
await fs.mkdir(path.join(assets, 'icons'), { recursive: true })
const headingFont = await fs.readFile(path.join(assets, 'heading.ttf'))
await fs.writeFile(path.join(assets, 'heading.scss'), `@font-face { font-family: 'HappyMeal'; font-weight: 400; font-style: normal; font-display: swap; src: url('data:font/ttf;base64,${headingFont.toString('base64')}') format('truetype'); }\n`)
const icons = ['settings', 'chevron-left', 'chevron-right', 'chevron-down', 'chevron-up', 'refresh', 'pencil', 'bowl-spoon', 'search', 'plus', 'x', 'check', 'dots-vertical', 'trash', 'volume', 'volume-off', 'leaf', 'info-circle', 'tools-kitchen-2', 'cup', 'cake', 'users', 'moped', 'chef-hat', 'moon', 'arrow-back-up', 'heart', 'player-play', 'sparkles', 'history', 'dice-5']
for (const name of [...icons, 'bulb']) {
  const svg = await fs.readFile(`node_modules/@tabler/icons/icons/outline/${name}.svg`, 'utf8')
  await sharp(Buffer.from(svg.replace(/currentColor/g, '#382719'))).resize(72, 72).png().toFile(path.join(assets, 'icons', `${name}.png`))
}
await fs.copyFile('node_modules/@tabler/icons/LICENSE', path.join(assets, 'icons', 'LICENSE'))

// 音效使用 CC0 真人录音，来源见 assets/AUDIO-LICENSE.txt；此脚本不再覆盖音效。
