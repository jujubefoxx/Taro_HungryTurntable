<template>
  <view class="custom-list-container">
    <slot />

    <view class="custom-list_status">
      <slot
        v-if="finished"
        name="finished"
      >
        <view class="custom-list_finished">
          <view class="custom-list_finished-line" />
          <text class="custom-list_finished-text">
            {{ finishedText }}
          </text>
        </view>
      </slot>
      <slot
        v-if="loading"
        name="loading"
      >
        <view class="custom-list_loading">
          <text class="icon fi fi-spinner fi-pulse" />
          <text class="custom-list_loading-text">
            {{ loadingText }}
          </text>
        </view>
      </slot>
      <slot
        v-if="error"
        name="error"
      >
        <view
          class="custom-list_error"
          @tap="handleStatusContainerClick"
        >
          <text>{{ errorText }}</text>
        </view>
      </slot>
      <slot
        v-if="!loading && !error && !finished"
        name="done"
        @tap="handleStatusContainerClick"
      >
        <text>{{ doneText }}</text>
      </slot>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomList',
  props: {
    error: {
      type: Boolean,
      default: () => false
    },
    loading: {
      type: Boolean,
      default: () => false
    },
    finished: {
      type: Boolean,
      default: () => false
    },
    loadingText: {
      type: String,
      default: () => '正在努力加载中...'
    },
    finishedText: {
      type: String,
      default: () => '没有更多了'
    },
    errorText: {
      type: String,
      default: () => '请求失败，请重试'
    },
    doneText: {
      type: String,
      default: '下滑加载更多'
    },
    safeAreaInsetBottom: {
      type: Boolean,
      default: () => true
    }
  },
  methods: {
    handleStatusContainerClick(e) {
      this.$emit('load', e);
      console.log('点击');
    }
  }
};
</script>

<style lang="less">
.custom-list-container {
  padding: 0 16Px;

  .custom-list_status {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 17Px;
    font-size: 12Px;
    color: #9d9d9d;
    background-color: #fff;
    padding: 32Px 0;
  }

  .custom-list_finished {
    position: relative;
    z-index: 1;

    .custom-list_finished-text {
      display: block;
      width: 76Px;
      font-weight: 400;
      text-align: center;
      background-color: #fff;
      margin: 0 auto;
      z-index: 5;
    }

    .custom-list_finished-line {
      position: absolute;
      width: 156Px;
      height: 1Px;
      background-color: #fff;
      z-index: -1;
      top: 50%;
      left: 50%;
      content: '';
      transform: translate(-50%, -50%);
    }
  }

  .custom-list_loading {
    .icon {
      width: 17Px;
      height: 17Px;
      line-height: 17Px;
      font-size: 16Px;
      text-align: center;
      margin-right: 5Px;
    }
  }

  //.custom-list-status-container {
  //.status-container {
  //    display: flex;
  //    align-items: center;
  //    justify-content: center;
  //    height: 50Px;
  //    font-size: 14Px;
  //    color: #969799;
  //    background-color: #f7f7f7;
  //
  //    .loading .icon {
  //        width: 20Px;
  //        height: 20Px;
  //        line-height: 20Px;
  //        font-size: 18Px;
  //        text-align: center;
  //        margin-right: 5Px;
  //    }
  //}
  //}

  //.safe-area-inset-bottom {
  //    width: 100%;
  //    height: @safe-area-inset-bottom
  //}
}
</style>
