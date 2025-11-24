// pages/location/location.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    latitude:0,
    longitude:0,
    markers: [],
    shopName: '',
    shopAddress: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      latitude: parseFloat(options.lat),
      longitude: parseFloat(options.lng),
      shopName: options.name,
      shopAddress: options.address,
      markers: [{
        id: 0,
        latitude: options.lat,
        longitude: options.lng,
        title: options.name,
        width: 20,
        height: 30 
      }]
    })
  },
  startNavigation() {
    wx.openLocation({
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      name: this.data.shopName,
      address: this.data.shopAddress,
      scale: 18
    })
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              console.log('授权成功')
            }
          })
        }
      }
    })
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