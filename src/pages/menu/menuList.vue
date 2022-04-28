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
    <AtNoticebar
      v-if="searchTips"
      close
      marquee
      :speed="50"
    >
      相关菜谱搜索结果仅供参考，如需精确搜索，请根据菜谱类别进行选择
    </AtNoticebar>
    <view
      v-for="(list, key) in dataList"
      :key="key"
      class="list-container"
    >
      <news-list
        v-bind="list"
        :index="key"
        @choose="handleClickNews(key)"
      />
      <ad v-if="(key+1)%9===0" unit-id="adunit-ecc87276430967fb"></ad>
    </view>
    <AtLoadMore
      :on-click="handleClick"
      :status="status"
    />
  </view>
</template>

<script>
import './index.scss'
import Taro from '@tarojs/taro';
import {AtSearchBar, AtLoadMore, AtNoticebar} from 'taro-ui-vue'
import Vue from 'vue'
import {getMenuList} from "../../apis";

export default {
  name: "MenuList",
  components: {
    AtSearchBar, AtLoadMore, AtNoticebar
  },
  data() {
    return {
      page: 1,
      maxResults: 20,
      status: 'more',
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
      searchTips: false,
      menuList: [],
      showapi_res_body: [{
        "cpName": "麻辣烫",
        "ct": "2020-07-19 22:56:02.217",
        "des": "新鲜食材准备好换个烧法。",
        "id": "5f145f02bf79d8701009ab28",
        "largeImg": "http://i2.chuimg.com/8abc5ef8235d419f961a3c8b6cafe701_3285w_2628h.jpg?imageView2/2/w/660/interlace/1/q/90",
        "smallImg": "http://i2.chuimg.com/8abc5ef8235d419f961a3c8b6cafe701_3285w_2628h.jpg?imageView2/1/w/215/h/136/interlace/1/q/90",
        "steps": [{
          "content": "1.黑木耳泡发好，洗净所有食材。2.鸡腿切肉片、牛肉切片，撒盐放淀粉腌制。",
          "imgUrl": "http://i2.chuimg.com/8dd84ff1e22e485ba9e631f617971890_4032w_3024h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 1
        }, {
          "content": "3.锅底：干锅下猪肉煎出油，下鸡腿骨翻炒，再下番茄（去皮切丁）翻炒，加入黑木耳、豆腐丝、开水盖锅盖煮成汤（多烧一会）",
          "imgUrl": "http://i2.chuimg.com/64540b1572e8494aa59c6fc478478d7b_4019w_3014h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 2
        }, {
          "content": "4.先放鸡肉、猪肉、花菜煮开，再放剩余食材。",
          "imgUrl": "http://i2.chuimg.com/012c19aa93b141798441d9fb186d21b7_3024w_3024h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 3
        }, {
          "content": "5.青菜、金针菇可以最后放。",
          "imgUrl": "http://i2.chuimg.com/8d231b1c8a56400e97fd9e9068eb71df_3024w_3024h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 4
        }, {
          "content": "6.撒点香菜开吃。",
          "imgUrl": "http://i2.chuimg.com/d7805caabbd94accbbc405c74270b492_4032w_3024h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 5
        }, {
          "content": "来个渲染—效果图",
          "imgUrl": "http://i2.chuimg.com/7ad21ee4742e4ac2905b499a2c5b70cc_3450w_2760h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 6
        }, {
          "content": "某餐馆的麻辣烫—香菇锅底。",
          "imgUrl": "http://i2.chuimg.com/a5a1505af20d443c8f1c8f793ee370ed_4032w_3024h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 7
        }, {
          "content": "番茄锅底。",
          "imgUrl": "http://i2.chuimg.com/b8a91fcb538a46279d54766bd03f30a4_4032w_3024h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 8
        }],
        "tip": "1.食材的量还可以减少一点，三个人吃不完。2.鸡蛋打开可以事先和肉类一起下汤里直接煮。",
        "type": "肉类 鸡 鸡腿",
        "type_v1": "肉类",
        "type_v2": "鸡",
        "type_v3": "鸡腿",
        "yl": [{"ylName": "牛肉", "ylUnit": "少量"}, {"ylName": "猪肉", "ylUnit": "少量"}, {
          "ylName": "鸡腿",
          "ylUnit": "1只"
        }, {"ylName": "鸡蛋", "ylUnit": "2个"}, {"ylName": "土豆", "ylUnit": "2个"}, {
          "ylName": "番茄",
          "ylUnit": "2个"
        }, {"ylName": "花菜", "ylUnit": "小半个"}, {"ylName": "青菜", "ylUnit": "1小把"}, {
          "ylName": "香菜",
          "ylUnit": "5-6颗"
        }, {"ylName": "金针菇", "ylUnit": "1把"}, {"ylName": "豆腐皮", "ylUnit": "1张"}, {
          "ylName": "豆腐丝",
          "ylUnit": "少量"
        }, {"ylName": "粉丝", "ylUnit": "少量"}, {"ylName": "面饼", "ylUnit": "1个"}, {
          "ylName": "盐",
          "ylUnit": "少量"
        }, {"ylName": "淀粉", "ylUnit": "1小勺"}]
      }, {
        "cpName": "【地狱麻辣烫】",
        "ct": "2019-01-09 22:30:29.151",
        "des": "一口大锅咕嘟咕嘟永远冒着热气，一台冰柜以格子为区间整齐的放着各种食材，肉丸可以按个论，蔬菜也被分成小捆的样子，喜欢什么就拿，恨不得每一样都加上。",
        "id": "5c360585e9b6cc5dcac88551",
        "largeImg": "http://i2.chuimg.com/e09cffac5add11e7947d0242ac110002_1611w_1076h.jpg?imageView2/2/w/660/interlace/1/q/90",
        "smallImg": "http://i2.chuimg.com/e09cffac5add11e7947d0242ac110002_1611w_1076h.jpg?imageView2/1/w/215/h/136/interlace/1/q/90",
        "steps": [{
          "content": "老母鸡、猪皮冷水锅焯水，捞出再次放入清水锅，加京葱、姜片，料酒，转小火慢炖2-3小时，捞出猪皮和鸡弃之，高汤完成。",
          "imgUrl": "http://i2.chuimg.com/b641ac525ade11e7bc9d0242ac110002_1052w_702h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 1
        }, {
          "content": "油锅爆香姜蒜末，放入八角2个，香叶3个，白寇4个，草果2颗，桂皮2片、适量郫县豆瓣酱、花椒和干辣椒，均匀翻炒。",
          "imgUrl": "http://i2.chuimg.com/9de9f8805ade11e7947d0242ac110002_1052w_702h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 2
        }, {
          "content": "将炒好的底料倒入砂锅，加3大勺醪糟，注入高汤，煮沸。",
          "imgUrl": "http://i2.chuimg.com/a80bff8e5ade11e7947d0242ac110002_1611w_1076h.jpg?imageView2/2/w/300/interlace/1/q/90",
          "orderNum": 3
        }, {
          "content": "转中小火始终保持汤面微开，先放入处理好的荤菜，煮至无明显血色，再放入素菜，所有食材煮熟后即可捞出食用。",
          "imgUrl": "http://i1.chuimg.com/af0fc5865ade11e7bc9d0242ac110002_1611w_1076h.jpg@2o_50sh_1pr_1l_300w_90q_1wh",
          "orderNum": 4
        }],
        "tip": "",
        "type": "肉类 鸡 老母鸡",
        "type_v1": "肉类",
        "type_v2": "鸡",
        "type_v3": "老母鸡",
        "yl": [{"ylName": "牛丸", "ylUnit": "适量"}, {"ylName": "肉片", "ylUnit": "适量"}, {
          "ylName": "蛋",
          "ylUnit": "1个"
        }, {"ylName": "方便面", "ylUnit": "适量"}, {"ylName": "素菜", "ylUnit": "适量"}, {
          "ylName": "老母鸡",
          "ylUnit": "适量"
        }, {"ylName": "猪皮", "ylUnit": "适量"}, {"ylName": "京葱、姜片、料酒", "ylUnit": "适量"}, {
          "ylName": "香姜蒜末",
          "ylUnit": "适量"
        }, {"ylName": "八角", "ylUnit": "2个"}, {"ylName": "香叶", "ylUnit": "3个"}, {
          "ylName": "白寇",
          "ylUnit": "4个"
        }, {"ylName": "草果", "ylUnit": "2颗"}, {"ylName": "桂皮", "ylUnit": "2片"}, {
          "ylName": "郫县豆瓣酱",
          "ylUnit": "适量"
        }, {"ylName": "花椒、干辣椒", "ylUnit": "适量"}, {"ylName": "醪糟", "ylUnit": "3勺"}]
      }]
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
    },
    dataList() {
      return this.showapi_res_body.map((item) => ({
        title: item.cpName,
        desc: item.des,
        cover: item.smallImg
      }))
    }
  },
  watch: {
    // mulitSelectorValues() {
    //   this.reset();
    //   this.fetchData();
    // }
  },
  onReachBottom() {
    this.fetchData();
  },
  onLoad(option) {
    this.reset();
    let {menuList, mulitSelectorValues} = this;
    menuList = Taro.getStorageSync('menuList');
    this.menuList = menuList;

    if (option.query) {
      const query = JSON.parse(option.query)
      console.log(query, menuList, menuList.finalMenu)
      this.multiSelector = [menuList.firstMenu, menuList.secondMenu[query.firstIndex], menuList.finalMenu[query.firstIndex][query.secondIndex]]
      this.mulitSelectorValues = [query.firstIndex, query.secondIndex + 1, query.finalIndex + 1]
    } else {
      this.multiSelector = [menuList.firstMenu, menuList.secondMenu[0], menuList.finalMenu[0][0]]
    }
    if (option.search) {
      this.value = option.search
      this.searchTips = true
      // this.mulitSelectorValues = [7, 0, 0]
    }
    this.fetchData();
  },
  methods: {
    reset() {
      this.showapi_res_body = []
      this.page = 1
      this.status = 'more'
    },
    handleClickNews(key) {
      Taro.setStorageSync('MenuDetail', this.showapi_res_body[key])
      Taro.navigateTo({url: `/pages/menu/detail`})
    },
    fetchData() {
      if (this.status !== 'more') return
      this.status = 'loading';
      const {finalType, value, maxResults, page} = this;

      const query = {type: finalType, cpName: value, maxResults, page}
      getMenuList(query).then((res) => {
        const result = res.showapi_res_body
        this.showapi_res_body = [...this.showapi_res_body, ...result.datas]
        this.page += 1;

        if (this.showapi_res_body.length < maxResults) {
          this.status = 'noMore'
        } else {
          this.status = 'more'
        }
      }).catch((fail) => {
        this.status = 'noMore'
      })
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
      this.reset();
      this.fetchData();
    },
    onChange(stateName, value) {
      this[stateName] = value
    },
    onActionClick() {
      this.showapi_res_body = []
      this.page = 1
      this.status = 'more'
      this.fetchData()
      console.log('点击了搜索按钮')
    },
    //标签点击事件
    handleClick(value) {
      this.current = value
    },
  }
}
</script>

<style scoped>

</style>
