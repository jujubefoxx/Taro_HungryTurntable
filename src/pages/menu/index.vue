<template>
  <view class="menu-container">
    <view class="menu-page">
      <AtList :has-border="false">
        <AtListItem
          v-for="(type,index) in tabList"
          :key="index"
          :class="['type-list',index===current?'type-list--active':'']"
          :title="type.title"
          :has-border="false"
          :on-click="(e)=>handleClick(index)"
        />
      </AtList>
      <view class="submenu-list">
        <AtAccordion
          v-for="(item,key) in subType[current]"
          :key="key"
          :is-animation="false"
          :on-click="(e)=>onClickSubType(key)"
          :title="item.title"
          :open="item.open"
        >
          <AtGrid
            mode="rect"
            :has-border="false"
            :data="item.list"
            :on-click="(list,index)=>clickList(list,index,item.title,key)"
          />
        </AtAccordion>
      </view>
    </view>
  </view>
</template>

<script>
import './index.scss'
import Taro from '@tarojs/taro';
import {AtAccordion, AtGrid, AtList, AtListItem} from 'taro-ui-vue'
import {getMenuType} from "../../apis";

export default {
  name: "Menu",
  components: {
    AtAccordion,
    AtGrid, AtList, AtListItem
  },
  data() {
    return {
      host: 'https://caipu.market.alicloudapi.com',
      appCode: 'e61c205f09f7484581728061e8b8f2af',
      current: 0,
      value: false,
      tabList: [],
      subType: []
    }
  },
  created() {
    this.getType()
  },
  onLoad() {
    console.log('onload')
    this.initAd();
  },
  methods: {
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
      // 在适合的场景显示插屏广告
      if (interstitialAd) {
        interstitialAd.show().catch((err) => {
          console.error(err)
        })
      }
    },
    //点击九宫格
    clickList(item, index, title, key) {
      const {tabList, current} = this
      const query = {
        firstMenu: tabList[current].title,
        firstIndex: current,
        secondMenu: title,
        secondIndex: key,
        finalMenu: item.value,
        finalIndex: index
      }
      // console.log(index, title, tabList[current].title, query)

      Taro.navigateTo({url: `/pages/menu/menuList?query=${JSON.stringify(query)}`})
    },
    //手风琴点击事件
    onClickSubType(val) {
      // this.value = val
      this.subType[this.current][val].open = !this.subType[this.current][val].open
    },
    //标签点击事件
    handleClick(value) {
      this.current = value
    },
    //获取类别
    getType() {
      Taro.showLoading({
        title: '加载中'
      })
      const _this = this
      getMenuType().then((res) => {
        const result = res.showapi_res_body
        const tabList = [] //左侧菜单
        const subTypeList = [] //手风琴列表
        const storage = {firstMenu: [], secondMenu: [], finalMenu: []}//将数据循环存入缓存

        Object.keys(result).forEach((type) => {
          //只遍历对象结构的结果
          if (Object.prototype.toString.call(result[type]) === '[object Object]') {
            tabList.push({title: type}) //生成左侧菜单
            storage.firstMenu.push(type) //一级菜单存入仓库

            //二级菜单存入仓库
            const second = Object.keys(result[type]).map((title) => (title))
            second.unshift('全部')
            storage.secondMenu.push(second)

            const sub = Object.keys(result[type]).map((title, index) => {
              const list = result[type][title].map(e => ({value: e}))//三级菜单的数据

              return {title: title, open: false, list: list}
            })
            subTypeList.push(sub)//二级菜单列表
          }
        })
        subTypeList.forEach((item, index) => {
          storage.finalMenu.push([])
          storage.finalMenu[index] = item.map((i) => {
              const arr = i.list.map(value => (value.value))
              arr.unshift('全部')
              return arr
            }
          )//三级菜单存入仓库
        })
        Taro.setStorageSync('menuList', storage)

        _this.tabList = tabList
        _this.subType = subTypeList
      }).catch((fail) => {
        // Taro.showToast({title: '查询失败', icon: 'none'})
        Taro.hideLoading();
      })
    }
  }
}
</script>

<style scoped>

</style>
