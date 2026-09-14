export async function copyShareLink(link: string) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(link); return }
    catch { /* 部分浏览器未开放异步剪贴板，继续尝试用户点击触发的复制。 */ }
  }
  const textarea = document.createElement('textarea')
  textarea.readOnly = true
  textarea.value = link
  textarea.style.position = 'fixed'
  textarea.style.left = '-10000px'
  document.body.appendChild(textarea)
  let copied = false
  try {
    textarea.select()
    textarea.setSelectionRange(0, link.length)
    copied = document.execCommand('copy')
  } finally { document.body.removeChild(textarea) }
  if (!copied) throw new Error('Clipboard unavailable')
}
