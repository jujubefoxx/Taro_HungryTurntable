<template>
  <view class="panel__content">
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
            :onClick="clickList"
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
      tabList: [
        {title: '菜谱类型'},
        {title: '菜谱类型'},
        {title: '菜谱类型'}
      ],
      subType: [[{title: '子菜单', open: false, list: [{value: '菜单'}, {value: '菜单'}, {value: '菜单'}]}], [{
        title: '子菜单',
        open: false,
        list: [{value: '菜单'}, {value: '菜单'}, {value: '菜单'}]
      }]]
    }
  },
  created() {
    this.getType()
  },
  methods: {
    //点击九宫格
    clickList(item) {
      console.log(item.value)
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
      Taro.request({
        url: `${this.host}/showapi_cpType`,
        header: {
          'Authorization': `APPCODE ${this.appCode}`,
          // 'content-type': 'application/json' // 默认值
        },
        success(res) {
          const {data} = res;
          const result = data.showapi_res_body
          if (parseInt(result.ret_code) === 0) {
            const tabList = []
            const subTypeList = []
            Object.keys(result).forEach((type) => {
              if (Object.prototype.toString.call(result[type]) === '[object Object]') {
                tabList.push({title: type})
                const sub = Object.keys(result[type]).map((title) => {
                  const list = result[type][title].map(e => ({value: e}))
                  return {title: title, open: false, list: list}
                })
                subTypeList.push(sub)
              }
            })
            _this.tabList = tabList
            _this.subType = subTypeList
          } else {
            Taro.showToast({title: '查询失败', icon: 'none'})
          }
          Taro.hideLoading()

          console.log(res.data)
        },
        fail() {
          Taro.hideLoading()
        }
      })
    }
  }
}
</script>

<style scoped>

</style>
