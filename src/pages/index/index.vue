<template>
  <view :class="['index',dialogVisible||showEdit?'index--fixed':'']">
    <view class="wrapper">
      <view
        v-for="(light,index) in activeFoodList"
        :key="index"
        :class="['light',onRotation?'light-twinkling':'']"
        :style="`transform: rotate(${lightReg * index}deg);`"
      />
      <view class="panel">
        <view class="panel-content">
          <view v-for="(food,index) in activeFoodList" :key="index"
                :class="[!isOddList?'panel-blade--even':`panel-blade--odd`,`panel-blade--${activeFoodList.length}`]"
                :style="`width:${sectorWidth}px;transform: rotate(${lightReg * index}deg);`"
                class="panel-blade"
          >
            <text>{{ food.length > 7 ? `${food.slice(0, 5)}...` : food }}</text>
          </view>
        </view>
        <view
          :class="['pointer',onRotation?'pointer-trans':'']"
          @tap="handleClick"
          @transitionend="afterTransitionend"
        >
          吃什么呢
        </view>
      </view>
    </view>
    <AtNoticebar
      :marquee="true"
      :single="true"
      :speed="50"
      style="text-align: center"
    >
      下方按钮可以修改转盘内容哦，需要提供意见建议可以点击最底部按钮联系客服
    </AtNoticebar>
    <view class="result">
      {{ result.indexOf('就决定是你了') !== -1 ? `${result}&#128536;` : result }}
    </view>
    <view class="type-list">
      <AtButton
        v-for="(typeText,index) in typeList"
        :key="index"
        :on-click="(e) =>changeType(index,typeText.alias)"
        :type="activeType===typeText.alias?'primary':'secondary'"
        circle
        size="small"
      >
        {{ typeText.title }}
      </AtButton>
    </view>
    <!--    <view class="menu-list">-->
    <!--      <navigator-->
    <!--        v-show="!['self','fit'].includes(activeType)||!nextStatus.food||onRotation"-->
    <!--        class="menu-list__text"-->
    <!--        url="/pages/menu/index"-->
    <!--      >-->
    <!--        菜谱大全-->
    <!--      </navigator>-->
    <!--      <navigator-->
    <!--        v-show="nextStatus.food&&!onRotation&&['self','fit'].includes(activeType)"-->
    <!--        :url="`/pages/menu/menuList?search=${nextStatus.food}`"-->
    <!--        class="menu-list__text"-->
    <!--      >-->
    <!--        相关菜谱-->
    <!--      </navigator>-->
    <!--      &lt;!&ndash;      <text class="menu-list__text">菜谱大全</text>&ndash;&gt;-->
    <!--    </view>-->
    <view class="random-button">
      <button
        :plain="true"
        class="button--success"
        @tap="showEdit = true"
      >
        <view class="at-icon at-icon-settings"/>
        定制我的转盘
      </button>
      <button
        :plain="true"
        class="button--normal"
        @tap="handleRandom"
      >
        <view class="at-icon at-icon-shuffle-play"/>
        随机一下转盘
      </button>
      <button
        class="button--primary"
        @tap="handleEditRandomList"
      >
        <view class="at-icon at-icon-edit"/>
        编辑随机清单
      </button>
      <button
        :plain="false"
        class="button--warn"
        @tap="handleClear"
      >
        <view class="at-icon at-icon-reload"/>
        重置转盘内容
      </button>
    </view>
    <ad ad-theme="white" ad-type="video" unit-id="adunit-64fa6e9dc5192905"></ad>
    <navigator
      class="contact-button"
      url="/pages/contact/index"
    >
      <view class="at-icon at-icon-star"/>
      意见建议或查看源码
    </navigator>
    <AtModal
      :close-on-click-overlay="false"
      :is-opened="showEdit"
      :on-close="endEdit"
    >
      <AtModalHeader>当前转盘</AtModalHeader>
      <AtModalContent>
        <view class="content">
          <view>
            <view>
              <view
                v-for="(food,index) in activeFoodList"
                :key="index"
                class="popBox-list"
              >
                <text class="popBox-list__text">
                  {{ food }}
                </text>
                <view class="popBox-list__btn" @tap="handleEdit(index)">
                  <AtIcon color="ccc" size="16" value="edit"></AtIcon>
                </view>
                <view class="popBox-list__btn" @tap="handleRandomOne(index)">
                  <AtIcon color="ccc" size="16" value="shuffle-play"></AtIcon>
                </view>
                <view v-if="activeFoodList.length>2" class="popBox-list__btn" @tap="handleDelete(index)">
                  <AtIcon color="ccc" size="16" value="trash"></AtIcon>
                </view>

              </view>
            </view>
            <view v-if="activeFoodList.length<10" class="popBox-list__bottom" @tap="handleAddOne()">
              <AtIcon color="ccc" size="20" value="add-circle"></AtIcon>
              新增
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
      :close-on-click-overlay="false"
      :is-opened="dialogVisible"
      :on-close="endEdit"
    >
      <AtModalHeader>随机配置</AtModalHeader>
      <AtModalContent>
        <AtTextarea
          :count="false"
          :max-length="900"
          :on-change="handleChange"
          :value="randomListText"
          height="400"
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
import textFilter from '../../apis/textFilter'

