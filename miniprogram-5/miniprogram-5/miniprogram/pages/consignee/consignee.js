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
   // 1. 先读取本地存储中的历史数据
   wx.getStorage({
    key:"consignee",
    success:res =>{
     // 2. 获取已有提货人数组
     const oldConsigneeList = res.data || []; // 处理无数据情况
      
     // 3. 创建新提货人对象（避免引用问题）
     const newConsignee = {
      name: trimmedName,
      code: trimmedCode
     };
     
     // 4. 追加到数组
     oldConsigneeList.push(newConsignee);

      wx.setStorage({
        data:oldConsigneeList,
        key:'consignee',
        success: () =>{
          wx.showToast({title: '保存成功',})
          wx.navigateBack({url: '/pages/orderconfirm/orderconfirm'})
        }
       })
       
    },
    fail:err=>{
     // 首次无数据时，创建新数组
     const newConsignee = { name, code };
      wx.setStorage({
        data:[{ 
          name: trimmedName, 
          code: trimmedCode 
        }],
        key:'consignee',
        success:()=>{
          wx.showToast({title: '保存成功',})
          wx.navigateBack({url: '/pages/orderconfirm/orderconfirm'})
        }
      })
    }
   })
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