// pages/ordercenter/ordercenter.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab:0,
    openid:"",
    isLoading: false,
    orders: [],
    ordersCompleted: [],
    lastUpdateTime: null,
    autoCompletedCount: 0 // 记录自动完成的订单数
  },
  
  // 调用 autoCompleteOrders 云函数更新超时订单
  async autoCompleteOrders() {
    try {
      console.log('开始自动完成超时订单检查...')
      
      const res = await wx.cloud.callFunction({
        name: 'autoCompleteOrders',
        data: {
          trigger: 'manual' // 标记为手动触发
        }
      })

      if (res.result && res.result.success) {
        const completedCount = res.result.completedCount || 0
        console.log(`自动完成订单成功，更新了 ${completedCount} 个订单`)
        
        this.setData({
          autoCompletedCount: completedCount
        })
        
        if (completedCount > 0) {
          wx.showToast({
            title: `自动完成${completedCount}个超时订单`,
            icon: 'success',
            duration: 2000
          })
        }
        
        return completedCount
      } else {
        throw new Error(res.result.error || '自动完成失败')
      }
      
    } catch (error) {
      console.error('自动完成订单失败:', error)
      // 失败不影响后续操作，继续加载订单
      return 0
    }
  },
// 时间格式化函数
formatTime(timeStr) {
  if (!timeStr || timeStr.length !== 14) {
    return '时间格式错误';
  }
  
  try {
    // 拆分时间字符串
    const year = timeStr.substring(0, 4);    // 2025
    const month = timeStr.substring(4, 6);    // 12
    const day = timeStr.substring(6, 8);      // 02
    const hour = timeStr.substring(8, 10);    // 15
    const minute = timeStr.substring(10, 12); // 20
    const second = timeStr.substring(12, 14);  // 22
    
    // 去除月份和日期的前导零
    const formattedMonth = parseInt(month).toString();
    const formattedDay = parseInt(day).toString();
    
    // 组合成易读格式
    return `${year}年${formattedMonth}月${formattedDay}日 ${hour}:${minute}:${second}`;
  } catch (error) {
    return '时间格式错误';
  }
},
  switchTab(e){
    let tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({
      currentTab:tab
    })
    this.onShow()
  },
  loadOrders() {
    if (this.data.isLoading || !this.data.openid) return
    
    this.setData({ isLoading: true })
    
    wx.cloud.callFunction({
      name: 'getUserOrders',
      data: {
        openid: this.data.openid,
        currentTab: this.data.currentTab,
        limit: 50 // 限制数量
      },
      success: (res) => {
        this.setData({ isLoading: false })
        
        if (res.result && res.result.success) {
          const formattedOrders = res.result.orders.map(order => {
            return {
              ...order, // 保留原有字段
              // 添加格式化后的时间字段
              displayPayTime: order.payTime ? this.formatTime(order.payTime) : '未支付',
              statusText: '已支付'
            };
          });
          this.setData({
            orders: formattedOrders
          })
         
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        this.setData({ isLoading: false })
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },
  loadOrdersCompleted() {
    if (this.data.isLoading || !this.data.openid) return
    
    this.setData({ isLoading: true })
    
    wx.cloud.callFunction({
      name: 'getUserOrders',
      data: {
        openid: this.data.openid,
        currentTab: this.data.currentTab,
        limit: 50 // 限制数量
      },
      success: (res) => {
        this.setData({ isLoading: false })
        
        if (res.result && res.result.success) {
          const formattedOrders = res.result.orders.map(order => {
            return {
              ...order, // 保留原有字段
              // 添加格式化后的时间字段
              displayPayTime: order.payTime ? this.formatTime(order.payTime) : '未支付',
              statusText: '已完成'
            };
          });
          this.setData({
            ordersCompleted: formattedOrders
          })
          
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        this.setData({ isLoading: false })
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */

  onLoad(options) {
    const userInfo =wx.getStorageSync('userInfo')//使用 wx.getStorageSync()同步方法
    if (userInfo) {
      this.setData({
        openid:userInfo.openid
      })
    }
    
    
    this.loadOrders()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.autoCompleteOrders()
     if (this.data.currentTab === 1) {
       this.loadOrdersCompleted()
     }
     else{
      this.loadOrders()
     }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})