const INVISIBLE_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/gu
const SEPARATORS = /[\s\p{P}\p{S}_]+/gu

// 词条使用 UTF-16 十六进制保存，避免在源码中直接出现敏感文本。
function decodeHexText(encoded: string): string {
  let decoded = ''
  for (let index = 0; index < encoded.length; index += 4) {
    decoded += String.fromCharCode(Number.parseInt(encoded.slice(index, index + 4), 16))
  }
  return decoded
}

const PROHIBITED_WORDS = [
  '4e608fd15e73',
  '516d56db',
  '59295b8995e84e8b4ef6',
  '53f072ec',
  '6e2f72ec',
  '85cf72ec',
  '758672ec',
  '6cd58f6e529f',
  '7eb37cb9',
  '827260c5',
  '62104eba89c69891',
  '88f8804a',
  '7ea670ae',
  '62db5ad6',
  '63f44ea4',
  '53566deb',
  '5ad65a3c',
  '5f3a5978',
  '4e714f26',
  '8ff75978',
  '63d262114e0b9762',
  '63d28fdb4e0b9762',
  '63d251654e0b4f53',
  '53e34ea4',
  '60274ea4',
  '505a7231',
  '8d4c535a',
  '8d4c573a',
  '535a5f69',
  '8d4c7403',
  '516d54085f69',
  '8001864e673a',
  '4e0b6ce8',
  '8d4c94b1',
  '8d4c535a7fa4',
  '5f0059567fa4',
  '51b06bd2',
  '6d776d1b56e0',
  '644759344e38',
  '53ef536156e0',
  '006b7c89',
  '9ebb53e4',
  '52366bd2',
  '8d296bd2',
  '51fa552e6bd254c1',
  '8d2d4e706bd254c1',
  '59279ebb',
  '67aa652f',
  '624b67aa',
  '6b6567aa',
  '70b85f39',
  '720670b87269',
  '81ea523670b8836f',
  '4e7051f6',
  '96c751f6',
  '67404eba65597a0b',
  '529e50478bc1',
  '504753d17968',
  '6d1794b1',
  '8dd15206',
  '523753558fd45229',
  '88f88d37',
  '9ad852298d37',
  '595773b065597a0b',
  '76d753f7',
  '76d75237',
  '65e58d5a',
  '7a338d5a4e0d8d54',
  '9ad8989d8fd45229',
  '518590e86d88606f',
  '4ee3529e8d376b3e',
  '517c804c52375355',
  '514d8d3990015f6991d1',
  '81ea674065597a0b',
  '5272815565597a0b',
  '76f87ea681ea6740',
  '6559550681ea6740',
  '64cd4f605988',
  '83496ce59a6c',
  '50bb903c',
  '715e7b14',
  '59887684',
  '4ed659887684',
  '6eda4f605988',
  '72d75a18517b',
  '53bb4f605988',
  '5fae4fe15b9865b95ba2670d',
  '817e8baf5b9865b95ba2670d',
  '519251455ba2670d',
  '4e2d5956901a77e5',
  '70b951fb98867ea25305',
  '514d8d3998867ea25305'
].map(decodeHexText)

const PROHIBITED_ACTION_WORDS = [
  '63d28fdb', '63d29032', '63458fdb', '63459032', '585e8fdb', '585e9032'
].map(decodeHexText)

// 按前后词片组合匹配，允许中间出现人称或其他干扰文本。
const PROHIBITED_COMBINATIONS = [
  {
    prefixes: ['63d2', '6345', '585e', '6233', '6363', '6417', '9876', '9802', '603c', '61df', '4f38', '6775', '6491', '6490', '6324', '64e0'],
    suffixes: ['4e0b9762', '4e0b8fb9', '4e0b908a', '4e0b4f53', '4e0b9ad4', '79c15904', '79c18655', '96349053', '96709053', '963490e8', '967090e8', '809b95e8', '809b9580', '5c41773c', '5c0f7a74']
  }
].map(rule => ({ prefixes: rule.prefixes.map(decodeHexText), suffixes: rule.suffixes.map(decodeHexText) }))

const CONTACT_WORDS = [
  '5fae4fe153f7',
  '52a05fae',
  '52a062115fae4fe1',
  '00764fe1',
  '0076007853f7',
  '0071007153f7',
  '007100717fa4',
  '80547cfb6211',
  '79c1804a6211',
  '626b78016dfb52a0',
  '4e8c7ef478017fa4'
].map(decodeHexText)

