<template>
  <view class="contact">
    <image
      :src="imgUrl.thanks"
      class="contact-img"
      mode="aspectFit"
    />
    <view class="contact-word">
      <view class="contact-content">
        <view>
          感谢使用今天吃啥大转盘！&#128521;
        </view>
        <view>
          这个转盘就是肚子饿的时候不知道吃什么写着玩的，源码放在github上，有需要的可以自取，有什么意见或建议可以提供的请联系我哦~
        </view>
        <view>
          因为作者也是个卑微打工人，获取源码需要先看一个短短的广告，暂时不提供闲聊服务，只回复和转盘有关的内容。
        </view>
      </view>
      <text>需要做些什么呢？</text>
    </view>

    <view class="contact-button">
      <AtButton
        open-type="contact"
        size="small"
        type="primary"
      >
        来亿点意见建议
      </AtButton>
      <AtButton
        :on-click="getGitLink"
        size="small"
        type="secondary"
      >
        看广告查看源码
      </AtButton>
      <!--      <AtButton-->
      <!--        :on-click="previewImg"-->
      <!--        size="small"-->
      <!--      >-->
      <!--        悄悄地打赏一下-->
      <!--      </AtButton>-->
    </view>
    <!--    <view>-->
    <!--      <img alt="打赏码" src="src/static/money.jpg" @click="previewImg">-->
    <!--    </view>-->
  </view>
</template>

<script>
import './index.scss'
import Vue from 'vue'
import Taro from '@tarojs/taro';
import {
  AtModal,
  AtModalAction,
  AtModalContent,
  AtNoticebar,
  AtModalHeader,
  AtTextarea,
  AtButton,
  AtIcon,
  AtCard
} from 'taro-ui-vue'
import TabBar from "../../components/TabBar/TabBar";

export default {
  components: {
    // eslint-disable-next-line vue/no-unused-components
    AtModal, AtModalHeader, AtModalContent, AtModalAction, AtTextarea, AtButton, AtIcon, AtNoticebar
  },
  data() {
    return {
      gitLink: 'https://github.com/jujubefoxx/Taro_HungryTurntable',
      moneyUrl: 'https://s3.bmp.ovh/imgs/2022/10/10/9f27a020bd0fd877.jpg',
      imgUrl: {
        thanks: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fww3.sinaimg.cn%2Fmw690%2F0071fkpbgy1h1063dtgw5j30zo0zon6b.jpg&refer=http%3A%2F%2Fwww.sina.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1652085285&t=7e6735ccf3a73a3ca710cb2bed413cd0',
        largeThanks: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fpic1.zhimg.com%2F50%2Fv2-9bb0baaa9a42d656b72fe92fe804d8cc_hd.jpg&refer=http%3A%2F%2Fpic1.zhimg.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1652085186&t=1f79132e6328c4da54fc00e6d2306493'
      },
      interstitialAd: null,
      videoAd: null,
    }
  },
  onLoad() {
    this.initAd();
    setTimeout(() => {
      // 在适合的场景显示插屏广告
      if (this.interstitialAd) {
        this.interstitialAd.show().catch((err) => {
          console.error(err)
        })
      }
    }, 500)
  },
  methods: {
    previewImg() {
      Taro.previewImage({
        current: this.moneyUrl,
        urls: [this.moneyUrl],
      });
    },
    initAd() {
      // 在页面中定义插屏广告
      let interstitialAd = null
      // 在页面onLoad回调事件中创建插屏广告实例
      if (Taro.createInterstitialAd) {
        interstitialAd = Taro.createInterstitialAd({
          adUnitId: 'adunit-c59134818dfcced2'
        })
        interstitialAd.onLoad(() => {
          console.log('onLoad event emit')
        })
        interstitialAd.onError((err) => {
          console.log('onError event emit', err)
        })
        interstitialAd.onClose((res) => {
          console.log('onClose event emit', res)
        })
      }
      this.interstitialAd = interstitialAd;

      // 在页面中定义激励视频广告
      let videoAd = null;
      // 在页面onLoad回调事件中创建激励视频广告实例
      if (Taro.createRewardedVideoAd) {
        videoAd = Taro.createRewardedVideoAd({
          adUnitId: 'adunit-b9023ec3c7a9f0b9'
        })
        videoAd.onLoad(() => {
        })
        videoAd.onError((err) => {
        })
        videoAd.onClose((res) => {
          // 用户点击了【关闭广告】按钮
          if (res && res.isEnded) {
            // 正常播放结束，可以下发奖励
            Taro.setClipboardData({data: this.gitLink})
              .then(() => Taro.showToast({title: 'git链接已复制至粘贴板，请粘贴至浏览器打开', icon: 'none'}));
          } else {
            Taro.showToast({title: '中途退出达咩哟', icon: 'none'})
            // 播放中途退出，不下发游戏奖励
          }

        })
      }
      this.videoAd = videoAd;
    },
    getGitLink() {
      // 用户触发广告后，显示激励视频广告
      if (this.videoAd) {
        this.videoAd.show().catch(() => {
          // 失败重试
          this.videoAd.load()
            .then(() => this.videoAd.show())
            .catch(err => {
              Taro.setClipboardData({data: this.gitLink})
                .then(() => Taro.showToast({title: '获取广告失败，git链接已复制至粘贴板，请粘贴至浏览器打开', icon: 'none'}));
            })
        })
      }

    },
  },
  onAddToFavorites(res) {
    return {
      title: '今天吃啥',
      imageUrl: this.imgUrl
    }
  },
  onShareAppMessage(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '快来看看今天吃啥',
      imageUrl: this.imgUrl
    }
  }
}
</script>
