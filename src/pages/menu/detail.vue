<template>
  <view class="menu-detail">
    <image
      style="width: 100%"
      class="cover"
      mode="widthFix"
      :src="dataItem.largeImg"
      :alt="dataItem.cpName"
    />

    <view class="at-article">
      <view class="at-article__h1">
        {{ dataItem.cpName }}
      </view>
      <view class="at-article__info">
        {{ dataItem.des }}
      </view>
      <view class="at-article__content">
        <view class="at-article__section">
          <!--          <view class="at-article__h2">这是二级标题</view>-->
          <AtCard
            :note="dataItem.tip"
            title="食材用量"
            :icon="{ size: 25, value: 'list', }"
          >
            <AtList>
              <AtListItem v-for="(yl,index) in dataItem.yl" :key="index" :title="yl.ylName" :extraText="yl.ylUnit"/>
            </AtList>
          </AtCard>
        </view>
        <view class="at-article__section">
          <view class="at-article__h3">
            步骤
          </view>
          <view v-for="(steps,index) in dataItem.steps" :key="index">
            <!--            {{ steps.orderNum }}-->
            <view class="at-article__p">
              {{ steps.content }}
            </view>
            <image
              class="at-article__img"
              :src="steps.imgUrl"
              mode="widthFix"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import './index.scss'
import {AtList, AtListItem, AtCard,AtDivider } from 'taro-ui-vue'

export default {
  name: "MenuDetail",
  components: {AtList, AtListItem, AtCard,AtDivider},
  data() {
    return {
      dataItem: {
        "cpName": "麻辣烫",
        "ct": "2020-07-19 22:56:02.217",
        "des": "新鲜食材准备好换个烧法新鲜食材准备好换个烧法新鲜食材准备好换个烧法新鲜食材准备好换个烧法新鲜食材准备好换个烧法新鲜食材准备好换个烧法新鲜食材准备好换个烧法新鲜食材准备好换个烧法。",
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
      }
    }
  },
  created() {
  },
  methods: {},
  onLoad: function (options) {
    if (!options.dataItem) return
    this.dataItem = JSON.parse(options.dataItem)
    console.log(this.dataItem)
  }
}
</script>
