// pages/consignee/consignee.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    consigneeitems:{},
    name:'',
    code:'',
    consignee:[],
  },
  /**
   * 添加提货信息
   */
  bindNameInput(e){
    this.setData({name:e.detail.value });
  },
  bindCodeInput(e){
    this.setData({code:e.detail.value });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  saveBtn(){
   const {name,code} = this.data;
   const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName || !trimmedCode) {
      wx.showToast({
        title: '姓名和提货码不能为空',
        icon: 'none' // 无图标，纯文字提示
      });
      return; // 终止执行
    }
    
   wx.cloud.callFunction({
    // 云函数名称
    name: 'addConsignee',
    data: {
      // 调用云函数中的下单方法
      name: this.data.name,
      code:this.data.code,
    },
    success: (res) => {
      console.log('提货人创建成功',res);
      wx.showToast({
        title: '提货人创建成功',
        icon: 'success'
      });
      wx.navigateBack()
    },
    fail: (err) => {
      console.error('提货人创建失败:', err);
      wx.showToast({
        title: '提货人创建失败',
        icon: 'err'
      });
      wx.navigateBack()
    }

  });
  },
  onLoad(options) {

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