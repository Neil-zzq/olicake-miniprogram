// pages/wode/wode.js

// 会员等级配置（顺序即卡片滑动顺序）
const TIER_ORDER = ['generalMember', 'silver', 'platinum', 'blackGold', 'diamond']
const TIER_CONFIG = {
  generalMember: { name: '注册会员',   nextThreshold: 1000,  nextName: '白银会员', discountLabel: '--折',  discount: 1.00 },
  silver:        { name: '白银会员', nextThreshold: 1000, nextName: '铂金会员', discountLabel: '9.8折', discount: 0.98 },
  platinum:      { name: '铂金会员', nextThreshold: 3000, nextName: '黑金会员', discountLabel: '9.5折', discount: 0.95 },
  blackGold:     { name: '黑金会员', nextThreshold: 5000, nextName: '钻石会员', discountLabel: '9折',  discount: 0.90 },
  diamond:       { name: '钻石会员', nextThreshold: 10000,  nextName: '',        discountLabel: '8.8折', discount: 0.88 },
}

Page({
  data: {
    statusBarHeight: 0,
    navBarContentHeight: 44,
    navBarHeight: 44,
    avatarUrl: '',
    nickName: '',
    getUserInfoSuccess: false,
    defaultAvatarUrl: 'cloud://cloud1-0gggau3xd319b71f.636c-cloud1-0gggau3xd319b71f-1317945786/其他/用户头像.png',
    // 会员信息
    usertype: '',
    memberName: '',
    discountLabel: '',
    cumulativeSpending: '0.00',
    nextLevelSpend: '0.00',
    nextLevelName: '',
    isDiamond: false,
    tierList: [],  // 5 种会员卡，含 isUnlocked
  },

  // ===== 导航方法 =====
  navigatorToOrdercenter() {
    if (this.data.getUserInfoSuccess) {
      wx.navigateTo({ url: '/pages/ordercenter/ordercenter' })
    } else {
      wx.showToast({ title: '请先登录', icon: 'error' })
    }
  },
  navigatorToAddAddress() {
    if (this.data.getUserInfoSuccess) {
      wx.navigateTo({ url: '../addresslist/addresslist' })
    } else {
      wx.showToast({ title: '请先登录', icon: 'error' })
    }
  },
  navigatorToCustomerInfo() {
    if (this.data.getUserInfoSuccess) {
      wx.navigateTo({ url: '../userinfo/userinfo' })
    } else {
      wx.showToast({ title: '请先登录', icon: 'error' })
    }
  },
  navigatorToAccountSet() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  navigateToRegister() {
    if (this.data.getUserInfoSuccess) {
      wx.navigateTo({ url: '../userinfo/userinfo' })
    } else {
      wx.showToast({ title: '请先登录', icon: 'none' })
    }
  },

  // ===== 登录 =====
  onLoginTap() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (userRes) => {
        this.wxLogin(userRes.userInfo)
      },
      fail: () => {
        wx.showToast({ title: '需要授权才能使用', icon: 'none' })
      }
    })
  },

  wxLogin(userInfo) {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          this.getOpenId(loginRes.code, userInfo)
        }
      },
      fail: () => {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' })
      }
    })
  },

  getOpenId(code, userInfo) {
    wx.cloud.callFunction({
      name: 'getOpenId',
      data: { code },
      success: (cloudRes) => {
        if (cloudRes.result && cloudRes.result.openid) {
          const openid = cloudRes.result.openid
          this.setData({
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName,
            getUserInfoSuccess: true
          })
          wx.setStorageSync('userInfo', {
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName,
            openid
          })
          wx.showToast({ title: '登录成功', icon: 'success' })
          this.loadMemberInfo(openid)
        }
      },
      fail: () => {
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    })
  },

  // ===== 加载会员信息 =====
  loadMemberInfo(openid) {
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: { openid },
      success: (res) => {
        if (res.result && res.result.success && res.result.userInfo) {
          const user = res.result.userInfo
          const usertype = user.usertype || ''
          const spending = parseFloat(user.cumulativeSpending || 0)
          const tierInfo = TIER_CONFIG[usertype] || null

          let memberName = tierInfo ? tierInfo.name : ''
          let discountLabel = tierInfo ? tierInfo.discountLabel : ''
          let isDiamond = (usertype === 'diamond')
          let nextLevelSpend = '0.00'
          let nextLevelName = ''

          if (tierInfo && tierInfo.nextThreshold) {
            nextLevelSpend = Math.max(0, tierInfo.nextThreshold - spending).toFixed(2)
            nextLevelName = tierInfo.nextName
          }

          // 构建 5 种会员卡列表，标记是否解锁
          const tierList = TIER_ORDER.map(key => {
            const cfg = TIER_CONFIG[key]
            let isUnlocked = false
            if (key === 'generalMember') {
              isUnlocked = !!usertype  // 注册即解锁会员
            } else if (key === 'silver') {
              isUnlocked = spending >= 1000
            } else if (key === 'platinum') {
              isUnlocked = spending >= 3000
            } else if (key === 'blackGold') {
              isUnlocked = spending >= 5000
            } else if (key === 'diamond') {
              isUnlocked = spending >= 10000
            }
            const nextTh = cfg.nextThreshold
            const needMore = nextTh ? Math.max(0, nextTh - spending).toFixed(2) : '0.00'
            return {
              key,
              name: cfg.name,
              discountLabel: cfg.discountLabel,
              nextName: cfg.nextName,
              nextThreshold: nextTh,
              isUnlocked,
              needMore
            }
          })

          this.setData({
            usertype,
            memberName,
            discountLabel,
            cumulativeSpending: spending.toFixed(2),
            nextLevelSpend,
            nextLevelName,
            isDiamond,
            tierList
          })

          const cached = wx.getStorageSync('userInfo') || {}
          wx.setStorageSync('userInfo', { ...cached, usertype, cumulativeSpending: spending })
        }
      },
      fail: () => {}
    })
  },

  // ===== 生命周期 =====
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
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.openid) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName || '',
        getUserInfoSuccess: true,
        usertype: userInfo.usertype || ''
      })
      this.loadMemberInfo(userInfo.openid)
    }
  }
})
