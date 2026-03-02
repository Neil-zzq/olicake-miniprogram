// pages/subscribe/subscribe.js
Page({
  data: {
    isSubscribed: false
  },

  onLoad() {
    this.checkSubscriptionStatus()
  },

  // 检查订阅状态
  checkSubscriptionStatus() {
    const hasSubscribed = wx.getStorageSync('hasSubscribed')
    this.setData({ isSubscribed: hasSubscribed || false })
  },

  // 请求订阅
  async subscribe() {
    try {
      const templateId = 'bbArTvSArB8DEC4c3ai88Clodvbwx_vgYymDQK6UUwM'
      
      const res = await wx.requestSubscribeMessage({
        tmplIds: [templateId],
        success: (res) => {
          if (res[templateId] === 'accept') {
            wx.setStorageSync('hasSubscribed', true)
            this.setData({ isSubscribed: true })
            wx.showToast({ 
              title: '订阅成功！', 
              icon: 'success',
              duration: 2000
            })
          } else {
            wx.showToast({ 
              title: '订阅失败', 
              icon: 'none' 
            })
          }
        },
        fail: (err) => {
          console.error('订阅失败:', err)
          wx.showToast({ title: '订阅失败', icon: 'none' })
        }
      })
    } catch (error) {
      console.error('订阅异常:', error)
    }
  },

  // 复制页面路径（方便分享）
  copyPath() {
    wx.setClipboardData({
      data: 'pages/subscribe/subscribe',
      success: () => {
        wx.showToast({ title: '路径已复制', icon: 'success' })
      }
    })
  }
})