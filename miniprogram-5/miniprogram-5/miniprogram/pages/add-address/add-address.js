// pages/add-address/add-address.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    phone: '',
    region: '',
    detail: '',
    housenum:'',
    tag: '',
    isDefault: false,
    editIndex: -1,
    tagchoose:['家','公司','学校'],
    selectedTag: ''
  },
  handleTagSelect(e) {
    const selectedTag = e.currentTarget.dataset.tag;
    this.setData({ selectedTag });
    
  },
  navigateToMapChoose() {
    wx.navigateTo({
      url: '/pages/add-address/map-choose/map-choose'
    });
    
  },
  onNameInput(e){
    this.setData({name:e.detail.value });//获取输入的姓名
  },
  onPhoneInput(e){
    this.setData({phone:e.detail.value });//获取输入的电话
  },
  onHousenumInput(e){
    this.setData({housenum:e.detail.value });//获取定位名称
  },
  
  saveAddress(){
    const {name,phone,region,detail,housenum,selectedTag} = this.data;
    console.log(this.data)
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedRegion = region.trim();
    const trimmedDetail = detail.trim();
    const trimmedHousenum = housenum.trim();
    const trimmedSelectedTag = selectedTag.trim();
    
     if (!trimmedName || !trimmedPhone||!trimmedRegion||!trimmedDetail||trimmedSelectedTag) {
       wx.showToast({
         title: '请完善配送信息',
         icon: 'none' // 无图标，纯文字提示
       });
       return; // 终止执行
     }
    // 1. 先读取本地存储中的历史数据
    wx.getStorage({
     key:"address",
     success:res =>{
      // 2. 获取已有地址数组
      const oldAddressList = res.data || []; // 处理无数据情况
       
      // 3. 创建地址对象（避免引用问题）
      const newAddress = {
       name: trimmedName,
       phone: trimmedPhone,
       region:trimmedRegion,
       detail:trimmedDetail,
       housenum:trimmedHousenum,
       selectedTag:trimmedSelectedTag
      };
      
      // 4. 追加到数组
      oldAddressList.push(newAddress);
 
       wx.setStorage({
         data:oldAddressList,
         key:'address',
         success: () =>{
           wx.showToast({title: '保存成功',})
           wx.navigateBack({url: '/pages/orderconfirm/orderconfirm'})
         }
        })
        
     },
     fail:err=>{
      // 首次无数据时，创建新数组
      const newAddress = { name,phone,region,detail };
       wx.setStorage({
         data:[{ 
          name: trimmedName,
          phone: trimmedPhone,
          region:trimmedRegion,
          detail:trimmedDetail,
          housenum:trimmedHousenum,
          selectedTag:trimmedSelectedTag
         }],
         key:'address',
         success:()=>{
           wx.showToast({title: '保存成功',})
           wx.navigateBack({url: '/pages/orderconfirm/orderconfirm'})
         }
       })
     }
    })
   },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.editIndex !== undefined) {
      // 获取编辑数据逻辑
    }
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