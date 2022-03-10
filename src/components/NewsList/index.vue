<template>
  <navigator
    class="news-list-container"
    :url="`/pages/detail/index?id=${id}`"
    @tap="handleClickIt"
  >
    <view class="title">
      <text class="title-text">
        {{ title }}
      </text>
    </view>
    <view class="desc-container">
      {{ desc }}
    </view>
    <view class="cover-box">
      <image
        class="cover"
        mode="aspectFill"
        :src="cover"
        :alt="title"
      />
    </view>
  </navigator>
</template>

<script>


export default {
  name: 'NewsList',

  props: {
    id: {
      type: [String, Number],
      default: () => null
    },
    title: {
      type: String,
      default: () => ''
    },
    cover: {
      type: String,
      default: () => ('')
    },
    seed: {
      type: String,
      default: () => ''
    },
    desc: {
      type: [Number, String],
      default: 0
    },
    index: {
      type: [Number, String],
      default: 0
    },
  },
  methods: {
    handleClickIt(e) {
      this.$emit('choose', e);
    }
  }
};
</script>

<style lang="less">
.news-list-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 110Px;
  background-color: #fff;
  padding: 12Px 0 12Px 125Px;
  border-bottom: 1Px solid #f6f6f4;
  box-sizing: border-box;

  .cover-box {
    position: absolute;
    top: 12Px;
    left: 0;

    .cover {
      width: 114Px;
      height: 86Px;
      border-radius: 4Px;
    }
  }

  .title {
    //display: flex;
    //align-items: center;
    line-height: 20Px;
    font-size: 16Px;
    text-align: left;
    height: 40Px;
    color: #303030;

    .title-text {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  .desc-container {
    //margin-top: 10Px;
    text-align: left;
    line-height: 17Px;
    font-size: 12Px;
    color: #bfbfbf;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
