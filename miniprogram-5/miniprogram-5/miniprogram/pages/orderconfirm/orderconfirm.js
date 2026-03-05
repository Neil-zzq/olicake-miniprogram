// pages/orderconfirm/orderconfirm.js
const QQMapWX = require('../../utils/qqmap-wx-jssdk.min');
const qqmapsdk = new QQMapWX({
  key: 'NLEBZ-3LFLL-3VUP4-MGOSC-6IXOE-YDFMF'
});

// 会员折扣率映射
const DISCOUNT_MAP = {
  generalMember: 1.00,
  silver:        0.98,
  platinum:      0.95,
  blackGold:     0.90,
  diamond:       0.88,
}

Page({
  data: {
    currentTab: 0,
    cakecard: [],
    count: 0,
    price: 0,           // 原始商品价（折扣前）
    discountRate: 1.0,  // 会员折扣率
    discountAmount: 0,  // 会员折扣减免金额
    deliveryfee: 0,
    totalPrice: 0,
    phone: "",
    message: "",
    tipsShow: false,
    consignee: [],
    selectedConsignee: null,
    selectedIndex: -1,
    showTimePicker: false,
    dates: [],
    times: [],
    starttimes: [],
    endtimes: [],
    selectedDate: '',
    selectedTime: '',
    selectedDateTime: '',
    showAddressPicker: false,
    addressList: [],
    selectedAddress: null,
    methodId: 0,
    distanceForCount: 0,
    openid: '',
    // 代金券相关
    voucherList: [],
    selectedVoucher: null,
    voucherDeduction: 0,
    showVoucherPicker: false,
  },

  onSelectMethod(e) {
    this.setData({ methodId: e.currentTarget.dataset.id })
    this.calculateDeliveryFee()
  },

  deliInfoForPayment() {
    const { currentTab, selectedConsignee, selectedDateTime, selectedAddress, methodId } = this.data
    if (currentTab == 0) {
      if (selectedConsignee && selectedDateTime) {
        this.RequestPayment()
      } else {
        wx.showToast({ title: '请完善自提信息', icon: 'error' })
      }
    } else {
      if (selectedAddress && methodId && selectedDateTime) {
        this.RequestPayment()
      } else {
        wx.showToast({ title: '请完善配送信息', icon: 'error' })
      }
    }
  },

  RequestPayment() {
    const actualTotalPrice = this.data.totalPrice
    if (!actualTotalPrice || actualTotalPrice <= 0) {
      wx.showToast({ title: '金额计算错误，请重新下单', icon: 'none' })
      return
    }
    wx.cloud.callFunction({
      name: 'wxpayFunctions',
      data: {
        type: 'wxpay_order',
        total_fee: Math.round(actualTotalPrice * 100),
        product_info: this.data.cakecard,
        customer_info: {
          deliveryMethod: this.data.currentTab,
          selectedDateTime: this.data.selectedDateTime,
          selectedAddress: this.data.selectedAddress,
          selectedConsignee: this.data.selectedConsignee,
          deliveryMethod2: this.data.methodId,
          deliveryfee: this.data.deliveryfee,
          // 会员折扣与代金券信息（用于 callback 核销）
          originalPrice: this.data.price,
          discountRate: this.data.discountRate,
          discountAmount: this.data.discountAmount,
          voucherId: this.data.selectedVoucher ? this.data.selectedVoucher._id : null,
          voucherDeduction: this.data.voucherDeduction,
        }
      },
      success: (res) => {
        const paymentData = res.result.payment
        wx.requestPayment({
          timeStamp: paymentData.timeStamp,
          nonceStr: paymentData.nonceStr,
          package: paymentData.package,
          paySign: paymentData.paySign,
          signType: paymentData.signType || 'MD5',
          success() {
            wx.showToast({ title: '支付成功' })
            wx.navigateTo({ url: '../ordercenter/ordercenter' })
          },
          fail() {
            wx.showToast({ title: '支付取消或失败', icon: 'none' })
          },
        })
      },
      fail: (err) => {
        console.error('调用云函数失败:', err)
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      }
    })
  },

  // ===== 代金券选择 =====
  openVoucherPicker() {
    this.setData({ showVoucherPicker: true })
  },
  closeVoucherPicker() {
    this.setData({ showVoucherPicker: false })
  },
  selectVoucher(e) {
    const index = e.currentTarget.dataset.index
    const voucher = this.data.voucherList[index]
    this.setData({
      selectedVoucher: voucher,
      voucherDeduction: voucher.amount,
      showVoucherPicker: false
    })
    this.calcTotal()
  },
  removeVoucher() {
    this.setData({
      selectedVoucher: null,
      voucherDeduction: 0
    })
    this.calcTotal()
  },

  // 加载代金券列表
  loadVouchers(openid) {
    if (!openid) return
    wx.cloud.callFunction({
      name: 'getVouchers',
      data: { openid },
      success: (res) => {
        if (res.result && res.result.code === 0) {
          this.setData({ voucherList: res.result.vouchers || [] })
        }
      },
      fail: () => {}
    })
  },

  // 加载会员折扣率
  loadMemberDiscount(openid) {
    if (!openid) return
    // 优先从本地缓存取
    const cached = wx.getStorageSync('userInfo') || {}
    const usertype = cached.usertype || ''
    const rate = DISCOUNT_MAP[usertype] || 1.0
    this.setData({ discountRate: rate })
    this.calcTotal()

    // 同时从云端刷新（避免缓存过时）
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: { openid },
      success: (res) => {
        if (res.result && res.result.success && res.result.userInfo) {
          const serverType = res.result.userInfo.usertype || ''
          const serverRate = DISCOUNT_MAP[serverType] || 1.0
          if (serverRate !== this.data.discountRate) {
            this.setData({ discountRate: serverRate })
            this.calcTotal()
          }
          // 更新本地缓存
          const updatedCache = wx.getStorageSync('userInfo') || {}
          wx.setStorageSync('userInfo', { ...updatedCache, usertype: serverType })
        }
      },
      fail: () => {}
    })
  },

  // 计算最终合计金额
  calcTotal() {
    const price = parseFloat(this.data.price) || 0
    const discountRate = this.data.discountRate || 1.0
    const voucherDeduction = this.data.voucherDeduction || 0
    const deliveryfee = parseFloat(this.data.deliveryfee) || 0

    const discountedPrice = parseFloat((price * discountRate).toFixed(2))
    const discountAmount = parseFloat((price - discountedPrice).toFixed(2))
    let totalPrice = discountedPrice - voucherDeduction + deliveryfee
    totalPrice = Math.max(0.01, totalPrice)
    totalPrice = parseFloat(totalPrice.toFixed(2))

    this.setData({ discountAmount, totalPrice })
  },

  // ===== 地址弹窗 =====
  openAddressPicker() { this.setData({ showAddressPicker: true }) },
  closeAddressPicker() { this.setData({ showAddressPicker: false }) },
  selectAddress(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ selectedAddress: this.data.addressList[index], showAddressPicker: false })
    this.calculateDeliveryFee()
  },
  editAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/add-address/add-address?addressId=${id}` })
  },
  navigateToAddAddress() {
    wx.navigateTo({ url: '/pages/add-address/add-address' })
  },

  preventScroll() {},

  // ===== 时间选择 =====
  openTimePicker() {
    this.generateDates()
    this.setData({ showTimePicker: true })
  },
  generateDates() {
    const dates = []
    const days = ['日', '一', '二', '三', '四', '五', '六']
    for (let i = 1; i < 8; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      dates.push({
        date: `${year}年${month}月${day}日`,
        week: `周${days[date.getDay()]}`,
        day: `${month}/${day}`
      })
    }
    this.setData({ dates })
    this.generateTimes(dates[0].date)
  },
  generateTimes(date) {
    const starttimes = []
    const endtimes = []
    let currentHour = 12
    while (currentHour < 20) {
      starttimes.push(`${String(currentHour).padStart(2, '0')}:00`)
      currentHour += 1
      endtimes.push(`${String(currentHour).padStart(2, '0')}:00`)
    }
    const times = starttimes.map((item, i) => item + '-' + endtimes[i])
    this.setData({ starttimes, endtimes, times })
  },
  selectDate(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.date })
    this.generateTimes(e.currentTarget.dataset.date)
  },
  selectTime(e) {
    this.setData({ selectedTime: e.currentTarget.dataset.time })
  },
  confirmTime() {
    if (!this.data.selectedDate || !this.data.selectedTime) {
      wx.showToast({ title: '请选择完整时间', icon: 'none' })
      return
    }
    this.setData({
      selectedDateTime: `${this.data.selectedDate} ${this.data.selectedTime}`,
      showTimePicker: false
    })
  },
  closeTimePicker() { this.setData({ showTimePicker: false }) },

  shopLocation() {
    wx.navigateTo({
      url: '/pages/location/location?lat=22.486348&lng=113.925079&name=OliCake&address=深圳市蛇口街道蛇口老街129号中孚泰大厦4楼'
    })
  },

  switchTab(e) {
    this.setData({ currentTab: parseInt(e.currentTarget.dataset.tab) })
  },
  createCone() { this.setData({ tipsShow: true }) },
  close() { this.setData({ tipsShow: false }) },
  btn() { wx.navigateTo({ url: '/pages/consignee/consignee' }) },

  // ===== 数据加载 =====
  onLoad() {
    this.onRefresh()
  },

  async loadAddressList() {
    if (!this.data.openid) {
      await this.initOpenId()
      return
    }
    wx.cloud.callFunction({
      name: 'getAddressList',
      data: { openid: this.data.openid },
      success: (res) => {
        if (res.result && res.result.success) {
          this.setData({ addressList: res.result.addressList })
        }
      }
    })
  },

  async loadConsigneeList() {
    if (!this.data.openid) {
      await this.initOpenId()
      return
    }
    wx.cloud.callFunction({
      name: 'getConsigneeList',
      data: { openid: this.data.openid },
      success: (res) => {
        if (res.result && res.result.success) {
          this.setData({ consignee: res.result.consigneeList })
        }
      }
    })
  },

  async initOpenId() {
    const storedOpenId = wx.getStorageSync('openid')
    if (storedOpenId) {
      this.setData({ openid: storedOpenId })
      return storedOpenId
    }
    return await this.getOpenId()
  },

  async getOpenId() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getOpenId' })
      if (res && res.result) {
        const openid = res.result.openid
        this.setData({ openid })
        wx.setStorageSync('openid', openid)
        return openid
      }
    } catch (e) {
      console.error('获取 openid 失败:', e)
    }
  },

  onShow() {
    this.onRefresh()
  },

  onRefresh() {
    wx.getStorage({
      key: 'cart',
      success: res => {
        this.setData({ cakecard: res.data })
      }
    })
    wx.getStorage({
      key: 'total',
      success: res => {
        const price = res.data.totalPrice || 0
        this.setData({ count: res.data.totalCount, price })
        this.calcTotal()
      }
    })
    this.loadConsigneeList()
    this.loadAddressList()

    // 加载会员折扣和代金券
    const cachedInfo = wx.getStorageSync('userInfo') || {}
    const openid = cachedInfo.openid || wx.getStorageSync('openid') || ''
    if (openid) {
      this.setData({ openid })
      this.loadMemberDiscount(openid)
      this.loadVouchers(openid)
    }
  },

  selectConsignee(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedConsignee: this.data.consignee[index],
      selectedIndex: index,
      tipsShow: false
    })
  },

  calculateDrivingDistance() {
    const startPoint = '22.486348,113.925079'
    const endPoint = this.data.selectedAddress.selectedLocation.lat + ',' + this.data.selectedAddress.selectedLocation.lng
    return new Promise((resolve, reject) => {
      qqmapsdk.direction({
        mode: 'driving',
        from: startPoint,
        to: endPoint,
        policy: 'SHORT_DISTANCE',
        success: (res) => {
          const distance = res.result.routes[0].distance
          this.setData({ distanceForCount: distance })
          resolve(distance)
        },
        fail: reject
      })
    })
  },

  async calculateDeliveryFee() {
    const distance = await this.calculateDrivingDistance()
    const methodId = this.data.methodId
    let deliveryfee = 0

    if (distance > 3000) {
      if (methodId == 10) {
        if (distance <= 5000)       deliveryfee = distance * 3.84 / 1000
        else if (distance <= 10000) deliveryfee = distance * 4.75 / 1000
        else if (distance <= 15000) deliveryfee = distance * 4.29 / 1000
        else                        deliveryfee = distance * 3.3  / 1000
      } else if (methodId == 11) {
        if (distance <= 10000) {
          this.setData({ methodId: 10 })
          wx.showToast({ title: '10公里以上路程可选择顺风车', icon: 'error' })
          return
        }
        deliveryfee = (distance * 1.35 + 7.08) / 1000
      }
    }

    this.setData({ deliveryfee: parseFloat(deliveryfee.toFixed(2)) })
    this.calcTotal()
  },

  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
})
