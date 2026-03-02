// pages/addresslist/addresslist.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    openid: '',
    addressList: [],
  },
  editAddress(e) {
    console.log(e)
    const id = e.currentTarget.dataset.id
    // 获取对应的地址信息
    const address = this.data.addressList[id]
    console.log('要编辑的地址:', address)
    wx.navigateTo({
      url: `/pages/add-address/add-address?addressId=${id}`
    })
  },
  addAddressItem() {
    wx.navigateTo({
      url: '../add-address/add-address',
    })
  },
  async loadAddressList() {
    await this.initOpenId()
    wx.cloud.callFunction({
      name: 'getAddressList',
      data: {
        openid: this.data.openid
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const addressList = res.result.addressList
          console.log(res.result.addressList)
          this.setData({
            addressList: addressList
          })

        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },
  //初始化tOpenId
  async initOpenId() {
    // 1. 先检查本地存储是否有openid
    const storedOpenId = wx.getStorageSync('openid')
    if (storedOpenId) {
      console.log('从本地存储获取openid:', storedOpenId)
      this.setData({
        openid: storedOpenId
      })
      return storedOpenId
    }
    // 2. 本地没有，从云函数获取
    await this.getOpenId()
  },
  // 拿到用户的OpenId
  async getOpenId() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOpenId'
      })
      if (res && res.result) {
        const openid = res.result.openid
        this.setData({
          openid: openid,
        })
        wx.setStorageSync('openid', openid)
      }

      console.log('用户 openid:', this.data.openid)
      return res.result.openid
    } catch (error) {
      console.error('获取 openid 失败:', error)
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadAddressList();
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
    this.loadAddressList();
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