// index.ts
// 获取应用实例
Page({
  data: {
    item2: [],
    statusBarHeight: 0,
    navBarContentHeight: 44,
    navBarHeight: 44,
  },
  
  // 初始化蛋糕数据
  initCakeList(){
    // 调用云函数获取蛋糕数据
    wx.cloud.callFunction({
      name: 'getCakeList', // 云函数名称
      success: (res) => {
        if (res.result.code === 0) {
          // 将返回的数据设置到item2
          this.setData({
            item2: res.result.data
          })
          console.log('获取蛋糕数据成功:', res.result.data)
        } else {
          console.error('获取数据失败:', res.result.message)
        }
      },
      fail: (err) => {
        console.error('调用云函数失败:', err)
        // 可以添加失败提示
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
  },
  
  onLoad: function() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 0

    // 让自定义导航栏高度贴近胶囊按钮区域，整体更像 iOS 示例图
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

    // 页面加载时调用初始化函数
    this.initCakeList()
  }
})