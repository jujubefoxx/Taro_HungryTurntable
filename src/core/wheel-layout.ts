// 图文始终正向，因此旋转途中也要装得下整个矩形，而不只是静止时的高度。
export function wheelLayout(count: number, labelLines = 2) {
  const orbit = 0.34
  const safeRadius = Math.min(orbit * Math.sin(Math.PI / count), 0.5 - orbit, orbit - 0.14) * 0.94
  const height = 2 * safeRadius / Math.sqrt(1 + 0.75 ** 2)
  const width = height * 0.75
  // 750 设计宽度减去页面两侧留白及圆盘边框。
  const designDiameter = 670
  const fontSize = Math.max(20, Math.min(26, Math.floor(height * designDiameter * 0.42 / 2.4)))
  const lineHeight = Math.ceil(fontSize * 1.2)
  const labelHeight = lineHeight * Math.max(1, Math.min(2, labelLines)) + 2
  // 短名称不再空占第二行，把腾出的空间交给图案；仍限制在完整安全矩形内。
  const artSize = Math.floor(Math.min(width * designDiameter, height * designDiameter - labelHeight - 4))
  return { orbit, width, height, fontSize, lineHeight, labelHeight, artSize }
}

// 显式分行，避免原生 Text 的 line-clamp 与固定高度组合切掉第二行字形。
export function wheelTextLines(name: string, count: number): string[] {
  const layout = wheelLayout(count)
  const capacity = Math.max(2, Math.floor(layout.width * 670 / layout.fontSize))
  const chars = Array.from(name)
  if (chars.length <= capacity) return [name]
  return [chars.slice(0, capacity).join(''), chars.length <= capacity * 2
    ? chars.slice(capacity).join('') : `${chars.slice(capacity, capacity * 2 - 1).join('')}…`]
}
