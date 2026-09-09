import fs from 'node:fs/promises'
import path from 'node:path'

// 输入为转换到 22050 Hz / mono / PCM16 的三个 CC0 原始录音：咬食、咀嚼、吞咽。
// 用法：node scripts/prepare-audio.mjs bite.wav chew.wav swallow.wav
const files = process.argv.slice(2)
if (files.length !== 3) throw new Error('需要咬食、咀嚼、吞咽三个 WAV 文件')
async function pcm(file) {
  const buffer = await fs.readFile(file)
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') throw new Error('输入必须是 PCM WAV')
  let cursor = 12, data
  while (cursor + 8 <= buffer.length) {
    const kind = buffer.toString('ascii', cursor, cursor + 4), size = buffer.readUInt32LE(cursor + 4)
    if (kind === 'fmt ') {
      const format = buffer.readUInt16LE(cursor + 8)
      const isPcm = format === 1 || (format === 65534 && size >= 40 && buffer.readUInt32LE(cursor + 32) === 1)
      if (!isPcm || buffer.readUInt16LE(cursor + 10) !== 1 || buffer.readUInt32LE(cursor + 12) !== 22050 || buffer.readUInt16LE(cursor + 22) !== 16) throw new Error('请先转换到 22050 Hz 单声道 PCM16')
    }
    if (kind === 'data') data = buffer.subarray(cursor + 8, cursor + 8 + size)
    cursor += 8 + size + size % 2
  }
  if (!data) throw new Error('WAV 缺少音频数据')
  const values = Array.from({ length: data.length / 2 }, (_, i) => data.readInt16LE(i * 2) / 32768)
  const peak = Math.max(...values.map(Math.abs))
  const start = Math.max(0, values.findIndex(v => Math.abs(v) > peak * .08) - 110)
  return values.slice(start)
}
const [bite, chew, swallow] = await Promise.all(files.map(pcm))
const variants = [
  { name: 'crunch', data: bite, speed: 1.04, duration: .34, smooth: .25 },
  { name: 'crunch-alt', data: chew, speed: 1.10, duration: .48, smooth: .2 },
  { name: 'spoon', data: chew, speed: .96, duration: .45, smooth: .62 },
  { name: 'sip', data: swallow, speed: 1.08, duration: .38, smooth: .1 }
]
for (const variant of variants) {
  const rate = 22050, length = Math.min(Math.floor(rate * variant.duration), Math.floor(variant.data.length / variant.speed))
  let filtered = 0
  const samples = Array.from({ length }, (_, i) => {
    const position = i * variant.speed, a = Math.floor(position), mix = position - a
    const v = variant.data[a] * (1 - mix) + (variant.data[a + 1] || 0) * mix
    filtered = filtered * variant.smooth + v * (1 - variant.smooth)
    return filtered * Math.min(1, i / 100, (length - i) / 450)
  })
  const peak = Math.max(...samples.map(Math.abs)) || 1
  const wav = Buffer.alloc(44 + length * 2)
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24)
  wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(length * 2, 40)
  samples.forEach((v, i) => wav.writeInt16LE(Math.round(v / peak * 22000), 44 + i * 2))
  const target = path.resolve('src/assets', `${variant.name}.wav`)
  await fs.writeFile(target, wav)
  console.log(`${variant.name}: ${wav.length} bytes, ${(length / rate).toFixed(2)}s`)
}
