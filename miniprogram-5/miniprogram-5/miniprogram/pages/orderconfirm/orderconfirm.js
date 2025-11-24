// pages/orderconfirm/orderconfirm.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab:0,
    cakecard:[],
    count:0 ,
    price: 0,
    deliveryfee:25,
    totalPrice:0,
    phone:"",
    message:"",
    tipsShow: false,
    consignee: [],
    selectedConsignee: null, 
    selectedIndex: -1, 
    showTimePicker: false,
    dates: [],
    times:[],
    starttimes: [],
    endtimes: [],
    selectedDate: '',
    selectedTime: '',
    selectedDateTime: '',
    showAddressPicker: false,
    addressList: [], // 存储地址数据
    selectedAddress: null
  },

  RequestPayment(totalPrice){
   const actualTotalPrice = this.data.totalPrice;
  console.log('实际支付金额:', actualTotalPrice, '元');
  console.log('转换为分:', Math.round(actualTotalPrice * 100));
  if (!actualTotalPrice || actualTotalPrice <= 0) {
    wx.showToast({ 
      title: '金额计算错误，请重新下单', 
      icon: 'none' 
    });
    return;
  }
    wx.cloud.callFunction({
      // 云函数名称
      name: 'wxpayFunctions',
      data: {
        // 调用云函数中的下单方法
        type: 'wxpay_order',
        total_fee:Math.round(actualTotalPrice * 100),
        // 业务其他参数...
        // 这里的参数会传入wxpayFunctions/wxpay_order/index.js下的函数，通过event获取
      },
      
      success: (res) => {
        console.log('云函数返回:', res);
        const paymentData = res.result.data;  
        // 唤起微信支付组件，完成支付
        wx.requestPayment({
          timeStamp: paymentData.timeStamp,
          nonceStr: paymentData.nonceStr,
          package: paymentData.packageVal,
          paySign: paymentData.paySign,
          signType: 'RSA', // 该参数为固定值
          success(payRes) {
            // 支付成功回调，实现自定义的业务逻辑
            console.log('支付成功:', payRes);
            wx.showToast({ title: '支付成功' });
          },
          fail(payErr) {
            // 支付失败回调
            console.error('支付失败:', payErr);
            wx.showToast({ title: '支付取消或失败', icon: 'none' });
          },
        });
      },
      fail: (err) => {
        console.error('调用云函数失败:', err);
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    
    });
  },
  // 打开地址弹窗
  openAddressPicker() {
    this.setData({ showAddressPicker: true })
  },

  // 关闭地址弹窗
  closeAddressPicker() {
    this.setData({ showAddressPicker: false })
  },

  // 选择地址
  selectAddress(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedAddress: this.data.addressList[index],
      showAddressPicker: false
    })
  },

  // 编辑地址
  editAddress(e) {
    const index = e.currentTarget.dataset.index
    wx.navigateTo({
      url: `/pages/add-address/add-address?editIndex=${index}`
    })
  },

  // 新增地址跳转
  navigateToAddAddress() {
    wx.navigateTo({
      url: '/pages/add-address/add-address'
    })
  },

  // 阻止滚动穿透
  preventScroll() {},
  openTimePicker() { 
    this.generateDates();
    this.setData({ showTimePicker: true });
  },

  // 生成可选日期（示例生成未来7天）
  generateDates() {
    const dates = [];
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 1; i < 8; i++) {
      const date = new Date();//获取当前时间
      date.setDate(date.getDate() + i);//获取日期几号（数字），+i后再转回日期格式
      dates.push({
        date: date.toLocaleDateString(),
        week: `周${days[date.getDay()]}`,//获取周几的数字再去对应days，提取对应的文字
        day: `${date.getMonth() + 1}/${date.getDate()}`//获取月份和日期的具体数字
      });
    }
    this.setData({ dates });
    this.generateTimes(dates[0].date); // 默认生成第一个日期的时间
  },

  // 生成时间段
  generateTimes(date) {
    const startHour = 12; // 12点开始
    const starttimes = [];
    const endtimes = [];
    let currentHour = startHour;
    let currentMinute = 0;

    while (currentHour < 20) { // 示例到晚8点结束
      const starttime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      starttimes.push(starttime);
      currentHour += 1;

      const endtime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      endtimes.push(endtime);
    }

    this.setData({ starttimes });
    this.setData({ endtimes });
    const times = starttimes.map((item, index)=>{
      return item + "-" + endtimes[index];
    });
    this.setData({times });
  },

  // 选择日期
  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
    this.generateTimes(date);
  },

  // 选择时间
  selectTime(e) {
    this.setData({ selectedTime: e.currentTarget.dataset.time });
  },

  // 确认选择
  confirmTime() {
    if (!this.data.selectedDate || !this.data.selectedTime) {
      wx.showToast({ title: '请选择完整时间', icon: 'none' });
      return;
    }
    
    this.setData({
      selectedDateTime: `${this.data.selectedDate} ${this.data.selectedTime}`,
      showTimePicker: false
    });
  },

  // 关闭时间选择
  closeTimePicker() {
    this.setData({ showTimePicker: false });
  },
  shopLocation() {
    const shopLocation = {
      lat: 22.486348, // 店铺纬度
      lng: 113.925079, // 店铺经度
      name: "OliCake",
      address: "深圳市蛇口街道蛇口老街129号中孚泰大厦4楼"
    }
    
    wx.navigateTo({
      url: `/pages/location/location?lat=${shopLocation.lat}&lng=${shopLocation.lng}&name=${shopLocation.name}&address=${shopLocation.address}`
    });
  },
 
  switchTab(e){
    
    let  tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({
      currentTab:tab
    })
    
  },
  createCone(){
    this.setData({tipsShow:true})
  },
  close(){
    this.setData({tipsShow:false})
  }
  ,
  btn(){
    wx.navigateTo({
      url: '/pages/consignee/consignee'
    })
  }
  /**
   * 生命周期函数--监听页面加载
   */
  ,
  onLoad() {
    this.onRefresh()
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
  this.onRefresh()
  },
  onRefresh:function(){
    wx.getStorage({
      key:"cart",
      success:res =>{
        let cakecard = res.data
        this.setData({
          cakecard:cakecard
        })
        
      },
      
     }),
     wx.getStorage({
      key:"total",
      success:res =>{
        let count = res.data.totalCount
        let price = res.data.totalPrice
        let totalPrice = price + this.data.deliveryfee
        this.setData({
          count:count,
          price:price,
          totalPrice:totalPrice
        })
        
      }
     })
     wx.getStorage({
      key:'consignee',
      success:res => {
        this.setData({ consignee: res.data || [] });
      }
     })
     wx.getStorage({
      key:'address',
      success:res => {
        this.setData({ addressList: res.data || [] });
      }
     })
  },
  selectConsignee(e) {
    const index = e.currentTarget.dataset.index; // 获取点击的索引
    const selectedConsignee = this.data.consignee[index]; // 获取对应提货人信息
    
    this.setData({
      selectedConsignee, // 更新选中状态
      selectedIndex: index,
      tipsShow: false    // 关闭弹窗
    });
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