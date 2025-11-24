// pages/Preferential/Preferential.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rechargeDiscount:[
      {rechargeNum:600,coupon:2,coupondetailinfo:[{'full':168,'discount':30,'num':2}]},
      {rechargeNum:1000,coupon:3,coupondetailinfo:[{'full':168,'discount':60,'num':1},{'full':168,'discount':30,'num':2}]},
      {rechargeNum:2000,coupon:4,coupondetailinfo:[{'full':168,'discount':100,'num':1},{'full':168,'discount':50,'num':3}]},
      {rechargeNum:5000,coupon:8,coupondetailinfo:[{'full':388,'discount':200,'num':2},{'full':168,'discount':100,'num':2},{'full':168,'discount':50,'num':4}]},
      {rechargeNum:'' ,coupon:'' ,coupondetailinfo:[{'full':0,'discount':0,'num':0}],type:'input'},
    ],
    activeIndex:-1,
    tipsShow: false,
    tanContent1:['优惠内容：','适用商品：','有效期：']
  },

  /**
   * 生命周期函数--监听页面加载
   */
  selectItem(e) {
   const index = e.currentTarget.dataset.index;
   this.setData({
    activeIndex: index
   })
  },
  popupTips() {
    this.setData({
      tipsShow: true,
    })
    console.log(this.data.tipsShow)
  },
  onClosePopup() {
    this.setData({
      tipsShow: false,
    })
    console.log(this.data.tipsShow)
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