// components/privacy-modal/privacy-modal.js
Component({
  properties: {
    // 是否显示弹窗
    show: {
      type: Boolean,
      value: true
    },
  },

  data: {
    
  },

  methods: {
    // 点击遮罩层
    onMaskTap(e) {
      // 阻止点击遮罩层关闭弹窗
      console.log(e)
      this.triggerEvent('close');
    },

    // 阻止事件冒泡
    stopPropagation(e) {
      // 空方法，阻止事件冒泡
    },

    // 阻止触摸移动
    preventTouchMove() {
      return;
    },

    // 关闭弹窗
    onClose() {
      this.triggerEvent('close');
    },

    // 点击拒绝
    onReject() {
      wx.showModal({
        title: '提示',
        content: '拒绝后将无法使用以往记录，是否确定拒绝？',
        confirmText: '确定',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 保存拒绝状态
            wx.setStorageSync('privacyAgreed', false);
            wx.setStorageSync('privacyRejectTime', new Date().getTime());
            
            this.triggerEvent('reject');
            this.triggerEvent('close');
            
            wx.showToast({
              title: '您已拒绝授权',
              icon: 'none',
              duration: 2000
            });
          }
        }
      });
    },

    // 点击允许
    onAllow(e) {
      // 这里不直接处理，等待getUserInfo回调
      // 先保存同意状态
      wx.setStorageSync('privacyAgreed', true);
      wx.setStorageSync('privacyAgreeTime', new Date().getTime());
      
      // 触发允许事件
      this.triggerEvent('allow', e.detail);
    },

    // 获取用户信息回调
    onGetUserInfo(e) {
      console.log('获取用户信息回调:', e);
      
      if (e.detail.errMsg === 'getUserInfo:ok') {
        // 用户点击允许获取用户信息
        const userInfo = e.detail.userInfo;
        console.log('用户信息:', userInfo);
        
        // 将用户信息传递给父组件
        this.triggerEvent('getuserinfo', {
          userInfo: userInfo,
          rawData: e.detail.rawData,
          signature: e.detail.signature,
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        });
      } else {
        // 用户拒绝授权
        wx.showToast({
          title: '需要授权才能使用完整功能',
          icon: 'none',
          duration: 2000
        });
      }
    },
  }
})