<template>
  <view class="contact">
    <image
      class="contact-img"
      mode="aspectFit"
      :src="imgUrl.thanks"
    />
    <view class="contact-word">
      <view class="contact-content">
        <view>
          感谢使用今天吃啥大转盘！&#128521;
        </view>
        <view>
          这个转盘就是肚子饿的时候不知道吃什么写着玩的，转盘样式参考已在源码上标注，源码放在github上，菜谱的接口数据来自阿里云，有什么意见建议或者什么有趣的接口都可以点击下方的意见建议联系我哦
        </view>
      </view>

      <text>需要做些什么呢？</text>
    </view>

    <view class="contact-button">
      <AtButton
        type="primary"
        open-type="contact"
        size="small"
      >
        意见建议
      </AtButton>
      <AtButton
        type="secondary"
        size="small"
        :on-click="getGitLink"
      >
        查看源码
      </AtButton>
<!--      <AtButton-->
<!--        size="small"-->
<!--        :on-click="heihei"-->
<!--      >-->
<!--        打赏一下-->
<!--      </AtButton>-->
    </view>
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
      imgUrl: {
        thanks: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fww3.sinaimg.cn%2Fmw690%2F0071fkpbgy1h1063dtgw5j30zo0zon6b.jpg&refer=http%3A%2F%2Fwww.sina.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1652085285&t=7e6735ccf3a73a3ca710cb2bed413cd0',
        largeThanks: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fpic1.zhimg.com%2F50%2Fv2-9bb0baaa9a42d656b72fe92fe804d8cc_hd.jpg&refer=http%3A%2F%2Fpic1.zhimg.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1652085186&t=1f79132e6328c4da54fc00e6d2306493'
      }
    }
  },
  created() {

  },
  methods: {
    getGitLink() {
      Taro.setClipboardData({data: this.gitLink})
        .then(() => Taro.showToast({title: 'git链接已复制至粘贴板，请使用浏览器打开', icon: 'none'}));
    },
    heihei() {
      Taro.showToast({title: '嘿嘿，不给打赏', icon: 'none'})
      console.log('嘿嘿嘿')
    }
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
