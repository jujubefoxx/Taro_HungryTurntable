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
      <view class="desc">
        <view class="view">
          {{ view }}
        </view>
      </view>
    </view>
    <view class="cover-box">
      <image
        class="cover"
        mode="aspectFill"
        :src="cover[0]"
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
      type: Array,
      default: () => ([])
    },
    seed: {
      type: String,
      default: () => ''
    },
    view: {
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
  justify-content: space-between;
  height: 110px;
  background-color: #fff;
  padding: 12px 0 12px 125px;
  border-bottom: 1px solid #f6f6f4;
  box-sizing: border-box;

  .cover-box {
    position: absolute;
    top: 12px;
    left: 0;

    .cover {
      width: 114px;
      height: 86px;
      border-radius: 4px;
    }
  }

  .title {
    position: relative;
    display: -webkit-box;
    line-height: 20px;
    font-size: 16px;
    text-align: justify;
    color: #303030;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .desc-container {
    line-height: 17px;
    font-size: 12px;
    color: #bfbfbf;

    .top {
      line-height: 17px;
      color: #ff5757;
      margin-right: 8px;
    }

    .view-icon {
      width: 15px;
      height: 15px;
      margin-bottom: -3px;
      opacity: .5;
    }
  }
}
</style>
