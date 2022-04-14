<template>
  <view class="index">
    <view class="wrapper">
      <view
        v-for="(light,index) in foodList"
        :key="index"
        :class="['light',onRotation?'light-twinkling':'']"
      />
      <view class="panel">
        <view
          v-for="(food,index) in foodList"
          :key="index"
          class="sector"
        >
          <view class="sector-inner">
            <text>{{ food.length > 7 ? `${food.slice(0, 5)}...` : food }}</text>
          </view>
        </view>
        <view
          :class="['pointer',onRotation?'pointer-trans':'']"
          @transitionend="afterTransitionend"
          @tap="handleClick"
        >
          吃什么呢
        </view>
      </view>
    </view>
    <AtNoticebar
      style="text-align: center"
      :marquee="false"
      :speed="50"
    >
      对转盘内容不满意的话可以点击下方按钮修改成喜欢的配置哦
    </AtNoticebar>
    <view class="result">
      {{ result.indexOf('就决定是你了') !== -1 ? `${result}&#128536;` : result }}
    </view>
    <view class="type-list">
      <AtButton
        v-for="(typeText,index) in typeList"
        :key="index"
        :type="activeType===typeText.alias?'primary':'secondary'"
        size="small"
        circle
        :on-click="(e) =>changeType(index,typeText.alias)"
      >
        {{ typeText.title }}
      </AtButton>
    </view>
    <view class="menu-list">
      <navigator
        v-show="!['self','fit'].includes(activeType)||!nextStatus.food||onRotation"
        class="menu-list__text"
        url="/pages/menu/index"
      >
        菜谱大全
      </navigator>
      <navigator
        v-show="nextStatus.food&&!onRotation&&['self','fit'].includes(activeType)"
        class="menu-list__text"
        :url="`/pages/menu/menuList?search=${nextStatus.food}`"
      >
        相关菜谱
      </navigator>
      <!--      <text class="menu-list__text">菜谱大全</text>-->
    </view>
    <view class="random-button">
      <button
        class="btn-max-w"
        :plain="true"
        @tap="handleRandom"
      >
        <view class="at-icon at-icon-shuffle-play"/>
        随机当前配置
      </button>
      <button
        class="button--primary"
        @tap="handleEditRandomList"
      >
        <view class="at-icon at-icon-edit"/>
        编辑随机列表
      </button>
      <button
        class="button--success"
        :plain="true"
        @tap="showEdit = true"
      >
        <view class="at-icon at-icon-settings"/>
        编辑当前配置
      </button>
      <button
        class="button--warn"
        :plain="false"
        @tap="handleClear"
      >
        <view class="at-icon at-icon-reload"/>
        重置随机列表
      </button>
    </view>
    <!--    TODO-->
    <!--    <navigator-->
    <!--      url="/pages/contact/index"-->
    <!--      class="contact-button"-->
    <!--    >-->
    <!--      <view class="at-icon at-icon-star" />-->
    <!--      点击此处联系作者-->
    <!--    </navigator>-->
    <AtModal
      :is-opened="showEdit"
      :on-close="endEdit"
    >
      <AtModalHeader>当前配置</AtModalHeader>
      <AtModalContent>
        <view class="content">
          <view>
            <view>
              <view
                v-for="(food,index) in foodList"
                :key="index"
                class="popBox-list"
              >
                <text class="popBox-list__text">
                  {{ food }}
                </text>
                <button
                  size="mini"
                  @tap="handleRandomOne(index)"
                >
                  随机
                </button>
                <button
                  size="mini"
                  class="button-primary"
                  @tap="handleEdit(index)"
                >
                  修改
                </button>
              </view>
            </view>
          </view>
        </view>
      </AtModalContent>
      <AtModalAction>
        <!--              <button>取消</button>-->
        <button @tap="endEdit">
          关闭
        </button>
      </AtModalAction>
    </AtModal>
    <AtModal
      v-if="dialogVisible"
      :is-opened="true"
      :on-close="endEdit"
    >
      <AtModalHeader>随机配置</AtModalHeader>
      <AtModalContent>
        <AtTextarea
          :value="randomListText"
          :on-change="handleChange"
          :count="false"
          height="400"
          :max-length="900"
          placeholder="请输入内容"
        />
        <text style="font-size: 12Px;text-align: left">
          请使用空格对食物进行分隔，如：“牛肉 鸡排 汉堡 烧烤 沙拉”
        </text>
      </AtModalContent>
      <AtModalAction>
        <button @tap="dialogVisible = false">
          取消
        </button>
        <button @tap="saveRandomList">
          确认
        </button>
      </AtModalAction>
    </AtModal>
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
  AtIcon
} from 'taro-ui-vue'
import TabBar from "../../components/TabBar/TabBar";

