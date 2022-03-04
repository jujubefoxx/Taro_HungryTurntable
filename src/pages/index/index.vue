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
            <text>{{ food }}</text>
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
    <view class="result">
      {{ result }}
    </view>
    <view class="random-button">
      <button
        class="btn-max-w"
        :plain="true"
        @tap="handleRandom"
      >
        随机当前配置
      </button>
      <button
        class="button-primary"
        :plain="true"
        @tap="handleEditRandomList"
      >
        自定义随机列表
      </button>
      <button
        class="button-warn"
        :plain="true"
        @tap="showEdit = true"
      >
        自定义当前配置
      </button>
    </view>
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
      :is-opened="dialogVisible"
      :on-close="endEdit"
    >
      <AtModalHeader>随机配置</AtModalHeader>
      <AtModalContent>
        <AtTextarea
          :value="randomListText"
          :onChange="handleChange"
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
import {AtModal, AtModalAction, AtModalContent, AtModalHeader, AtTextarea} from 'taro-ui-vue'

export default {
  components: {
    AtModal, AtModalHeader, AtModalContent, AtModalAction, AtTextarea
  },
  data() {
    return {
      dialogVisible: false,
      foodList: ["北京烤鸭", "烧鸡", "快餐", "麻辣烫", "炒饭", "面", "寿司", "烤肉", "火锅", "饺子"],//食物列表
      onRotation: false, // 记录当前是否正在旋转，如果正在旋转，就不能继续点击了
      result: '点击中间按钮看看今天吃啥',//结果文案
      nextStatus: {},//转盘的下一个状态
      showEdit: false, //是否处于编辑状态
      randomListText: '',//randomList文本域内容
      randomList: ['北京烤鸭', '泰餐', '寿司', '烧鸡', '盖浇饭', '砂锅', '大排档', '米线', '满汉全席', '西餐', '麻辣烫', '自助餐', '炒面', '快餐', '水果', '西北风', '馄饨', '火锅', '烧烤', '泡面', '速冻水饺', '日本料理', '涮羊肉', '味千拉面', '肯德基', '面包', '扬州炒饭', '自助餐', '茶餐厅', '海底捞', '咖啡', '比萨', '麦当劳', '兰州拉面', '沙县小吃', '烤鱼', '海鲜', '铁板烧', '韩国料理', '粥', '快餐', '东南亚菜', '甜点', '农家菜', '川菜', '粤菜', '湘菜', '本帮菜', '竹笋烤肉']
    }
  },
  created() {
    this.handleRandom();
  },
  methods: {
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
    },
    //手动随机食物配置
    handleRandom() {
      const {randomList, foodList} = this;

      let newArr = JSON.parse(JSON.stringify(randomList)) //深拷贝
      this.foodList = foodList.map((item) => {
        const index = this.randomNumBoth(0, newArr.length)
        let result = newArr[index];
        //当随机列表的数不够的情况下随机选取已有的食物
        if(result){
          newArr.splice(index, 1) //去重
        }else{
          result=foodList[this.randomNumBoth(0, foodList.length)]
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
      // this.$prompt(`请输入需要替换${this.foodList[index]}的食物`, '提示', {
      //   confirmButtonText: '确定',
      //   cancelButtonText: '取消',
      // }).then(({value}) => {
      //   this.$message({
      //     type: 'success',
      //     message: '已修改为: ' + value
      //   });
      //   const isResult = this.foodList[index] === this.nextStatus.food;//修改的食物是否为当前结果的食物
      //   Vue.set(this.foodList, index, value) //更新新的值
      //   if (!this.nextStatus.deg || !isResult) return;//修改结果中的食物
      //   //获取结果位置的食物
      //   this.nextStatus.food = value;
      //   this.result = `就决定是你了！${this.nextStatus.food}`;
      // }).catch(() => {
      //   this.$message({
      //     type: 'info',
      //     message: '取消修改'
      //   });
      // });
      // if (value) {
      //     Vue.set(this.foodList, index, value) //更新新的值
      // }
    }
  }
}
</script>
