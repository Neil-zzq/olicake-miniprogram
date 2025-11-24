// pages/home/home.js
Page({
  data: {
    list:[1,2,3,4,5]
  },
  navigateToCS() {
    wx.navigateTo({
      url: '/pages/customerService/customerService'
    })
  },
  navigateToPreferential(){
    wx.navigateTo({
      url: '/pages/Preferential/Preferential'
    })
  },
  navigateToClassification(){
    wx.switchTab({
      url: '/pages/classification/classification'
    })
  }

})