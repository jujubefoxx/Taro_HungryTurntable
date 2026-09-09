// 复用 1.0-20260909 已有广告位，保持原广告类型。抖音暂不接入。
export const WEAPP_ADS = {
  rewarded: 'adunit-b9023ec3c7a9f0b9',
  banner: 'adunit-ecc87276430967fb',
  video: 'adunit-64fa6e9dc5192905'
} as const

// 不启用旧版插屏位，避免在转盘、进食、编辑过程中打断用户。
export const ADS_ENABLED = process.env.TARO_ENV === 'weapp'
export const REWARDED_ENABLED = ADS_ENABLED && WEAPP_ADS.rewarded.trim().length > 0
