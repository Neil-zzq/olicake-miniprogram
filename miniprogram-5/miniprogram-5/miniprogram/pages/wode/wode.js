// pages/wode/wode.js
Page({
  data: {
    statusBarHeight: 0,
    navBarContentHeight: 44,
    navBarHeight: 44,
    avatarUrl: '',
    nickName: '',
    getUserInfoSuccess: false,
    defaultAvatarUrl: 'cloud://cloud1-0gggau3xd319b71f.636c-cloud1-0gggau3xd319b71f-1317945786/其他/用户头像.png',
  },
  // 跳转到订单中心
  navigatorToOrdercenter() {
    if (this.data.getUserInfoSuccess) {
      wx.navigateTo({
        url: '/pages/ordercenter/ordercenter',
      })
    }
    else{
      wx.showToast({
        title: '请先登陆',
        icon: 'error'
      })
    }
  },
  navigatorToAddAddress(){
    if (this.data.getUserInfoSuccess) {
      wx.navigateTo({
        url: '../addresslist/addresslist',
      })
    }
    else{
      wx.showToast({
        title: '请先登陆',
        icon: 'error'
      })
    }
  },
  navigatorToCustomerInfo(){
    if (this.data.getUserInfoSuccess) {
      wx.navigateTo({
        url: '../userinfo/userinfo',
      })
    }
    else{
      wx.showToast({
        title: '请先登陆',
        icon: 'error'
      })
    }
  },
  navigatorToAccountSet(){
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },
  // ✅ 正确：直接在点击事件中调用getUserProfile
  onLoginTap() {
    // 1. 先获取用户信息（必须在点击事件中直接调用）
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (userRes) => {
        console.log('获取用户信息成功:', userRes)
        
        // 2. 获取用户信息成功后，再执行登录
        this.wxLogin(userRes.userInfo)
      },
      fail: (userErr) => {
        console.error('用户拒绝授权:', userErr)
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        })
      }
    })
  },

  // 登录逻辑（在获取用户信息后调用）
  wxLogin(userInfo) {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('获取登录code:', loginRes.code)
          
          // 3. 使用code获取openid
          this.getOpenId(loginRes.code, userInfo)
        }
      },
      fail: (loginErr) => {
        console.error('登录失败:', loginErr)
      }
    })
  },

  // 获取openid
  getOpenId(code, userInfo) {
    // 使用云函数获取openid
    wx.cloud.callFunction({
      name: 'getOpenId',
      data: { code: code },
      success: (cloudRes) => {
        console.log('获取openid成功:', cloudRes)
        
        if (cloudRes.result && cloudRes.result.openid) {
          // 更新页面数据
          this.setData({
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName,
            openid: cloudRes.result.openid,
            getUserInfoSuccess: true
          })
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', {
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName,
            openid: cloudRes.result.openid
          })
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
        }
      },
      fail: (cloudErr) => {
        console.error('获取openid失败:', cloudErr)
      }
    })
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 0

    let navBarContentHeight = 44
    try {
      const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()
      if (menu && menu.height && menu.top != null) {
        const gap = Math.max(0, menu.top - statusBarHeight)
        navBarContentHeight = menu.height + gap * 2
      }
    } catch (e) {}
    const navBarHeight = statusBarHeight + navBarContentHeight
    this.setData({ statusBarHeight, navBarContentHeight, navBarHeight })

    // 检查本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        getUserInfoSuccess: true
      })
    }
  }
})