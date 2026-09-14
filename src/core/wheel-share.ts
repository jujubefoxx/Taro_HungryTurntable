import { contentFilterError } from './content-filter'
import { nameError, normalizeName, SCENES, SceneId, uniqueNames } from './model'

const SHARED_PAGE = '/pages/shared/index'
// 应用侧保守限制：分享路径保持短小，超出时请用户精简名称。
export const MAX_SHARE_PATH_LENGTH = 1024
const PATH_PREFIX = `${SHARED_PAGE}?wheel=`
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
export interface SharedWheel { scene: SceneId; names: string[] }
export type WheelShare = { ok: true; wheel: SharedWheel; token: string; path: string } | { ok: false; error: string }

// 不依赖 Buffer、btoa 或 TextEncoder，兼容小程序 JS 环境。
function encode(text: string) {
  const bytes: number[] = []
  const uri = encodeURIComponent(text)
  for (let i = 0; i < uri.length; i++) {
    if (uri[i] === '%') { bytes.push(parseInt(uri.slice(i + 1, i + 3), 16)); i += 2 }
    else bytes.push(uri.charCodeAt(i))
  }
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2]
    result += ALPHABET[a >> 2] + ALPHABET[((a & 3) << 4) | ((b || 0) >> 4)]
    if (b !== undefined) result += ALPHABET[((b & 15) << 2) | ((c || 0) >> 6)]
    if (c !== undefined) result += ALPHABET[c & 63]
  }
  return result
}

function decode(token: string) {
  let uri = '', bits = 0, value = 0
  for (const char of token) {
    value = (value << 6) | ALPHABET.indexOf(char)
    bits += 6
    if (bits >= 8) {
      bits -= 8
      uri += '%' + ((value >> bits) & 255).toString(16).padStart(2, '0')
      value &= (1 << bits) - 1
    }
  }
  if (value !== 0) throw new Error('Invalid padding')
  return decodeURIComponent(uri)
}

export function createWheelShare(scene: SceneId, names: readonly string[]): WheelShare {
  try {
    if (!SCENES.some(item => item.id === scene) || names.length < 2 || names.length > 10) return { ok: false, error: '分享转盘需要 2～10 个选项' }
    const normalized = names.map(normalizeName)
    if (normalized.some(name => nameError(name)) || uniqueNames(normalized).length !== normalized.length) return { ok: false, error: '请先检查候选名称：不重复，每个最多 20 字' }
    const error = contentFilterError(normalized)
    if (error) return { ok: false, error }
    const token = encode(JSON.stringify({ v: 1, s: scene, n: normalized }))
    const path = PATH_PREFIX + token
    if (path.length > MAX_SHARE_PATH_LENGTH) return { ok: false, error: '这一轮文字有点多，精简名称后再分享吧' }
    return { ok: true, wheel: { scene, names: normalized }, token, path }
  } catch {
    return { ok: false, error: '候选名称暂时无法分享，请检查后再试' }
  }
}

export function readWheelShare(token: unknown): WheelShare {
  const invalid: WheelShare = { ok: false, error: '这份转盘没有读完整，请让朋友重新分享一次吧' }
  if (typeof token !== 'string' || !token || token.length + PATH_PREFIX.length > MAX_SHARE_PATH_LENGTH || token.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(token)) return invalid
  try {
    const raw: unknown = JSON.parse(decode(token))
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid
    const payload = raw as { v?: unknown; s?: unknown; n?: unknown }
    if (payload.v !== 1 || !SCENES.some(scene => scene.id === payload.s) || !Array.isArray(payload.n) || !payload.n.every((name): name is string => typeof name === 'string')) return invalid
    const result = createWheelShare(payload.s as SceneId, payload.n)
    return result.ok ? result : invalid
  } catch { return invalid }
}