const ALLOWED_FOOD_PHRASES = [
  '59279ebb82b1'
].map(decodeHexText)

const PROHIBITED_PROFANITY_PREFIXES = [
  '64cd', '8279', '808f'
].map(decodeHexText)

const PROFANITY_TARGETS = [
  '4f60', '6211', '4ed6', '5979', '5b83', '60a8', '59b3',
  '4f605988', '4f605abd', '4f607238', '4f607239', '4f605a18', '4f6051685bb6', '4f6079565b97',
  '5988', '5abd', '7238', '7239', '5a18', '51685bb6', '79565b97'
].map(decodeHexText)

// 仅匹配前缀紧接对象词的组合，不跨越无关中文寻找对象。
const PROHIBITED_PROFANITY_PHRASES = PROHIBITED_PROFANITY_PREFIXES.flatMap(prefix => PROFANITY_TARGETS.map(target => prefix + target))

const ALLOWED_NEUTRAL_PHRASES = [
  '64cd4f5c', '64cd573a', '64cd5834', '4f5364cd', '9ad464cd', '64cd5fc3', '64cd52b3', '64cd52de', '65e964cd', '8bfe95f464cd', '8ab2959364cd'
].map(decodeHexText)

function removeAllowedFoodPhrases(value: string): string {
  return ALLOWED_FOOD_PHRASES.reduce((result, phrase) => result.split(phrase).join(''), value)
}

function containsAny(value: string, words: readonly string[]): boolean {
  return words.some(word => value.includes(word))
}

function containsProhibitedProfanity(value: string): boolean {
  const withoutNoise = value.replace(/[a-z0-9]+/gu, '')
  const remaining = ALLOWED_NEUTRAL_PHRASES.reduce((result, phrase) => result.split(phrase).join('\u0000'), withoutNoise)
  return containsAny(remaining, PROHIBITED_PROFANITY_PHRASES)
}

function containsProhibitedAction(value: string): boolean {
  // 本组词片均为中文，忽略混入词片内部的字母和数字。
  const actionText = value.replace(/[a-z0-9]+/gu, '')
  if (containsAny(actionText, PROHIBITED_ACTION_WORDS)) return true
  return PROHIBITED_COMBINATIONS.some(rule => rule.prefixes.some(prefix => {
    const prefixIndex = actionText.indexOf(prefix)
    return prefixIndex >= 0 && containsAny(actionText.slice(prefixIndex + prefix.length), rule.suffixes)
  }))
}

const LINK_PATTERN = /https?:\/\/|www\.|[a-z0-9-]+\.(?:com|cn|net|org|xyz|top)(?:\b|\/)/iu
const COMPACT_LINK_PATTERN = /(?:https?|www)[a-z0-9]*(?:com|cn|net|org|xyz|top)/iu
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/iu
const PHONE_PATTERN = /(?:^|\D)1[3-9]\d{9}(?:$|\D)/u
const VISIBLE_CONTENT = /[\p{L}\p{N}\p{S}]/u

function normalizedForms(value: string) {
  const normalized = value.normalize('NFKC').toLocaleLowerCase().replace(INVISIBLE_CHARACTERS, '')
  return { normalized, compact: normalized.replace(SEPARATORS, '') }
}

export function contentFilterError(values: readonly string[]): string | undefined {
  for (const value of values) {
    if (!value) continue
    const { normalized, compact } = normalizedForms(value)
    if (!VISIBLE_CONTENT.test(normalized)) {
      return '内容不能为空或仅包含标点符号'
    }
    if (
      LINK_PATTERN.test(normalized) ||
      COMPACT_LINK_PATTERN.test(compact) ||
      EMAIL_PATTERN.test(normalized) ||
      containsAny(compact, CONTACT_WORDS) ||
      PHONE_PATTERN.test(compact)
    ) {
      return '内容中不能包含网址、联系方式或引流信息'
    }
    if (
      containsAny(removeAllowedFoodPhrases(compact), PROHIBITED_WORDS) ||
      containsProhibitedAction(compact) ||
      containsProhibitedProfanity(compact)
    ) {
      return '内容包含违法违规或不适宜信息，请修改后再保存'
    }
  }
}
