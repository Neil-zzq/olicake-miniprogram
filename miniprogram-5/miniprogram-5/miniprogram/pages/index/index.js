// index.js

// 页面固定主题配色（米黄色调）
const PAGE_THEME = { 
  bg: '#f8f0ce',
  accent: '#9a7420',
  tag: '精选推荐',
  decoMain: 'Our Cakes',
  decoSub: 'Collection'
}

Page({
  data: {
    cake: null,          // 页面主题（颜色、装饰文字）
    cakes: [],           // 所有蛋糕数据
    imgList: [],         // 所有蛋糕封面，用于轮播
    imgIndex: 0,         // 当前轮播索引
    currentCake: null,   // 当前轮播对应的蛋糕（显示在 footer）
    currentDate: '',
    currentTime: '',
    swiperHeight: 0,
    statusBarHeight: 0,
    navBarHeight: 0,
    showLoginModal: false,
    showMemberModal: false,
  },

  // ===== 加载所有蛋糕，随机取5个，用 img[0] 轮播 =====
  initCakeList() {
    wx.cloud.callFunction({
      name: 'getCakeList',
      success: (res) => {
        if (res.result.code === 0) {
          const all = res.result.data || []
          if (all.length === 0) return

          // 随机打乱后取前5个，且该蛋糕必须有 img 数组且第一张不为空
          const shuffled = all
            .filter(item => item.img && item.img.length > 0 && item.img[0])
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)

          // 没有 img 字段的兜底：从 cover 凑数
          if (shuffled.length === 0) {
            const fallback = all.filter(item => item.cover).sort(() => Math.random() - 0.5).slice(0, 5)
            shuffled.push(...fallback)
          }

          const imgList = shuffled.map(item =>
            (item.img && item.img.length > 0) ? item.img[0] : item.cover
          )

          const cake = { ...PAGE_THEME, imgList }
          this.setData({
            cakes: shuffled,
            imgList,
            cake,
            currentCake: shuffled[0]
          })
        }
      },
      fail: () => {
        wx.showToast({ title: '数据加载失败', icon: 'none' })
      }
    })
  },

  // ===== 图片轮播切换，同步更新底部蛋糕信息 =====
  onImgChange(e) {
    const idx = e.detail.current
    const currentCake = this.data.cakes[idx] || null
    this.setData({ imgIndex: idx, currentCake })
  },

  // ===== 时间日期 =====
  updateDateTime() {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const d = now.getDate()
    const h = now.getHours()
    const min = String(now.getMinutes()).padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    this.setData({
      currentDate: `${y}/${m}/${d}`,
      currentTime: `${h12}:${min} ${ampm}`
    })
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goToList() {
    wx.switchTab({ url: '/pages/classification/classification' })
  },

  goToContact() {
    wx.navigateTo({ url: '/pages/wode/wode' })
  },

  goToIngredient() {
    wx.showToast({ title: '关于原料', icon: 'none' })
  },

  goToRecommend() {
    wx.switchTab({ url: '/pages/classification/classification' })
  },

  // ===== 登录弹窗 =====
  checkLoginAndMember() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.openid) {
      this.setData({ showLoginModal: true })
    } else {
      this.checkMemberStatus(userInfo.openid)
    }
  },

  checkMemberStatus(openid) {
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: { openid },
      success: (res) => {
        if (!(res.result && res.result.success && res.result.userInfo && res.result.userInfo.usertype)) {
          this.setData({ showMemberModal: true })
        }
      },
      fail: () => {}
    })
  },

  onLoginTap() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (userRes) => { this.wxLogin(userRes.userInfo) },
      fail: () => { wx.showToast({ title: '需要授权才能登录', icon: 'none' }) }
    })
  },

  wxLogin(userInfo) {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) this.getOpenIdForLogin(loginRes.code, userInfo)
      }
    })
  },

  getOpenIdForLogin(code, userInfo) {
    wx.cloud.callFunction({
      name: 'getOpenId',
      data: { code },
      success: (cloudRes) => {
        if (cloudRes.result && cloudRes.result.openid) {
          const openid = cloudRes.result.openid
          wx.setStorageSync('userInfo', { avatarUrl: userInfo.avatarUrl, nickName: userInfo.nickName, openid })
          this.setData({ showLoginModal: false })
          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => { this.checkMemberStatus(openid) }, 1800)
        }
      },
      fail: () => { wx.showToast({ title: '登录失败，请重试', icon: 'none' }) }
    })
  },

  closeLoginModal()   { this.setData({ showLoginModal: false }) },
  closeMemberModal()  { this.setData({ showMemberModal: false }) },
  navigateToRegister() {
    this.setData({ showMemberModal: false })
    wx.navigateTo({ url: '/pages/userinfo/userinfo' })
  },

  // ===== 生命周期 =====
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 0
    const windowHeight = sysInfo.windowHeight || 750

    let navBarContentHeight = 44
    try {
      const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()
      if (menu && menu.height && menu.top != null) {
        const gap = Math.max(0, menu.top - statusBarHeight)
        navBarContentHeight = menu.height + gap * 2
      }
    } catch (e) {}

    const navBarHeight = statusBarHeight + navBarContentHeight
    const swiperHeight = windowHeight - navBarHeight

    this.setData({ statusBarHeight, navBarHeight, swiperHeight })

    this.updateDateTime()
    this._timer = setInterval(() => this.updateDateTime(), 60000)

    this.initCakeList()
    this.checkLoginAndMember()
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  }
})
