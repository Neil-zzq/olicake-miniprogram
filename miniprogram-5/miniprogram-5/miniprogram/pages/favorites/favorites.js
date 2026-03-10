// pages/favorites/favorites.js
Page({
  data: {
    statusBarHeight: 0,
    navBarContentHeight: 44,
    navBarHeight: 44,
    favoriteList: [],
    loading: true
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
    this.loadFavorites()
  },

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    this.setData({ loading: true })
    wx.cloud.callFunction({ name: 'getFavorites' }).then(favRes => {
      const cakeIds = favRes.result && favRes.result.code === 0 && Array.isArray(favRes.result.data) ? favRes.result.data : []
      if (cakeIds.length === 0) {
        this.setData({ favoriteList: [], loading: false })
        return
      }
      return wx.cloud.callFunction({ name: 'getCakeItems' }).then(cakeRes => {
        if (cakeRes.result.code === 0 && Array.isArray(cakeRes.result.data)) {
          const favSet = new Set(cakeIds)
          const list = cakeRes.result.data
            .filter(cake => favSet.has(cake._id))
            .map(cake => ({
              id: cake._id,
              title: cake.title,
              cover: cake.cover,
              pricemin: cake.pricemin,
              pricemax: cake.pricemax
            }))
          this.setData({ favoriteList: list, loading: false })
        } else {
          this.setData({ favoriteList: [], loading: false })
        }
      })
    }).catch(() => {
      this.setData({ favoriteList: [], loading: false })
    })
  },

  onBackTap() {
    wx.navigateBack()
  },

  goToClassification() {
    wx.switchTab({ url: '/pages/classification/classification' })
  },

  onHeartTap(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const list = this.data.favoriteList.filter(item => item.id !== id)
    const cakeIds = list.map(item => item.id)
    this.setData({ favoriteList: list })
    wx.cloud.callFunction({ name: 'saveFavorites', data: { cakeIds } }).catch(() => {})
  }
})
