<template>
  <view class="menu-list-container">
    <view class="example-item">
      <picker
        class="picker--first"
        :range="multiSelector[0]"
        :value="mulitSelectorValues[0]"
        @change="(e)=>handleMulitChange(e.detail.value,0)"
      >
        <!--                <AtList>-->
        <!--                  <AtListItem-->
        <!--                    title="菜谱类型："-->
        <!--                    :extra-text="'123'"-->
        <!--                    :icon-info="{ size: 25, color: '#78A4FA', value: 'list', }"-->
        <!--                  />-->
        <!--                </AtList>-->
        <view class="at-icon at-icon-chevron-down">
          {{ multiSelector[0][mulitSelectorValues[0]] }}
        </view>
      </picker>
      -
      <picker
        class="picker--second"
        :range="multiSelector[1]"
        :value="mulitSelectorValues[1]"
        @change="(e)=>handleMulitChange(e.detail.value,1)"
      >
        <view class="at-icon at-icon-chevron-down">
          {{ multiSelector[1][mulitSelectorValues[1]] }}
        </view>
      </picker>
      -
      <picker
        class="picker--second"
        :range="multiSelector[2]"
        :value="mulitSelectorValues[2]"
        @change="(e)=>handleMulitChange(e.detail.value,2)"
      >
        <view class="at-icon at-icon-chevron-down">
          {{ multiSelector[2][mulitSelectorValues[2]] }}
        </view>
      </picker>
    </view>
    <AtSearchBar
      :value="value"
      :on-change="onChange.bind(this, 'value')"
      :on-action-click="onActionClick"
    />
    <custom-list
      :finished="dataItem.finished"
      :loading="dataItem.loading"
      @load="fetchData"
    >
      <view
        v-for="(list, key) in dataItem.data"
        :key="key"
      >
        <news-list
          v-bind="list"
          :index="key"
          @choose="handleClickNews(key)"
        />
      </view>
    </custom-list>
  </view>
</template>

<script>
import './index.scss'
import Taro from '@tarojs/taro';
import {AtSearchBar, AtList, AtListItem} from 'taro-ui-vue'
import Vue from 'vue'

export default {
  name: "MenuList",
  components: {
    AtSearchBar, AtList, AtListItem
  },
  data() {
    return {
      dataItem: {
        data: [],
        loading: false,
        finished: false,
        error: false,
        page: 1
      },
      host: 'https://caipu.market.alicloudapi.com',
      selector: ['口味特色', '海产'],
      selectorValue: 0,
      multiSelector: [
        ['饭', '粥', '粉'],
        ['全部', '猪肉', '牛肉'],
        ['全部', '随便', '随便', '随便']
      ],
      subList: [['全部', '猪肉', '牛肉', '猪肉', '哈哈'], ['全部', '羊肉', '牛肉'], ['全部', '鸡肉', '牛肉']],
      finalList: [[['随便', '随便', '随便'], ['1', '2'], ['1', '2', '3'], ['1']], [['22', '1'], ['123213']], [['213123'], ['21312']]],
      mulitSelectorValues: [0, 0, 0],
      appCode: 'e61c205f09f7484581728061e8b8f2af',
      current: 0,
      value: '',
      menuList: [],
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
  computed: {
    finalType() {
      //选中的类型
      //1.如果第三个index不为0 则获取第三个的内容
      //2.递推上去
      const {multiSelector, mulitSelectorValues} = this;
      if (parseInt(mulitSelectorValues[2]) !== 0) {
        return multiSelector[2][mulitSelectorValues[2]]
      } else if (parseInt(mulitSelectorValues[1]) !== 0) {
        return multiSelector[1][mulitSelectorValues[1]]
      } else {
        return multiSelector[0][mulitSelectorValues[0]]
      }
    }
  },
  created() {
    let {menuList} = this;
    menuList = Taro.getStorageSync('menuList');
    this.multiSelector = [menuList.firstMenu, menuList.secondMenu[0], menuList.finalMenu[0][0]]
    this.menuList = menuList
  },
  methods: {
    handleClickNews(key) {
      console.log(key)
    },
    fetchData() {
    },
    handleMulitChange(value, column) {
      value = parseInt(value);
      column = parseInt(column)
      const {mulitSelectorValues, multiSelector, menuList} = this;
      const {finalMenu, secondMenu} = menuList
      let Index = [...mulitSelectorValues]


      if (column === 0) {
        //选择第一项
        // console.log(menuList.secondMenu, secondMenu, menuList, this.menuList, this)
        Vue.set(multiSelector, 1, secondMenu[value]) //更新二级菜单的值
        Vue.set(multiSelector, 2, ['全部']) //更新三级菜单
        Index = [value, 0, 0]
      } else if (column === 1) {
        //选择第二项
        if (value === 0) {
          //选中全部
          Vue.set(multiSelector, 2, ['全部']) //更新三级菜单
        } else {
          Vue.set(multiSelector, 2, finalMenu[mulitSelectorValues[0]][value - 1]) //更新三级菜单
        }
        Index[1] = value; //修改位置
        Index[2] = 0; //修改位置
      } else {
        //选择第三项
        Index[2] = value;//修改位置
      }
      this.mulitSelectorValues = Index
    },
    handleColumnChange(e) {
      console.log(e, '123')
      const {column, value} = e.detail;
      console.log(e)
      const {multiSelector} = this;
      if (column === 0) {
        multiSelector[1] = ['123']
        Vue.set(this.multiSelector, 1, this.subList[value]) //更新新的值
        Vue.set(this.multiSelector, 2, ['全部']) //更新新的值
        this.mulitSelectorValues = [value, 0, 0]
        console.log(this.subList[value])
      }

    },
    handleChange(e) {
      this.selectorValue = e.detail.value
    },
    handleCancel(e) {
    },
    onChange(stateName, value) {
      this[stateName] = value
    },
    onActionClick() {
      console.log('点击了搜索按钮')
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
