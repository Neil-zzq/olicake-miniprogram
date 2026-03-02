// pages/classification/classification.ts
Page({
  data: {
    statusBarHeight: 0,
    navBarContentHeight: 44,
    navBarHeight: 44,

    vtabs: [],
    vcontents: [],
    activeList: [],
    loading: true,
    activeTab: 0,
    cartCount: 0
  },

  onLoad() {
    // 计算自定义导航栏高度
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

    // 页面加载时获取蛋糕数据
    this.getCakeData()
  },

  onShow() {
    this.updateCartCount()
    if (this.data.vtabs.length === 0 && !this.data.loading) {
      this.getCakeData()
    }
  },

  updateCartCount() {
    wx.getStorage({
      key: 'cart',
      success: (res) => {
        const list = Array.isArray(res.data) ? res.data : []
        this.setData({ cartCount: list.length })
      },
      fail: () => {
        this.setData({ cartCount: 0 })
      }
    })
  },

  // 获取蛋糕数据 - 使用现有的 getCakeItems 云函数
  getCakeData() {
    wx.showLoading({
      title: '加载中...',
    })

    wx.cloud.callFunction({
      name: 'getCakeItems',
      success: (res) => {
        wx.hideLoading()
        console.log('云函数返回数据:', res)

        if (res.result.code === 0 && Array.isArray(res.result.data)) {
          this.processCakeData(res.result.data)
        } else {
          wx.showToast({
            title: '数据加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('调用云函数失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 处理蛋糕数据，按分类分组
  processCakeData(cakeList) {
    const categories = {}

    cakeList.forEach(cake => {
      const category = cake.category_name
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push({
        id: cake._id,
        title: cake.title,
        cover: cake.cover,
        pricemin: cake.pricemin,
        pricemax: cake.pricemax
      })
    })

    const vtabs = []
    const vcontents = []

    const categoryOrder = ['微观艺术', '祝寿系列', '童趣潮流', '手绘蛋糕']

    categoryOrder.forEach(categoryName => {
      if (categories[categoryName]) {
        vtabs.push({ title: categoryName })
        vcontents.push({
          category_name: categoryName,
          list: categories[categoryName]
        })
        delete categories[categoryName]
      }
    })

    Object.keys(categories).forEach(categoryName => {
      vtabs.push({ title: categoryName })
      vcontents.push({
        category_name: categoryName,
        list: categories[categoryName]
      })
    })

    this.setData({
      vtabs,
      vcontents,
      loading: false,
      activeTab: 0,
      activeList: vcontents[0] ? vcontents[0].list : []
    })
  },

  // 顶部类目胶囊点击
  onChipTap(e) {
    const index = Number(e.currentTarget.dataset.index || 0)
    this.setData({
      activeTab: index,
      activeList: this.data.vcontents[index] ? this.data.vcontents[index].list : []
    })
  },

  // 搜索输入事件
  onSearchInput(e) {
    const searchText = e.detail.value.trim()
    if (searchText) {
      console.log('搜索关键词:', searchText)
      // 如需真正搜索，可以在这里根据关键词过滤 vcontents
    }
  },

  onMenuTap() {
    wx.showToast({ title: '菜单', icon: 'none' })
  },

  onSearchTap() {
    wx.showToast({ title: '搜索（可后续接入）', icon: 'none' })
  },

  onFilterTap() {
    wx.showToast({ title: '筛选（可后续接入）', icon: 'none' })
  },

  goToShoppingCart() {
    wx.switchTab({ url: '/pages/shopping-cart/shopping-cart' })
  },

  goToUser() {
    wx.switchTab({ url: '/pages/wode/wode' })
  },

  onPullDownRefresh() {
    this.getCakeData()
    wx.stopPullDownRefresh()
  },

  onShareAppMessage() {
    return {
      title: '蛋糕分类',
      path: '/pages/classification/classification'
    }
  }
})