export default {
  components: {
    // eslint-disable-next-line vue/no-unused-components
    AtModal, AtModalHeader, AtModalContent, AtModalAction, AtTextarea, AtButton, AtIcon, AtNoticebar
  },
  data() {
    return {
      showNotice: true,
      imgUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fc-ssl.duitang.com%2Fuploads%2Fitem%2F202005%2F17%2F20200517215354_mrxgp.thumb.400_0.jpg&refer=http%3A%2F%2Fc-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1648975866&t=0200ed81628758dd8d46609998cfb3fe',
      dialogVisible: false,
      resetState: false,
      foodTypeList: {
        all: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅"],
        drink: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],
        fit: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],
        friend: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],
        sweet: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],
        quick: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],
        self: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],
        snacks: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],
      },
      activeType: 'all',
      typeList: [
        {title: '啥都可以', alias: 'all'},
        {title: '想喝点啥', alias: 'drink'},
        {title: '减肥吃啥', alias: 'fit'},
        {title: '聚餐吃啥', alias: 'friend'},
        {title: '吃点甜的', alias: 'sweet'},
        {title: '外卖快餐', alias: 'quick'},
        {title: '自己煮饭', alias: 'self'},
        {title: '整点夜宵', alias: 'snacks'}
      ],
      typeRandomList: {
        all: ['北京烤鸭', '泰餐', '寿司', '烧鸡', '盖浇饭', '砂锅', '大排档', '米线', '满汉全席', '西餐', '麻辣烫', '关东煮', '自助餐', '炒面', '快餐', '水果', '西北风', '馄饨', '火锅', '烧烤', '泡面', '速冻水饺', '日本料理', '涮羊肉', '拉面', '肯德基', '面包', '扬州炒饭', '酸菜鱼', '茶餐厅', '海底捞', '咖啡', '比萨', '麦当劳', '兰州拉面', '沙县小吃', '烤鱼', '海鲜', '铁板烧', '韩国料理', '粥', '快餐', '东南亚菜', '甜点', '农家菜', '川菜', '粤菜', '湘菜', '竹笋烤肉'],
        drink: ['杨枝甘露', '珍珠奶茶', '芝士草莓', '草莓甘露', '多肉葡萄', '海盐奶茶', '布丁奶茶', '烤奶', '西瓜汁', '糖水', '蛋糕奶茶', '抹茶牛奶', '乌龙奶茶', '大咖鸳鸯', '芋圆红茶拿铁', '鲜芋茶拿铁', '可可鲜奶', '黑糖珍珠牛奶', '一桶水果茶', '百香果双响炮', '冰淇淋红茶', '阿华田', '纯牛奶', '矿泉水', '元气森林', '茶', '茉莉花茶'],
        fit: ['西兰花炒虾仁', '菠菜炒鸡胸肉', '排骨海带汤', '尖椒肉丝', '酸辣圆白菜', '手撕包菜', '香煎三文鱼', '木耳炒芹菜', '黄油煎牛排', '卤鸡腿肉', '凉拌海带', '水煮菠菜', '炒牛肉', '炒青瓜', '西红柿蛋汤', '玉米', '清蒸鱼', '煎鸡胸肉', '水煮西兰花', '紫薯', '炒生菜', '轻食沙拉', '西兰花炒牛肉', '全麦土司', '无糖西红柿炒蛋', '去皮鸡腿', '番茄巴沙鱼', '鸡蛋羹'],
        friend: ['泰餐', '寿司', '烧鸡', '砂锅', '大排档', '猪肚鸡', '满汉全席', '西餐', '鸡公煲', '自助餐', '日本料理', '拉面', '东北菜', '涮羊肉', '酸菜鱼', '肯德基', '麦当劳', '海底捞', '牛肉火锅', '披萨', '茶餐厅', '烤鱼', '烤肉', '烧烤', '海鲜', '铁板烧', '韩国料理', '农家菜', '烤乳鸽', '窑鸡', '川菜', '粤菜', '湘菜'],
        sweet: ['绿豆沙', '豆乳盒子', '黑森林蛋糕', '提拉米苏', '半熟芝士', '蛋糕卷', '爆米花', '马卡龙', '绿豆糕', '水果蛋糕', '紫薯牛奶', '麻薯', '钵仔糕', '蛋挞', '曲奇饼', '可颂', '炸牛奶', '奶油面包', '菠萝包', '蛋黄酥', '麦芬', '戚风蛋糕', '小熊饼干', '糖水', '雪梅娘', '泡芙', '乳酪蛋糕', '舒芙蕾', '纸杯蛋糕'],
        quick: ['烧鹅饭', '烧鸭饭', '炒米粉', '盖浇饭', '蒸饺', '泡面', '酸菜鱼', '食堂', '鸡腿饭', '猪耳朵饭', '拉面', '炒面', '炒河粉', '关东煮', '炒饭', '鱼香肉丝饭', '酸辣土豆丝饭', '青椒炒肉饭', '肠粉', '排骨米饭', '麻辣烫', '冒菜', '煎饺', '煎饼', '包子', '牛肉面', '杂酱面'],
        self: ['西兰花炒虾仁', '蒜蓉金针菇', '鱼香肉丝', '尖椒肉丝', '红烧牛肉土豆', '手撕包菜', '上汤娃娃菜', '肉末嫩豆腐', '酿豆腐', '可乐鸡翅', '葱油鸡', '黄焖鸡', '烧腐竹', '鱼香茄子', '糖醋排骨', '油焖大虾', '照烧鸡腿', '日本豆腐', '酸辣土豆丝', '炖牛腩', '虾仁滑蛋', '蒜蓉虾', '咕噜肉', '手撕鸡', '酸汤肥牛', '香辣炒花甲', '辣子鸡'],
        snacks: ['炒米粉', '炒面', '炒河粉', '汤面', '糖水', '烧烤', '炒饭', '粥', '包子', '豆浆', '水果', '汤面', '饺子', '馄饨', '凉拌'],
      },
      onRotation: false, // 记录当前是否正在旋转，如果正在旋转，就不能继续点击了
      result: '点击中间按钮看看今天吃啥',//结果文案
      nextStatus: {},//转盘的下一个状态
      showEdit: false, //是否处于编辑状态
      randomListText: '',//randomList文本域内容
      randomList: []
    }
  },
  computed: {
    isOddList() {
      return this.activeFoodList.length % 2 !== 0;
    },
    activeFoodList() {
      return this.foodTypeList[this.activeType];
    },
    // 灯的角度
    lightReg() {
      return 360 / (this.activeFoodList.length);
    },
    // 选择器的角度
    sectorReg() {
      return (360 / (this.activeFoodList.length)) / 2;
    },
    sectorWidth() {
      let num = this.activeFoodList.length;       //个数
      let diameter = 200;      //转盘直径
      let width = 0;           //扇叶元素宽度
      let deg = 360 / num;     //每一叶的旋转角度
      if (num === 2) {
        return 10000
      } else {
        return diameter * Math.tan((deg / 2) * Math.PI / 180)
      }
    }
  },
  created() {
    let {typeRandomList, foodTypeList} = this;
    Taro.setStorageSync('initialRandomList', typeRandomList)
    Taro.setStorageSync('initialFoodTypeList', foodTypeList)

    const list = Taro.getStorageSync('typeRandomList');
    const foodList = Taro.getStorageSync(this.activeType)

    if (list) {
      typeRandomList = list;
    }
    this.randomList = typeRandomList['all'];

    if (foodList) {
      this.foodTypeList[this.activeType] = foodList.filter(i => i);
    } else {
      this.handleRandom();
    }

  },
  methods: {
    //清空缓存
    handleClear() {
      const _this = this;
      Taro.showModal({
        title: '提示',
        content: '重置配置会将你自定义的转盘全部恢复为初始数据，是否确认重置？',
        success(res) {
          console.log(res)

          if (res.confirm) {
            const list = Taro.getStorageSync('initialRandomList'); //获取初始值
            const foodList = Taro.getStorageSync('initialFoodTypeList'); //获取初始值
            if (list) {
              _this.typeRandomList = list;//赋值
              _this.foodTypeList = foodList;//赋值
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
      const foodList = Taro.getStorageSync(this.activeType)
      if (foodList) {
        this.foodTypeList[this.activeType] = foodList;
      } else {
        this.handleRandom(false);
      }
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
      let textAuth = true;// 是否允许使用该文本
      textFilter(this.randomListText).then((res) => {
        if (res.conclusionType !== 1) {
          Taro.hideLoading();
          textAuth = false;
          Taro.showToast({title: `有不合规的内容哦，请检查后再进行提交`, icon: 'none'})
        }
      }).finally(() => {
        if (!textAuth) return;
        Taro.hideLoading();

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
      })
    },
    //手动随机食物配置
    handleRandom(handle = true) {
      const {randomList, foodTypeList, activeType} = this;
      const list = foodTypeList[activeType];
      let newArr = JSON.parse(JSON.stringify(randomList)) //深拷贝
      this.foodTypeList[activeType] = list.map((item) => {
        const index = this.randomNumBoth(0, newArr.length)
        let result = newArr[index];
        //当随机列表的数不够的情况下随机选取已有的食物
        if (result) {
          newArr.splice(index, 1) //去重
        } else {
          result = list[this.randomNumBoth(0, list.length)]
        }
        return result

      });//修改为新的随机列表
      if (handle) {
        Taro.setStorageSync(activeType, this.foodTypeList[activeType])
      }
      if (!this.nextStatus.deg) return;//修改结果中的食物
      let currentDeg = this.nextStatus.deg; //如果当前已有角度则获取角度 无则为0
      //获取结果位置的食物
      this.nextStatus.food = this.foodTypeList[this.activeType][Math.floor((currentDeg + this.sectorReg) % 360 / this.lightReg)];
      this.result = `就决定是你了！${this.nextStatus.food}`;
    },
    //手动随机单个食物配置
    handleRandomOne(index) {
      const {randomList, activeType} = this;
      const number = this.randomNumBoth(0, randomList.length);
      const isResult = this.foodTypeList[activeType][index] === this.nextStatus.food;//修改的食物是否为当前结果的食物
      this.foodTypeList[activeType][index] = randomList[number]

      Vue.set(this.foodTypeList[activeType], index, randomList[number]) //更新新的值
      Taro.showToast({title: `已随机为：${randomList[number]}`, icon: 'none'})
      Taro.setStorageSync(activeType, this.foodTypeList[activeType])

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
      let rewardText = this.foodTypeList[this.activeType][Math.floor((currentDeg + this.sectorReg) % 360 / this.lightReg)] //获取结果位置的食物
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
    // 编辑某一块
    handleEdit(index) {
      const {foodTypeList, activeType, nextStatus} = this;
      const _this = this;
      Taro.showModal({
        editable: true,
        title: '提示',
        placeholderText: `请输入需要替换${this.foodTypeList[this.activeType][index]}的内容`,
        success(res) {
          const {content, confirm, cancel} = res;
          if (confirm) {
            if (content) {
              let textAuth = true;// 是否允许使用该文本
              textFilter(content).then((res) => {
                if (res.conclusionType !== 1) {
                  Taro.hideLoading();
                  textAuth = false;
                  Taro.showToast({title: `内容不合规，换一个词试试吧`, icon: 'none'})
                }
              }).finally(() => {
                if (!textAuth) return;
                Taro.hideLoading();
                Vue.set(_this.foodTypeList[activeType], index, content) //更新新的值
                Taro.setStorageSync(activeType, _this.foodTypeList[activeType])
                Taro.showToast({title: `已修改为：${content}`, icon: 'none'})
                const isResult = foodTypeList[activeType][index] === nextStatus.food;//修改的食物是否为当前结果的食物
                if (!nextStatus.deg || !isResult) return;//修改结果中的食物
                //获取结果位置的食物
                nextStatus.food = content;
                _this.result = `就决定是你了！${nextStatus.food}`;
              })
            } else {
              Taro.showToast({title: '内容不能为空', icon: 'none'})
            }
          }
        },
        fail() {
          Taro.showToast({title: '取消修改', icon: 'none'})
        }
      })
    },
    // 删除某一项
    handleDelete(index) {
      const food = this.foodTypeList[this.activeType][index];
      this.foodTypeList[this.activeType].splice(index, 1);
      Taro.showToast({title: `已删除${food}`, icon: 'none'})
      this.resetPointer();
      Taro.setStorageSync(this.activeType, this.foodTypeList[this.activeType])
    },
    // 新增一项
    handleAddOne() {
      const {foodTypeList, activeType, nextStatus} = this;
      const _this = this;
      Taro.showModal({
        editable: true,
        title: '提示',
        placeholderText: `请输入需要新增的内容`,
        success(res) {
          const {content, confirm} = res;
          if (confirm) {
            if (content) {
              let textAuth = true;
              textFilter(content).then((res) => {
                if (res.conclusionType !== 1) {
                  Taro.hideLoading();
                  textAuth = false;
                  Taro.showToast({title: `内容不合规，换一个词试试吧`, icon: 'none'})
                }
              }).finally(() => {
                if (!textAuth) return;
                Taro.hideLoading();

                foodTypeList[activeType].push(content);
                // Vue.set(_this.foodTypeList, activeType, '') //更新新的值
                Taro.setStorageSync(activeType, _this.foodTypeList[activeType])
                Taro.showToast({title: `已添加${content}`, icon: 'none'})
                if (nextStatus.deg) {
                  _this.resetPointer();
                }
              })
            } else {
              Taro.showToast({title: '内容不能为空', icon: 'none'})
            }
          }
        },
        fail() {
          Taro.showToast({title: '取消修改', icon: 'none'})
        }
      })
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
