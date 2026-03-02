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
    selectedLocation: null,
    housenum: '',
    tag: '',
    isDefault: false,
    addressId: null,
    tagchoose: ['家', '公司', '学校'],
    selectedTag: '',
    isEditMode: false, // 是否编辑模式
    latitude: null,
    longitude: null,
  },
  handleTagSelect(e) {
    const selectedTag = e.currentTarget.dataset.tag;
    this.setData({
      selectedTag
    });

  },
  navigateToMapChoose() {
    wx.navigateTo({
      url: '/pages/add-address/map-choose/map-choose'
    });


  },
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    }); //获取输入的姓名
  },
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    }); //获取输入的电话
  },
  onHousenumInput(e) {
    this.setData({
      housenum: e.detail.value
    }); //获取定位名称
  },
  delAddress() {  
    console.log(this.data.addressId)
    wx.cloud.callFunction({
      name:'deleteAddress',
      data:{
        addressId:this.data.addressId
      },
      success:(res)=>{
        console.log('地址删除成功',res);
      wx.showToast({
        title: '地址删除成功',
        icon: 'success'
      });
      wx.navigateBack()
      },
      fail: (err) => {
        console.error('地址删除失败:', err);
        wx.showToast({
          title: '地址删除失败',
          icon: 'err'
        });
        wx.navigateBack()
      }
    })
    
  },
  saveAddress() {
    const {name,phone,region,detail,housenum,selectedTag,selectedLocation,addressId} = this.data;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedRegion = region.trim();
    const trimmedDetail = detail.trim();
    const trimmedHousenum = housenum.trim();
    const trimmedSelectedTag = selectedTag.trim();
    const newAddress = {
      name: trimmedName,
      phone: trimmedPhone,
      region: trimmedRegion,
      detail: trimmedDetail,
      housenum: trimmedHousenum,
      selectedTag: trimmedSelectedTag,
      selectedLocation: selectedLocation
    };
    if (!trimmedName || !trimmedPhone || !trimmedRegion || !trimmedDetail) {
      wx.showToast({
        title: '请完善配送信息',
        icon: 'none' // 无图标，纯文字提示
      });
      return; // 终止执行
    }
    if (!addressId ) {
      wx.cloud.callFunction({
        // 云函数名称
        name: 'addAddress',
        data: {
          // 调用云函数中的下单方法
          newAddress: newAddress,
        },
        success: (res) => {
          console.log('地址创建成功',res);
          wx.showToast({
            title: '地址创建成功',
            icon: 'success'
          }); 
          wx.navigateBack()
        },
        fail: (err) => {
          console.error('地址创建失败:', err);
          wx.showToast({
            title: '地址创建失败',
            icon: 'err'
          });
          wx.navigateBack()
        }
    
      });
    }else{
      wx.cloud.callFunction({
        name:'updateAddress',
        data:{
          newAddress: newAddress,
          addressId:addressId
        },
        success:(res)=>{
          console.log('地址更新成功',res);
            wx.showToast({
              title: '更新成功',
              icon: "success"
            });
          wx.navigateBack()
        },
        fail:(err)=>{
          console.log('地址更新失败',err);
          wx.showToast({
            title: '更新失败',
            icon: "success"
          });
          wx.navigateBack()
        }
      })
    }
   
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    
    console.log('接收到的参数:', options)
    // 设置页面标题默认为新增地址
    let pageTitle = '新增地址'
    let isEditMode = false
    // 检查是否是编辑模式
    if (options. addressId !== undefined) {
      let addressId = options. addressId
      isEditMode = true
      pageTitle = '编辑地址' // 更新标题
      // 从云数据库读取地址
      wx.cloud.callFunction({
        name: 'getAddressDetail',
        data: {
          addressId: addressId,
        },
        success: (res) => {
          if (res.result && res.result.success) {
            console.log(res.result)
            const editAddress =res.result.address
            console.log(editAddress)
            this.setData({
              addressId:editAddress._id|| '',
              name: editAddress.address.name|| '',
              phone: editAddress.address.phone|| '',
              region: editAddress.address.region|| '',
              detail: editAddress.address.detail|| '',
              selectedLocation:editAddress.address.selectedLocation|| '',
              housenum:editAddress.address.housenum|| '',
              selectedTag:editAddress.address.selectedTag|| '',
            })
            
          } else {
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          this.setData({ isLoading: false })
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          })
        }
      })
      
    }   


    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: pageTitle
    })
    if (this.data.selectedLocation) {
      this.setData({
        latitude: parseFloat(this.data.selectedLocation.lat),
        longitude: parseFloat(this.data.selectedLocation.lng),
        markers: [{
          id: 0,
          latitude: parseFloat(this.data.selectedLocation.lat),
          longitude: parseFloat(this.data.selectedLocation.lng),
          width: 20,
          height: 30
        }]
      })
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