export default {
  components: {
    // eslint-disable-next-line vue/no-unused-components
    AtModal, AtModalHeader, AtModalContent, AtModalAction, AtTextarea, AtButton, AtIcon, AtNoticebar
  },
  data() {
    return {
      imgUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fc-ssl.duitang.com%2Fuploads%2Fitem%2F202005%2F17%2F20200517215354_mrxgp.thumb.400_0.jpg&refer=http%3A%2F%2Fc-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1648975866&t=0200ed81628758dd8d46609998cfb3fe',
      dialogVisible: false,
      resetState: false,
      foodList: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],//食物列表
      activeType: 'all',
      typeList: [
        {title: '啥都想吃', alias: 'all'},
        {title: '想喝点啥', alias: 'drink'},
        {title: '减肥吃啥', alias: 'fit'},
        {title: '聚餐吃啥', alias: 'friend'},
        {title: '吃点甜的', alias: 'sweet'},
        {title: '外卖快餐', alias: 'quick'},
        {title: '自己煮饭', alias: 'self'},
        {title: '来点零食', alias: 'snacks'}
      ],
      typeRandomList: {
        all: ['北京烤鸭', '泰餐', '寿司', '烧鸡', '盖浇饭', '砂锅', '大排档', '米线', '满汉全席', '西餐', '麻辣烫', '关东煮', '自助餐', '炒面', '快餐', '水果', '西北风', '馄饨', '火锅', '烧烤', '泡面', '速冻水饺', '日本料理', '涮羊肉', '拉面', '肯德基', '面包', '扬州炒饭', '酸菜鱼', '茶餐厅', '海底捞', '咖啡', '比萨', '麦当劳', '兰州拉面', '沙县小吃', '烤鱼', '海鲜', '铁板烧', '韩国料理', '粥', '快餐', '东南亚菜', '甜点', '农家菜', '川菜', '粤菜', '湘菜', '竹笋烤肉'],
        drink: ['杨枝甘露', '珍珠奶茶', '芝士草莓', '草莓甘露', '多肉葡萄', '海盐奶茶', '布丁奶茶', '烤奶', '西瓜汁', '糖水', '蛋糕奶茶', '抹茶牛奶', '乌龙奶茶', '大咖鸳鸯', '芋圆红茶拿铁', '鲜芋茶拿铁', '可可鲜奶', '黑糖珍珠牛奶', '一桶水果茶', '百香果双响炮', '冰淇淋红茶', '阿华田', '纯牛奶', '矿泉水', '元气森林', '茶', '茉莉花茶'],
        fit: ['西兰花炒虾仁', '菠菜炒鸡胸肉', '排骨海带汤', '尖椒肉丝', '酸辣圆白菜', '手撕包菜', '香煎三文鱼', '木耳炒芹菜', '黄油煎牛排', '卤鸡腿肉', '凉拌海带', '水煮菠菜', '炒牛肉', '炒青瓜', '西红柿蛋汤', '玉米', '清蒸鱼', '煎鸡胸肉', '水煮西兰花', '紫薯', '炒生菜', '轻食沙拉', '西兰花炒牛肉', '全麦土司', '无糖西红柿炒蛋', '去皮鸡腿', '番茄巴沙鱼', '鸡蛋羹'],
        friend: ['泰餐', '寿司', '烧鸡', '砂锅', '大排档', '猪肚鸡', '满汉全席', '西餐', '鸡公煲', '自助餐', '日本料理', '拉面', '东北菜', '涮羊肉', '酸菜鱼', '肯德基', '麦当劳', '海底捞', '牛肉火锅', '披萨', '茶餐厅', '烤鱼', '烤肉', '烧烤', '海鲜', '铁板烧', '韩国料理', '农家菜', '烤乳鸽', '窑鸡', '川菜', '粤菜', '湘菜'],
        sweet: ['绿豆沙', '豆乳盒子', '黑森林蛋糕', '提拉米苏', '半熟芝士', '蛋糕卷', '爆米花', '马卡龙', '绿豆糕', '水果蛋糕', '紫薯牛奶', '麻薯', '钵仔糕', '蛋挞', '曲奇饼', '可颂', '炸牛奶', '奶油面包', '菠萝包', '蛋黄酥', '麦芬', '戚风蛋糕', '小熊饼干', '糖水', '雪梅娘', '泡芙', '乳酪蛋糕', '舒芙蕾', '纸杯蛋糕'],
        quick: ['烧鹅饭', '烧鸭饭', '炒米粉', '盖浇饭', '蒸饺', '泡面', '酸菜鱼', '食堂', '鸡腿饭', '猪耳朵饭', '拉面', '炒面', '炒河粉', '关东煮', '炒饭', '鱼香肉丝饭', '酸辣土豆丝饭', '青椒炒肉饭', '肠粉', '排骨米饭', '麻辣烫', '冒菜', '煎饺', '煎饼', '包子', '牛肉面', '杂酱面'],
        self: ['西兰花炒虾仁', '蒜蓉金针菇', '鱼香肉丝', '尖椒肉丝', '红烧牛肉土豆', '手撕包菜', '上汤娃娃菜', '肉末嫩豆腐', '酿豆腐', '可乐鸡翅', '葱油鸡', '黄焖鸡', '烧腐竹', '鱼香茄子', '糖醋排骨', '油焖大虾', '照烧鸡腿', '日本豆腐', '酸辣土豆丝', '炖牛腩', '虾仁滑蛋', '蒜蓉虾', '咕噜肉', '手撕鸡', '酸汤肥牛', '香辣炒花甲', '辣子鸡'],
        snacks: ['薯片', '蟹柳', '巧克力', '饼干', '脆骨肠', '蛋黄酥', '辣条', '水果干', '冰淇淋', '糖果', '果冻', 'qq糖', '牛肉脯', '开心果', '牛肉干', '葡萄干', '淀粉肠', '黑椒肠'],
      },
      onRotation: false, // 记录当前是否正在旋转，如果正在旋转，就不能继续点击了
      result: '点击中间按钮看看今天吃啥',//结果文案
      nextStatus: {},//转盘的下一个状态
      showEdit: false, //是否处于编辑状态
      randomListText: '',//randomList文本域内容
      randomList: []
    }
  },
  created() {
    const list = Taro.getStorageSync('typeRandomList');
    let {typeRandomList} = this

    if (list) {
      Taro.setStorageSync('initialRandomList', typeRandomList)
      typeRandomList = list;
    }
    this.randomList = typeRandomList['all']
    this.handleRandom();
  },
  methods: {
    //清空缓存
    handleClear() {
      const _this = this;
      Taro.showModal({
        title: '提示',
        content: '重置配置会将你自定义的菜单全部恢复为初始数据，是否确认重置？',
        success(res) {
          console.log(res)

          if (res.confirm) {
            const list = Taro.getStorageSync('initialRandomList'); //获取初始值
            if (list) {
              _this.typeRandomList = list;//赋值
              _this.handleRandom();//随机转盘数据
              _this.randomList = _this.typeRandomList[_this.activeType];//当前转盘数据
              Taro.clearStorageSync() //清空缓存
            }
            Taro.showToast({title: '重置成功', icon: 'none'})
          }
        }
      })


    },
    //改变类型
    changeType(index, alias) {
      if (this.onRotation || this.activeType === alias) return;
      this.activeType = alias;
      this.randomList = this.typeRandomList[alias];
      if (this.nextStatus.deg) {
        this.resetPointer();
      }
      this.randomList = this.typeRandomList[this.activeType];//当前转盘数据
      this.handleRandom();
    },
    //复原指针
    resetPointer() {
      this.nextStatus = {};
      let getEle = document.getElementsByClassName.bind(document);
      let pointer = getEle('pointer')[0]; //获取指针元素
      pointer.style.transform = `rotateZ(0deg)`; //旋转+动画
      this.result = '点击中间按钮看看今天吃啥';//结果文案
    },
    //改变随机列表
    handleChange(value) {
      this.randomListText = value;
    },
    //关闭编辑窗口
    endEdit() {
      this.showEdit = false
    },
    //编辑随机食物列表
    handleEditRandomList() {
      this.dialogVisible = true;
      this.randomListText = this.randomList.join(' ');
    },
    //保存随机食物列表
    saveRandomList() {
      this.dialogVisible = false;
      this.randomList = this.randomListText.split(' ')
      this.typeRandomList[this.activeType] = this.randomList;

      Taro.setStorage({
        key: "typeRandomList",
        data: this.typeRandomList,
        success() {
          Taro.getStorage({
            key: "typeRandomList",
            success(res) {
              console.log(res.data)
            }
          })
        }
      })
    },
    //手动随机食物配置
    handleRandom() {
      const {randomList, foodList} = this;

      let newArr = JSON.parse(JSON.stringify(randomList)) //深拷贝
      this.foodList = foodList.map((item) => {
        const index = this.randomNumBoth(0, newArr.length)
        let result = newArr[index];
        //当随机列表的数不够的情况下随机选取已有的食物
        if (result) {
          newArr.splice(index, 1) //去重
        } else {
          result = foodList[this.randomNumBoth(0, foodList.length)]
        }
        return result
      });//修改为新的随机列表

      if (!this.nextStatus.deg) return;//修改结果中的食物
      let currentDeg = this.nextStatus.deg; //如果当前已有角度则获取角度 无则为0
      //获取结果位置的食物
      this.nextStatus.food = this.foodList[Math.floor((currentDeg + 18) % 360 / 36)];
      this.result = `就决定是你了！${this.nextStatus.food}`;
    },
    //手动随机单个食物配置
    handleRandomOne(index) {
      const {randomList, foodList} = this;
      const number = this.randomNumBoth(0, randomList.length);
      const isResult = this.foodList[index] === this.nextStatus.food;//修改的食物是否为当前结果的食物
      this.foodList[index] = randomList[number]

      Vue.set(this.foodList, index, randomList[number]) //更新新的值
      Taro.showToast({title: `已随机为：${randomList[number]}`, icon: 'none'})

      if (!this.nextStatus.deg || !isResult) return;//修改结果中的食物

      //获取结果位置的食物
      this.nextStatus.food = randomList[number];
      this.result = `就决定是你了！${this.nextStatus.food}`;
    },
    //获取一个随机数
    randomNumBoth(Min, Max) {
      const Range = Max - Min;

      const Rand = Math.random();
      //舍去
      return Min + Math.floor(Rand * Range);
    },
    afterTransitionend() {
      const {nextStatus} = this;
      setTimeout(() => { // 等闪烁三下结束
        this.onRotation = false; //结束旋转状态
        this.result = `就决定是你了！${nextStatus.food}`; //更新结果文案为下一步状态的文案
      }, 300);
    },
    //获得当前结果
    getReward() {
      let getEle = document.getElementsByClassName.bind(document);
      let pointer = getEle('pointer')[0]; //获取指针元素
      let currentDeg = this.nextStatus.deg ? this.nextStatus.deg : 0; //如果当前已有角度则获取角度 无则为0
      // 转三圈到四圈
      let rotateDeg = Math.random() * 360 + 1080;
      currentDeg += rotateDeg; //加上旋转的随机角度
      let rewardText = this.foodList[Math.floor((currentDeg + 18) % 360 / 36)] //获取结果位置的食物
      this.nextStatus = {
        deg: currentDeg,
        food: rewardText
      } //更新下一步状态
      pointer.style.transform = `rotateZ(${this.nextStatus.deg}deg)`; //旋转+动画
    },
    //重置
    reset() {
      this.onRotation = false; //关闭旋转状态
      this.result = '   '; //结果清空
    },
    // 功能1:转动转盘
    // 1.点击中间按钮转动转盘
    // 2.获得结果并显示
    // 3.制作灯闪效果
    handleClick() {
      if (this.onRotation) return; //如果在旋转 不执行

      this.reset(); //重置
      this.onRotation = true; //开启旋转状态 禁止点击事件
      this.getReward();//获取结果
    },
    handleEdit(index) {
      const {foodList, nextStatus} = this;
      const _this = this;
      Taro.showModal({
        editable: true,
        title: '提示',
        placeholderText: `请输入需要替换${this.foodList[index]}的食物`,
        success(res) {
          const {content, confirm, cancel} = res;
          if (confirm) {
            if (content) {
              Taro.showToast({title: `已修改为：${content}`, icon: 'none'})
              const isResult = foodList[index] === nextStatus.food;//修改的食物是否为当前结果的食物
              Vue.set(foodList, index, content) //更新新的值
              if (!nextStatus.deg || !isResult) return;//修改结果中的食物
              //获取结果位置的食物
              nextStatus.food = content;
              _this.result = `就决定是你了！${nextStatus.food}`;
            } else {
              Taro.showToast({title: '内容不能为空', icon: 'none'})
            }
          } else if (cancel) {
            Taro.showToast({title: '取消修改', icon: 'none'})
          }
        },
        fail() {
          Taro.showToast({title: '取消修改', icon: 'none'})
        }
      })
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
