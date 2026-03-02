// pages/orderconfirm/orderconfirm.js
const QQMapWX = require('../../utils/qqmap-wx-jssdk.min');
const qqmapsdk = new QQMapWX({
  key: 'NLEBZ-3LFLL-3VUP4-MGOSC-6IXOE-YDFMF'
});
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 0,
    cakecard: [],
    count: 0,
    price: 0,
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
    addressList: [], // 存储地址数据
    selectedAddress: null,
    methodId: 0,
    distanceForCount: 0,
    openid: '',
  },
  onSelectMethod(e) {
    const methodId = -1;
    this.setData({
      methodId: e.currentTarget.dataset.id
    })
    this.calculateDeliveryFee()
  },
  deliInfoForPayment() {
    const {
      currentTab,
      selectedConsignee,
      selectedDateTime,
      selectedAddress,
      methodId
    } = this.data;
    if (currentTab == 0) {
      if (selectedConsignee && selectedDateTime) {
        this.RequestPayment()
      } else {
        wx.showToast({
          title: '请完善自提信息',
          icon: "error"
        })
      }
    } else {
      if (selectedAddress && methodId && selectedDateTime) {
        this.RequestPayment()
      } else {
        wx.showToast({
          title: '请完善配送信息',
          icon: "error"
        })
      }
    }
  },
  RequestPayment(totalPrice) {
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
        total_fee: Math.round(actualTotalPrice * 100),
        product_info: this.data.cakecard,
        customer_info: {
          deliveryMethod: this.data.currentTab,
          selectedDateTime: this.data.selectedDateTime,
          selectedAddress: this.data.selectedAddress,
          selectedConsignee: this.data.selectedConsignee,
          deliveryMethod2: this.data.methodId,
          deliveryfee: this.data.deliveryfee,

        }

        // 业务其他参数...
        // 这里的参数会传入wxpayFunctions/wxpay_order/index.js下的函数，通过event获取
      },

      success: (res) => {
        console.log('云函数返回:', res);
        const paymentData = res.result.payment;
        // 唤起微信支付组件，完成支付
        wx.requestPayment({
          timeStamp: paymentData.timeStamp,
          nonceStr: paymentData.nonceStr,
          package: paymentData.package,
          paySign: paymentData.paySign,
          signType: paymentData.signType || 'MD5',
          success(payRes) {
            // 支付成功回调，实现自定义的业务逻辑
            console.log('支付成功:', payRes);
            wx.showToast({
              title: '支付成功'
            });
            wx.navigateTo({
              url: '../ordercenter/ordercenter',
            })
          },
          fail(payErr) {
            // 支付失败回调
            console.error('支付失败:', payErr);
            wx.showToast({
              title: '支付取消或失败',
              icon: 'none'
            });
          },
        });
      },
      fail: (err) => {
        console.error('调用云函数失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }

    });
  },
  // 打开地址弹窗
  openAddressPicker() {
    this.setData({
      showAddressPicker: true
    })
  },

  // 关闭地址弹窗
  closeAddressPicker() {
    this.setData({
      showAddressPicker: false
    })
  },

  // 选择地址
  selectAddress(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedAddress: this.data.addressList[index],
      showAddressPicker: false
    })
    this.calculateDeliveryFee()
  },

  // 编辑地址
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
    this.setData({
      showTimePicker: true
    });
  },

  // 生成可选日期（示例生成未来7天）
  generateDates() {
    const dates = [];
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 1; i < 8; i++) {
      const date = new Date(); //获取当前时间 
      date.setDate(date.getDate() + i); //获取日期几号（数字），+i后再转回日期格式
      // 获取年、月、日
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      // 生成固定的中文日期格式
      const dateStr = `${year}年${month}月${day}日`;
      dates.push({
        date: dateStr,
        week: `周${days[date.getDay()]}`, //获取周几的数字再去对应days，提取对应的文字
        day: `${date.getMonth() + 1}/${date.getDate()}` //获取月份和日期的具体数字
      });
    }
    this.setData({
      dates
    });
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

    this.setData({
      starttimes
    });
    this.setData({
      endtimes
    });
    const times = starttimes.map((item, index) => {
      return item + "-" + endtimes[index];
    });
    this.setData({
      times
    });
  },

  // 选择日期
  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({
      selectedDate: date
    });
    this.generateTimes(date);
  },

  // 选择时间
  selectTime(e) {
    this.setData({
      selectedTime: e.currentTarget.dataset.time
    });
  },

  // 确认选择
  confirmTime() {
    console.log(this.data.selectedDate)
    console.log(this.data.selectedTime)
    if (!this.data.selectedDate || !this.data.selectedTime) {
      wx.showToast({
        title: '请选择完整时间',
        icon: 'none'
      });
      return;
    }

    this.setData({
      selectedDateTime: `${this.data.selectedDate} ${this.data.selectedTime}`,
      showTimePicker: false
    });
  },

  // 关闭时间选择
  closeTimePicker() {
    this.setData({
      showTimePicker: false
    });
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

  switchTab(e) {

    let tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({
      currentTab: tab
    })

  },
  createCone() {
    this.setData({
      tipsShow: true
    })
  },
  close() {
    this.setData({
      tipsShow: false
    })
  },
  btn() {
    wx.navigateTo({
      url: '/pages/consignee/consignee'
    })
  }
  /**
   * 生命周期函数--监听页面加载
   */
  ,
  onLoad() {
    this.onRefresh();
    
  },
  //从数据库加载用户地址列表
  async loadAddressList(){
     if(!this.data.openid){
      await this.initOpenId()
      return
    }
    wx.cloud.callFunction({
      name: 'getAddressList',
      data: {openid: this.data.openid},
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
  //从数据库加载提货人名单
  async loadConsigneeList(){ 
    if(!this.data.openid){
      await this.initOpenId()
      return
    }
    wx.cloud.callFunction({
      name: 'getConsigneeList',
      data: {openid: this.data.openid},
      success: (res) => {
        if (res.result && res.result.success) {
         const consigneeList = res.result.consigneeList
          this.setData({
            consignee: consigneeList
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
  onRefresh: function () {
    wx.getStorage({
        key: "cart",
        success: res => {
          let cakecard = res.data
          this.setData({
            cakecard: cakecard
          })

        },

      }),
      wx.getStorage({
        key: "total",
        success: res => {
          let count = res.data.totalCount
          let price = res.data.totalPrice
          let totalPrice = price + parseFloat(this.data.deliveryfee)
          totalPrice = totalPrice.toFixed(2)
          this.setData({
            count: count,
            price: price,
            totalPrice: totalPrice
          })

        }
      })
      this.loadConsigneeList()
      this.loadAddressList()
  
  },
  selectConsignee(e) {
    const index = e.currentTarget.dataset.index; // 获取点击的索引
    const selectedConsignee = this.data.consignee[index]; // 获取对应提货人信息

    this.setData({
      selectedConsignee, // 更新选中状态
      selectedIndex: index,
      tipsShow: false // 关闭弹窗
    });
  },
  // 计算驾驶距离
  calculateDrivingDistance() {
    const startPoint = "22.486348,113.925079";
    const endPoint = this.data.selectedAddress.selectedLocation.lat + "," + this.data.selectedAddress.selectedLocation.lng;
    return new Promise((resolve, reject) => {
      qqmapsdk.direction({
        mode: 'driving', // 驾车模式
        from: startPoint, // 起点坐标，格式：'lat,lng'
        to: endPoint, // 终点坐标，格式：'lat,lng'
        policy: 'SHORT_DISTANCE', // 关键参数：获取多条路径
        success: (res) => {
          // 提取距离（单位：米）
          const distance = res.result.routes[0].distance
          resolve(distance)
          this.setData({
            distanceForCount: distance
          })
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },
  //计算配送费
  async calculateDeliveryFee() {
    const distance = await this.calculateDrivingDistance();
    console.log(this.data.methodId)
    const distanceForCount = distance;
    const methodId = this.data.methodId;
    if (distanceForCount <= 3000) {
      this.setData({
        deliveryfee: 0
      })
    } else {
      if (methodId == 10) {
        if (distanceForCount > 3000 && distanceForCount <= 5000) {
          let deliveryfee = distanceForCount * 3.84 / 1000;
          let deliveryfeeForCount = deliveryfee.toFixed(2);
          this.setData({
            deliveryfee: deliveryfeeForCount,
          })
        } else if (distanceForCount > 5000 && distanceForCount <= 10000) {
          let deliveryfee = distanceForCount * 4.75 / 1000;
          let deliveryfeeForCount = deliveryfee.toFixed(2);
          this.setData({
            deliveryfee: deliveryfeeForCount,
          })
        } else if (distanceForCount > 10000 && distanceForCount <= 15000) {
          let deliveryfee = distanceForCount * 4.29 / 1000;
          let deliveryfeeForCount = deliveryfee.toFixed(2);
          this.setData({
            deliveryfee: deliveryfeeForCount,
          })
        } else {
          let deliveryfee = distanceForCount * 3.3 / 1000;
          let deliveryfeeForCount = deliveryfee.toFixed(2);
          this.setData({
            deliveryfee: deliveryfeeForCount,
          })
        }


      } else if (methodId == 11) {
        if (distanceForCount <= 10000) {
          this.setData({
              methodId: 10
            }),
            wx.showToast({
              title: '10公里以上路程可选择顺风车模式',
              icon: "error"
            })
        } else {
          let deliveryfee = (distanceForCount * 1.35 + 7.08) / 1000;
          let deliveryfeeForCount = deliveryfee.toFixed(2);

          this.setData({
            deliveryfee: deliveryfeeForCount,
          })
        }
      }
    }
    console.log(this.data.deliveryfee)
    this.onRefresh()
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