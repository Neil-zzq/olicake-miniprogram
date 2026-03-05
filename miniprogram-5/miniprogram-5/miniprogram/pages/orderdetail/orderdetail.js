// pages/orderdetail/orderdetail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
     orderNo:{},
     isLoading:false,
     orderDetail:{},
     methodI:null,
     totalFee:'',
  },
  cancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '取消成功', icon: 'success' })
          wx.navigateBack()
        }
      }
    })
  },

  loadOrders() {
    if (this.data.isLoading ) return
    
    this.setData({ isLoading: true })
    
    wx.cloud.callFunction({
      name: 'getOrderDetail',
      data: {
        orderNo: this.data.orderNo,
      },
      success: (res) => {
        this.setData({ isLoading: false })
        console.log(res)
        if (res.result && res.result.success) {
          const getorder = res.result.order
          const totalFee = getorder.totalFee / 100
          // 兼容 selectedAddress 的两种存储结构（.address 或扁平）
          if (getorder.customerInfo && getorder.customerInfo.selectedAddress && getorder.customerInfo.selectedAddress.address) {
            getorder.customerInfo.selectedAddress = getorder.customerInfo.selectedAddress.address
          }
          this.setData({
            orderDetail: getorder,
            totalFee: totalFee
          })
          console.log(this.data.orderDetail)
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
    console.log(options.id)
    this.setData({
      orderNo:options.id
    })
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