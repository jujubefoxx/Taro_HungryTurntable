import fs from 'node:fs/promises'
import path from 'node:path'

const target = process.argv[2]
if (!['weapp', 'tt'].includes(target)) throw new Error('请指定 weapp 或 tt')
const root = path.resolve(`dist/${target}`)
const limit = 2_000_000
async function scan(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await scan(file))
    else if (entry.isFile()) files.push({ file: path.relative(root, file), bytes: (await fs.stat(file)).size })
    else throw new Error(`包内不应包含链接：${file}`)
  }
  return files
}
const files = await scan(root)
if (!files.some(f => f.file === 'app.json') || !files.some(f => f.file === 'app.js')) throw new Error('缺少构建入口，不能通过包体检查')
const total = files.reduce((sum, f) => sum + f.bytes, 0)
const assets = files.filter(f => f.file.startsWith('assets/')).reduce((sum, f) => sum + f.bytes, 0)
console.log(`${target}: ${files.length} 个文件，完整未压缩体积 ${total.toLocaleString()} bytes，资源 ${assets.toLocaleString()} bytes`)
console.log(`上限 ${limit.toLocaleString()} bytes，剩余 ${(limit - total).toLocaleString()} bytes`)
if (total >= limit) { console.error('包体超限，禁止交付'); process.exitCode = 1 }
